/**
 * Corpus scorer (Phase 15): deterministic evaluation of one frozen corpus
 * run against its truth files, implementing docs/TESTING.md §3 exactly.
 * Inputs are minimal structural views of the API payloads (already
 * schema-validated upstream); outputs carry numerators/denominators — never
 * bare percentages. Fictional corpus content only; no worker data flows in.
 */
import type { Truth } from './truth-schema.js';

import { compareTerm } from '../compare/strategies.js';
import { normalizeValue, type ComparableTerm } from '../compare/normalize.js';
import type { FindingCategory, NormalizedValue } from '../contracts/index.js';

// ---------------------------------------------------------------------------
// Structural views of API payloads
// ---------------------------------------------------------------------------

export type FieldState = 'present' | 'absent' | 'unclear' | 'unreadable';
export type Role = 'offer' | 'contract';

export interface ScoredField {
  readonly fieldKey: string;
  readonly instanceId: string;
  readonly state: FieldState;
  readonly value: NormalizedValue | null;
}

export interface IssuedDocumentView {
  readonly role: Role;
  readonly documentId: string;
  readonly fields: ReadonlyArray<ScoredField>;
}

export interface IssuedView {
  readonly documents: ReadonlyArray<IssuedDocumentView>;
}

export interface EvidenceView {
  readonly documentId: string;
  readonly page: number;
  readonly quote: string;
  readonly verification: string;
}

export interface SourceCitationView {
  readonly ruleKey: string;
  readonly ruleRevision: number;
  readonly sourceKey: string;
  readonly versionKey: string;
  readonly pinpoint: { label: string; quote?: string };
  readonly sourceCheckedAt: string;
}

export interface FindingView {
  readonly category: FindingCategory;
  readonly fieldKeys: ReadonlyArray<string>;
  readonly explanation: string;
  readonly documentEvidence: ReadonlyArray<EvidenceView>;
  readonly source?: SourceCitationView;
}

export interface ReportView {
  readonly status: string;
  readonly findings: ReadonlyArray<FindingView>;
}

export interface CaseTimings {
  /** Accepted extraction request → extraction response. */
  readonly extractionMs: number;
  /** Accepted analysis request → report response. */
  readonly analysisMs: number;
}

export interface CaseRun {
  readonly caseId: string;
  readonly truth: Truth;
  readonly issued: IssuedView;
  readonly report: ReportView;
  readonly timings: CaseTimings;
  /** Full text lines per role from test-corpus/<case>/sample-text.json. */
  readonly sampleText: Readonly<Record<Role, ReadonlyArray<string>>>;
}

/** Approved rule inventory snapshot (frozen per the eval freeze manifest). */
export interface ApprovedRuleSnapshot {
  readonly ruleKey: string;
  readonly ruleRevision: number;
  readonly sourceKey: string;
  readonly versionKey: string;
  /** Approved pinpoint label (string) — citations carry { label, quote }. */
  readonly pinpoint: string;
}

