/**
 * Phase 15 corpus evaluation runner (docs/TESTING.md §1/§3, plans/phase-15/plan.md).
 *
 * Drives the 15 frozen corpus cases through a running WazehTerms HTTP stack
 * (production demo-upload route, a local live server, or the dry-run e2e
 * server), one JSONL line per case for resumability, then scores the run.
 *
 *   # dry run (fake Gemini, no Sanity, zero cost) — proves the harness:
 *   npx tsx scripts/run-eval.ts --mode=dry
 *   # live production (paced for the Free tier; resumable):
 *   npx tsx scripts/run-eval.ts --mode=production
 *   # score a completed results file:
 *   npx tsx scripts/run-eval.ts --mode=score --date=2026-10-02
 *
 * Artifacts land in test-corpus/eval/. JSONL lines contain fictional corpus
 * content only (SECURITY.md §6 protects worker data; the corpus is public
 * and visibly fictional). No prompts, keys, or signed-secrets are written.
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, appendFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { scoreCase, scoreRun, type CaseRun, type IssuedView, type ReportView } from '../src/corpus/score.js';
import { TruthSchema, type Truth } from '../src/corpus/truth-schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const corpusDir = path.join(repoRoot, 'test-corpus');
const evalDir = path.join(corpusDir, 'eval');

const SLEEP_MS_BETWEEN_CASES = 13_000;

interface Args {
  mode: 'dry' | 'production' | 'local' | 'score';
  date: string;
  baseUrl: string;
  cases?: string[];
  /** `--results=<file>`: score this JSONL instead of `results-<date>.jsonl`. */
  results?: string;
  /** `--freeze=<file>`: freeze manifest (default freeze-2026-10-02.json). */
  freeze: string;
  /**
   * `--max-calls=<n>`: hard stop on extraction POST attempts (each attempt
   * is one potential Gemini provider call, including runner-level
   * retries). Default 45 for a 15-case run (freeze-2026-10-03-prod.json
   * runPolicy.geminiCallsHardCap). A budget alert is not a cap; this is.
   */
  maxCalls: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const prefix = `--${name}=`;
    const found = argv.find((value) => value.startsWith(prefix));
    return found?.slice(prefix.length);
  };
  const mode = (get('mode') ?? 'dry') as Args['mode'];
  return {
    mode,
    date: get('date') ?? new Date().toISOString().slice(0, 10),
    baseUrl: get('base-url') ?? 'https://wazehterms-957765366699.asia-south1.run.app',
    cases: get('cases')?.split(','),
    results: get('results'),
    freeze: get('freeze') ?? 'freeze-2026-10-02.json',
    maxCalls: Number(get('max-calls') ?? 45),
  };
}

function listCases(): string[] {
  // source-catalog.csv is a headers-only scaffold — cases are directories
  // with a truth.json (TESTING.md §1).
  return readdirSync(corpusDir)
    .filter((name) => /^TC-\d{3}$/.test(name) && existsSync(path.join(corpusDir, name, 'truth.json')))
    .sort();
}

function loadTruth(caseId: string): Truth {
  const raw = JSON.parse(readFileSync(path.join(corpusDir, caseId, 'truth.json'), 'utf8')) as unknown;
  return TruthSchema.parse(raw);
}

function loadSampleText(caseId: string): Record<'offer' | 'contract', string[]> {
  const raw = JSON.parse(readFileSync(path.join(corpusDir, caseId, 'sample-text.json'), 'utf8')) as Record<
    string,
    { lines?: string[] }
  >;
  const pick = (role: string): string[] => {
    const entry = raw[role] ?? Object.values(raw).find((candidate) => (candidate as { role?: string }).role === role);
    return entry && 'lines' in entry ? (entry.lines as string[]) : ((entry as unknown as string[]) ?? []);
  };
  return { offer: pick('offer'), contract: pick('contract') };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FetchOutcome {
  status: number;
  body: Record<string, unknown> | null;
  ms: number;
}

async function timedFetch(url: string, init: RequestInit): Promise<FetchOutcome> {
  const started = Date.now();
  const response = await fetch(url, init);
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: response.status, body, ms: Date.now() - started };
}

/** Retries re-fire the provider call, so the budget charges each attempt. */
async function postWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
  budget?: { attempts: number },
  maxCalls?: number,
): Promise<FetchOutcome> {
  let last: FetchOutcome | null = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (attempt > 1 && budget && maxCalls) chargeExtractionAttempt(budget, maxCalls);
    last = await timedFetch(url, init);
    if (last.status !== 429 && last.status !== 503) return last;
    const retryAfter = Number((last.body as { error?: { retryAfterSeconds?: number } })?.error?.retryAfterSeconds ?? 20);
    console.log(`  [retry] ${last.status}; waiting ${retryAfter}s (attempt ${attempt}/${attempts})`);
    await sleep(retryAfter * 1000);
  }
  return last as FetchOutcome;
}