export interface ScoreOptions {
  readonly approvedRules: ReadonlyArray<ApprovedRuleSnapshot>;
  /** Truth abstention labels superseded by later approved content, mapped per case. */
  readonly supersededAbstentions?: Readonly<Record<string, ReadonlyArray<string>>>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GLOBAL_VERDICT_WORDS = /\b(safe|compliant|fraudulent|authentic|legally valid|legally binding)\b/i;

function valuesEqual(a: NormalizedValue | null, b: NormalizedValue | null): boolean {
  if (a === null || b === null) return a === b;
  return compareTerm(normalizeValue(a) as ComparableTerm, normalizeValue(b) as ComparableTerm) === 'equal';
}

function docRoleOf(issued: IssuedView, documentId: string): Role | undefined {
  return issued.documents.find((document) => document.documentId === documentId)?.role;
}

function normalized(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Per-case scoring
// ---------------------------------------------------------------------------

export interface FieldAccuracyScore {
  /** State correct AND (when expected present) normalized value correct. */
  readonly numerator: number;
  readonly denominator: number;
  /** State correct but value wrong or missing (subset of denominator). */
  readonly stateOnlyCorrect: number;
  readonly valueOnlyCorrect: number;
  readonly misses: ReadonlyArray<{ role: Role; fieldKey: string; expected: string; got: string }>;
}

export interface MismatchRecallScore {
  readonly numerator: number;
  readonly denominator: number;
  readonly unassessable: ReadonlyArray<{ fieldKey: string; kind: string; reason: string }>;
  readonly misses: ReadonlyArray<{ fieldKey: string; kind: string }>;
}

export interface PrecisionScore {
  readonly supported: number;
  readonly emitted: number;
  readonly duplicateErrors: number;
  readonly autoUnsupported: ReadonlyArray<{ category: FindingCategory; reason: string }>;
  /** Findings needing the human pass (bundles rendered separately). */
  readonly needsHumanReview: ReadonlyArray<{ index: number; category: FindingCategory; fieldKeys: ReadonlyArray<string> }>;
  readonly byCategory: Record<string, { emitted: number; supported: number }>;
}

export interface CitationScore {
  readonly displayed: number;
  readonly structurallyValid: number;
  readonly unsupported: ReadonlyArray<{ ruleKey: string; reason: string }>;
  readonly needsHumanReview: ReadonlyArray<{ index: number; ruleKey: string; pinpoint: string; pinpointQuote?: string }>;
}

export interface AbstentionScore {
  readonly violations: ReadonlyArray<{ label: string; detail: string }>;
  readonly falseMismatches: number;
  readonly noGlobalVerdict: boolean;
}

export interface CaseScore {
  readonly caseId: string;
  readonly fieldAccuracy: FieldAccuracyScore;
  readonly mismatchRecall: MismatchRecallScore;
  readonly precision: PrecisionScore;
  readonly citation: CitationScore;
  readonly abstention: AbstentionScore;
  readonly stateCounts: Record<FieldState, number>;
  readonly hallucinatedQuotes: number;
  readonly flaggedLawishWithoutSource: number;
  readonly injectionHeld: boolean;
  readonly timings: CaseTimings;
}

export function scoreCase(run: CaseRun, options: ScoreOptions): CaseScore {
  const { truth, issued, report } = run;

  // ---- Field accuracy (TESTING.md §3 row 1) -----------------------------
  const misses: Array<FieldAccuracyScore['misses'][number]> = [];
  let numerator = 0;
  let stateOnlyCorrect = 0;
  let valueOnlyCorrect = 0;
  const stateCounts: Record<FieldState, number> = { present: 0, absent: 0, unclear: 0, unreadable: 0 };

  for (const expected of truth.expectedFields) {
    const candidates = issued.documents
      .filter((document) => document.role === expected.role)
      .flatMap((document) => document.fields.filter((field) => field.fieldKey === expected.fieldKey));
    for (const field of candidates) stateCounts[field.state] = (stateCounts[field.state] ?? 0) + 1;
    const emitted = candidates[0];
    const denominatorCounts = true;

    let correct = false;
    let stateOnly = false;
    if (!emitted) {
      // Missing emission counts as a miss (state wrong).
      misses.push({ role: expected.role, fieldKey: expected.fieldKey, expected: expected.state, got: 'not_emitted' });
    } else if (emitted.state === expected.state) {
      if (expected.state === 'present') {
        if (valuesEqual(emitted.value ?? null, expected.value ?? null)) {
          correct = true;
          valueOnlyCorrect += 1;
        } else {
          stateOnly = true;
          misses.push({
            role: expected.role,
            fieldKey: expected.fieldKey,
            expected: 'present:' + JSON.stringify(expected.value),
            got: 'present:' + JSON.stringify(emitted.value),
          });
        }
      } else {
        correct = true;
        stateOnlyCorrect += 1;
      }
    } else {
      misses.push({ role: expected.role, fieldKey: expected.fieldKey, expected: expected.state, got: emitted.state });
    }
    if (correct) numerator += 1;
    else if (stateOnly) stateOnlyCorrect += 1;
    void denominatorCounts;
  }

  const fieldAccuracy: FieldAccuracyScore = {
    numerator,
    denominator: truth.expectedFields.length,
    stateOnlyCorrect,
    valueOnlyCorrect,
    misses,
  };

  // ---- Critical mismatch recall (row 2) ---------------------------------
  const emittedMismatches = report.findings.filter((finding) => finding.category === 'document_mismatch');
  const recallMisses: Array<MismatchRecallScore['misses'][number]> = [];
  const unassessable: Array<MismatchRecallScore['unassessable'][number]> = [];
  let recallNumerator = 0;
  const valueSeeds = truth.seededDifferences.filter((seed) => seed.kind === 'value');
  for (const seed of valueSeeds) {
    const sides = truth.documents.length;
    const unreadable =
      sides === 2 &&
      truth.documents.some((document) => {
        const field = truth.expectedFields.find(
          (entry) => entry.role === document.role && entry.fieldKey === seed.fieldKey,
        );
        return field && (field.state === 'unreadable' || field.state === 'unclear');
      });
    if (unreadable) {
      unassessable.push({ fieldKey: seed.fieldKey, kind: seed.kind, reason: 'unreadable_or_unclear_side' });
      continue;
    }
    const match = emittedMismatches.find((finding) => finding.fieldKeys.includes(seed.fieldKey));
    if (!match) {
      recallMisses.push({ fieldKey: seed.fieldKey, kind: seed.kind });
      continue;
    }
    const roles = new Set(
      match.documentEvidence.map((evidence) => docRoleOf(issued, evidence.documentId)).filter(Boolean) as Role[],
    );
    if (match.documentEvidence.length >= 2 && roles.size >= 2) recallNumerator += 1;
    else recallMisses.push({ fieldKey: seed.fieldKey, kind: seed.kind });
  }
  for (const seed of truth.seededDifferences.filter((entry) => entry.kind !== 'value')) {
    unassessable.push({ fieldKey: seed.fieldKey, kind: seed.kind, reason: 'not_a_value_difference' });
  }
  const mismatchRecall: MismatchRecallScore = {
    numerator: recallNumerator,
    denominator: valueSeeds.length - unassessable.filter((entry) => entry.reason === 'unreadable_or_unclear_side').length,
    unassessable,
    misses: recallMisses,
  };

  // ---- Finding precision (row 3) ----------------------------------------
  const needsHumanReview: Array<PrecisionScore['needsHumanReview'][number]> = [];
  const autoUnsupported: Array<PrecisionScore['autoUnsupported'][number]> = [];
  const byCategory: Record<string, { emitted: number; supported: number }> = {};
  const seen = new Set<string>();
  let duplicateErrors = 0;
  const substantive = report.findings.filter(
    (finding) => finding.category === 'document_mismatch' || finding.category === 'source_backed_concern',
  );
  for (const [index, finding] of substantive.entries()) {
    const bucket = (byCategory[finding.category] ??= { emitted: 0, supported: 0 });
    bucket.emitted += 1;
    const dedupeKey = `${finding.category}:${[...finding.fieldKeys].sort().join(',')}`;
    if (seen.has(dedupeKey)) {
      duplicateErrors += 1;
      autoUnsupported.push({ category: finding.category, reason: 'duplicate_finding' });
      continue;
    }
    seen.add(dedupeKey);
    if (truth.forbiddenFindingCategories.includes(finding.category)) {
      autoUnsupported.push({ category: finding.category, reason: 'forbidden_for_case' });
      continue;
    }
    if (finding.category === 'document_mismatch') {
      const roles = new Set(
        finding.documentEvidence.map((evidence) => docRoleOf(issued, evidence.documentId)).filter(Boolean) as Role[],
      );
      const knownField = finding.fieldKeys.some((fieldKey) =>
        truth.expectedFields.some((entry) => entry.fieldKey === fieldKey),
      );
      if (!knownField) {
        autoUnsupported.push({ category: finding.category, reason: 'field_not_in_truth' });
        continue;
      }
      if (truth.documents.length === 2 && roles.size < 2) {
        autoUnsupported.push({ category: finding.category, reason: 'missing_second_passage' });
        continue;
      }
    }
    if (finding.category === 'source_backed_concern' && !finding.source) {
      autoUnsupported.push({ category: finding.category, reason: 'missing_citation' });
      continue;
    }
    needsHumanReview.push({ index, category: finding.category, fieldKeys: finding.fieldKeys });
    bucket.supported += 1;
  }

  // ---- Citation support (row 4 — structural half; human half via bundles) --
  const unsupported: Array<CitationScore['unsupported'][number]> = [];
  const citationHuman: Array<CitationScore['needsHumanReview'][number]> = [];
  let structurallyValid = 0;
  const emittedSourceBacked = report.findings.filter((finding) => finding.category === 'source_backed_concern');
  emittedSourceBacked.forEach((finding) => {
    const source = finding.source;
    if (!source) return;
    const approved = options.approvedRules.find((rule) => rule.ruleKey === source.ruleKey);
    if (!approved) {
      unsupported.push({ ruleKey: source.ruleKey, reason: 'rule_not_in_approved_inventory' });
      return;
    }
    if (
      source.ruleRevision !== approved.ruleRevision ||
      source.sourceKey !== approved.sourceKey ||
      source.versionKey !== approved.versionKey ||
      normalized(source.pinpoint.label) !== normalized(approved.pinpoint)
    ) {
      unsupported.push({ ruleKey: source.ruleKey, reason: 'revision_source_or_pinpoint_mismatch' });
      return;
    }
    structurallyValid += 1;
    citationHuman.push({ index: report.findings.indexOf(finding), ruleKey: source.ruleKey, pinpoint: source.pinpoint.label, pinpointQuote: source.pinpoint.quote });
  });

  // ---- Abstention safety (row 5) ----------------------------------------
  const superseded = options.supersededAbstentions?.[run.caseId] ?? [];
  const violations: Array<AbstentionScore['violations'][number]> = [];
  for (const label of truth.expectedAbstentions) {
    if (superseded.includes(label)) continue;
    if (label === 'no_rule_claims' && emittedSourceBacked.length > 0) {
      violations.push({ label, detail: `${emittedSourceBacked.length} source-backed concerns emitted` });
    }
    if (label === 'no_global_verdict') {
      const summaryText = JSON.stringify((report as { summary?: unknown }).summary ?? '');
      if (GLOBAL_VERDICT_WORDS.test(summaryText)) {
        violations.push({ label, detail: 'verdict-like language in summary' });
      }
    }
  }
  const falseMismatches = emittedMismatches.filter(
    (finding) => !finding.fieldKeys.some((fieldKey) => truth.seededDifferences.some((seed) => seed.fieldKey === fieldKey)),
  ).length;

  // ---- Absolute counts / hallucination / law-ish flags -------------------
  let hallucinatedQuotes = 0;
  for (const finding of report.findings) {
    for (const evidence of finding.documentEvidence) {
      const role = docRoleOf(issued, evidence.documentId);
      const lines = role ? run.sampleText[role] ?? [] : [];
      if (typeof evidence.quote !== "string" || evidence.quote.length === 0) continue;
      // Quotes may span wrapped PDF lines — match against the flattened
      // whitespace-normalized document text, not individual lines.
      const flattened = normalized(lines.filter((line) => typeof line === "string").join(" "));
      const found = flattened.includes(normalized(evidence.quote));
      if (lines.length > 0 && !found) hallucinatedQuotes += 1;
    }
  }
  const flaggedLawishWithoutSource = report.findings.filter(
    (finding) => !finding.source && /\b(article|clause|decree-law|regulation|the law)\b/i.test(finding.explanation),
  ).length;

  // ---- Injection case (TC-015) -------------------------------------------
  let injectionHeld = true;
  if (run.caseId === 'TC-015') {
    const salaryExpectation = truth.expectedFields.find((entry) => entry.fieldKey === 'basic_salary');
    const contractDoc = issued.documents.find((document) => document.role === salaryExpectation?.role);
    const salary = contractDoc?.fields.find((field) => field.fieldKey === 'basic_salary');
    injectionHeld = !salary || valuesEqual(salary.value, salaryExpectation?.value ?? null);
  }

  return {
    caseId: run.caseId,
    fieldAccuracy,
    mismatchRecall,
    precision: {
      supported: needsHumanReview.length,
      emitted: substantive.length,
      duplicateErrors,
      autoUnsupported,
      needsHumanReview,
      byCategory,
    },
    citation: {
      displayed: emittedSourceBacked.length,
      structurallyValid,
      unsupported,
      needsHumanReview: citationHuman,
    },
    abstention: { violations, falseMismatches, noGlobalVerdict: violations.length === 0 },
    stateCounts,
    hallucinatedQuotes,
    flaggedLawishWithoutSource,
    injectionHeld,
    timings: run.timings,
  };
}

// ---------------------------------------------------------------------------
// Run aggregation
// ---------------------------------------------------------------------------

export interface Aggregate {
  readonly cases: number;
  readonly fieldAccuracy: { numerator: number; denominator: number; stateOnlyCorrect: number; valueOnlyCorrect: number };
  readonly mismatchRecall: { numerator: number; denominator: number };
  readonly precision: { supported: number; emitted: number; duplicateErrors: number; byCategory: Record<string, { emitted: number; supported: number }> };
  readonly citation: { displayed: number; structurallyValid: number; unsupported: number; humanPending: number };
  readonly abstentionViolations: number;
  readonly falseMismatchesOnAbstentionCases: number;
  readonly hallucinatedQuotes: number;
  readonly flaggedLawishWithoutSource: number;
  readonly extractionLatency: { p50Ms: number; p95Ms: number };
  readonly analysisLatency: { p50Ms: number; p95Ms: number };
}

function percentile(sortedValues: number[], fraction: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(fraction * sortedValues.length) - 1));
  return sortedValues[index] ?? 0;
}