/** Abort when the provider-call budget is spent; the run stays resumable. */
class CallBudgetExhausted extends Error {}
function chargeExtractionAttempt(budget: { attempts: number }, maxCalls: number): void {
  budget.attempts += 1;
  if (budget.attempts > maxCalls) {
    throw new CallBudgetExhausted(
      `extraction-call budget exhausted: ${maxCalls} POST attempts charged (hard cap, freeze runPolicy)`,
    );
  }
}

async function runCase(
  caseId: string,
  truth: Truth,
  baseUrl: string,
  budget: { attempts: number },
  maxCalls: number,
): Promise<Record<string, unknown>> {
  const errors: string[] = [];
  const form = new FormData();
  for (const document of truth.documents) {
    const bytes = readFileSync(path.join(corpusDir, caseId, document.file));
    form.append(document.role, new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), document.file);
  }
  chargeExtractionAttempt(budget, maxCalls);
  const extraction = await postWithRetry(
    `${baseUrl}/api/v1/extractions`,
    { method: 'POST', body: form },
    3,
    budget,
    maxCalls,
  );
  if (extraction.status !== 200) {
    errors.push(`extraction:${extraction.status}`);
    return { caseId, mode: 'error', errors, extractionMs: extraction.ms, analysisMs: 0, issued: null, report: null };
  }
  const issuedBody = extraction.body as { issuedExtraction: IssuedView; proof: unknown };
  await sleep(2_000);
  const analysis = await postWithRetry(`${baseUrl}/api/v1/analyses`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ issuedExtraction: issuedBody.issuedExtraction, proof: issuedBody.proof, corrections: [] }),
  });
  if (analysis.status !== 200) {
    errors.push(`analysis:${analysis.status}`);
    return {
      caseId,
      mode: 'error',
      errors,
      extractionMs: extraction.ms,
      analysisMs: analysis.ms,
      issued: issuedBody.issuedExtraction,
      report: null,
    };
  }
  return {
    caseId,
    mode: 'ok',
    errors,
    extractionMs: extraction.ms,
    analysisMs: analysis.ms,
    issued: issuedBody.issuedExtraction,
    report: analysis.body,
  };
}

async function startDryServer(): Promise<{ child: ReturnType<typeof spawn>; baseUrl: string }> {
  const port = 3015;
  const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/e2e-server.ts'], {
    cwd: path.join(repoRoot, 'api'),
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PORT: String(port),
      SAMPLE_MODE_ENABLED: 'true',
      CUSTOM_UPLOAD_ENABLED: 'true',
      REVIEW_HMAC_SECRET: 'eval-dry-run-secret-eval-dry-run-32b',
      SANITY_CONTEXT_MCP_URL: '',
      SANITY_ORGANIZATION_TOKEN: '',
      SANITY_READ_TOKEN: '',
      // Route fails closed without a truthy key before reaching the fake
      // service — a dummy value keeps the fail-closed gate open for the
      // fixture provider (never a real credential).
      GEMINI_API_KEY: 'dry-run-dummy-key-not-a-credential',
      E2E_CORPUS_FIXTURES_DIR: path.join(repoRoot, 'test-corpus'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(`[dry] ${chunk}`));
  const baseUrl = `http://localhost:${port}`;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(500);
    try {
      const health = await fetch(`${baseUrl}/health`);
      if (health.ok) return { child, baseUrl };
    } catch {
      /* not up yet */
    }
  }
  throw new Error('dry server did not start');
}