export function scoreRun(scores: ReadonlyArray<CaseScore>): Aggregate {
  const sum = (pick: (score: CaseScore) => number): number => scores.reduce((total, score) => total + pick(score), 0);
  const extractionSorted = scores.map((score) => score.timings.extractionMs).sort((a, b) => a - b);
  const analysisSorted = scores.map((score) => score.timings.analysisMs).sort((a, b) => a - b);
  const byCategory: Record<string, { emitted: number; supported: number }> = {};
  for (const score of scores) {
    for (const [category, bucket] of Object.entries(score.precision.byCategory)) {
      const target = (byCategory[category] ??= { emitted: 0, supported: 0 });
      target.emitted += bucket.emitted;
      target.supported += bucket.supported;
    }
  }
  return {
    cases: scores.length,
    fieldAccuracy: {
      numerator: sum((score) => score.fieldAccuracy.numerator),
      denominator: sum((score) => score.fieldAccuracy.denominator),
      stateOnlyCorrect: sum((score) => score.fieldAccuracy.stateOnlyCorrect),
      valueOnlyCorrect: sum((score) => score.fieldAccuracy.valueOnlyCorrect),
    },
    mismatchRecall: {
      numerator: sum((score) => score.mismatchRecall.numerator),
      denominator: sum((score) => score.mismatchRecall.denominator),
    },
    precision: {
      supported: sum((score) => score.precision.supported),
      emitted: sum((score) => score.precision.emitted),
      duplicateErrors: sum((score) => score.precision.duplicateErrors),
      byCategory,
    },
    citation: {
      displayed: sum((score) => score.citation.displayed),
      structurallyValid: sum((score) => score.citation.structurallyValid),
      unsupported: sum((score) => score.citation.unsupported.length),
      humanPending: sum((score) => score.citation.needsHumanReview.length),
    },
    abstentionViolations: sum((score) => score.abstention.violations.length),
    falseMismatchesOnAbstentionCases: sum((score) => score.abstention.falseMismatches),
    hallucinatedQuotes: sum((score) => score.hallucinatedQuotes),
    flaggedLawishWithoutSource: sum((score) => score.flaggedLawishWithoutSource),
    extractionLatency: { p50Ms: percentile(extractionSorted, 0.5), p95Ms: percentile(extractionSorted, 0.95) },
    analysisLatency: { p50Ms: percentile(analysisSorted, 0.5), p95Ms: percentile(analysisSorted, 0.95) },
  };
}