async function main(): Promise<void> {
  const args = parseArgs();
  const caseIds = args.cases ?? listCases();
  const jsonlPath = path.join(evalDir, `results-${args.date}.jsonl`);

  if (args.mode === 'score') {
    const resultsPath = args.results
      ? path.isAbsolute(args.results)
        ? args.results
        : path.join(evalDir, args.results)
      : jsonlPath;
    scoreResultsFile(resultsPath, args.date, args.freeze);
    return;
  }

  let stopServer: (() => void) | null = null;
  let baseUrl = args.baseUrl;
  const callBudget = { attempts: 0 };
  if (args.mode === 'dry') {
    console.log('== dry run: e2e-server with fixture Gemini, no Sanity ==');
    const started = await startDryServer();
    stopServer = () => started.child.kill();
    baseUrl = started.baseUrl;
  } else if (args.mode === 'local') {
    baseUrl = 'http://localhost:3000';
    console.log(`== local live server expected at ${baseUrl} ==`);
  } else {
    console.log(`== production run against ${baseUrl} (paced ${SLEEP_MS_BETWEEN_CASES / 1000}s, extraction-call cap ${args.maxCalls}) ==`);
  }

  try {
    for (let index = 0; index < caseIds.length; index += 1) {
      const caseId = caseIds[index];
      if (jsonlHas(jsonlPath, caseId)) {
        console.log(`[${index + 1}/${caseIds.length}] ${caseId} already recorded — skip`);
        continue;
      }
      const truth = loadTruth(caseId);
      console.log(`[${index + 1}/${caseIds.length}] ${caseId} …`);
      const result = await runCase(caseId, truth, baseUrl, callBudget, args.maxCalls);
      appendFileSync(jsonlPath, `${JSON.stringify({ recordedAt: new Date().toISOString(), ...result })}\n`);
      console.log(`  ${result.mode} (${result.errors.join(',') || 'clean'}) ext=${result.extractionMs}ms ana=${result.analysisMs}ms`);
      if (index < caseIds.length - 1) await sleep(SLEEP_MS_BETWEEN_CASES);
    }
  } finally {
    stopServer?.();
  }
  console.log(`== done: ${jsonlPath} ==`);
}

export const _callBudgetInternal = { CallBudgetExhausted, chargeExtractionAttempt };

function jsonlHas(jsonlPath: string, caseId: string): boolean {
  if (!existsSync(jsonlPath)) return false;
  return readFileSync(jsonlPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .some((line) => (JSON.parse(line) as { caseId: string }).caseId === caseId);
}

function scoreResultsFile(jsonlPath: string, date: string, freezeFile: string): void {
  const freeze = JSON.parse(readFileSync(path.join(evalDir, freezeFile), 'utf8')) as {
    approvedRules: Parameters<typeof scoreCase>[1]['approvedRules'];
    supersededAbstentions: Record<string, string[]>;
  };
  const scores = [];
  const bundles: Array<Record<string, unknown>> = [];
  for (const line of readFileSync(jsonlPath, 'utf8').split('\n').filter(Boolean)) {
    const entry = JSON.parse(line) as { caseId: string; mode: string; issued: IssuedView | null; report: ReportView | null };
    if (entry.mode !== 'ok') {
      bundles.push({ caseId: entry.caseId, error: 'case_failed', mode: entry.mode });
      continue;
    }
    const truth = loadTruth(entry.caseId);
    const run: CaseRun = {
      caseId: entry.caseId,
      truth,
      issued: entry.issued as IssuedView,
      report: entry.report as ReportView,
      sampleText: loadSampleText(entry.caseId),
      timings: { extractionMs: entry.extractionMs ?? 0, analysisMs: entry.analysisMs ?? 0 } as never,
    };
    const score = scoreCase(run, {
      approvedRules: freeze.approvedRules,
      supersededAbstentions: freeze.supersededAbstentions,
    });
    scores.push(score);
    for (const pending of score.precision.needsHumanReview) {
      const finding = entry.report?.findings[pending.index];
      bundles.push({
        caseId: entry.caseId,
        findingIndex: pending.index,
        category: pending.category,
        fieldKeys: pending.fieldKeys,
        explanation: finding?.explanation,
        evidence: finding?.documentEvidence,
        source: finding?.source,
        truthAllowed: truth.allowedFindingCategories,
        truthSeeded: truth.seededDifferences,
        truthNotes: truth.notes,
      });
    }
    for (const pending of score.citation.needsHumanReview) {
      const finding = entry.report?.findings[pending.index];
      bundles.push({
        caseId: entry.caseId,
        humanReview: 'citation_support',
        ruleKey: pending.ruleKey,
        pinpoint: pending.pinpoint,
        source: finding?.source,
        explanation: finding?.explanation,
      });
    }
  }
  const aggregate = scoreRun(scores);
  const outPath = path.join(evalDir, `eval-${date}.json`);
  writeFileSync(
    outPath,
    `${JSON.stringify({ scoredAt: new Date().toISOString(), aggregate, perCase: scores, humanReviewBundles: bundles }, null, 2)}\n`,
  );
  console.log(`== scored ${scores.length} cases → ${outPath} ==`);
  console.log(JSON.stringify(aggregate, null, 2));
}

main().catch((error: unknown) => {
  if (error instanceof CallBudgetExhausted) {
    console.error(`== STOPPED: ${String(error.message)} ==`);
    console.error('== completed cases are already in the JSONL; resume with --cases for the remainder ==');
    return;
  }
  console.error(error);
  process.exitCode = 1;
});
