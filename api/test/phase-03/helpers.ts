/**
 * Shared phase-03 test fixtures: dependency-injected app with a fake Gemini
 * service and a temporary sample manifest whose PDFs are generated with
 * pdf-lib (no network, no real provider).
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import { loadConfig, type AppConfig } from '../../src/config.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';
import type { GeminiExtractionRequest, GeminiExtractionService } from '../../src/services/gemini/types.js';
import { buildApp } from '../../src/server/app.js';
import type { ModelExtraction } from '../../src/services/extraction/model-output.js';

export const TEST_SECRET = 'k'.repeat(48);

export function testConfig(overrides: Partial<Omit<AppConfig, 'limits' | 'security'>> & {
  limits?: Partial<AppConfig['limits']>;
  security?: Partial<AppConfig['security']>;
} = {}): AppConfig {
  const base = loadConfig({
    GEMINI_API_KEY: 'test-key',
    GEMINI_MODEL: 'gemini-3.5-flash-lite',
    REVIEW_HMAC_SECRET: TEST_SECRET,
    REVIEW_HMAC_KEY_ID: 'key-1',
    SAMPLE_MODE_ENABLED: 'true',
    CUSTOM_UPLOAD_ENABLED: 'false',
  });
  return {
    ...base,
    ...overrides,
    limits: { ...base.limits, ...overrides.limits },
    security: { ...base.security, ...overrides.security },
  };
}

type QueuedOutcome = { kind: 'ok'; model: ModelExtraction } | { kind: 'error' };

export class FakeGemini implements GeminiExtractionService {
  calls: GeminiExtractionRequest[] = [];
  private queue: QueuedOutcome[] = [];

  enqueue(outcome: QueuedOutcome): void {
    this.queue.push(outcome);
  }

  enqueueValid(model: ModelExtraction = validModelExtraction()): void {
    this.enqueue({ kind: 'ok', model });
  }

  enqueueError(): void {
    this.enqueue({ kind: 'error' });
  }

  async extract(request: GeminiExtractionRequest) {
    this.calls.push(request);
    const startedAt = Date.now();
    const next = this.queue.shift();
    if (!next || next.kind === 'error') {
      return {
        ok: false,
        reason: 'unavailable',
        errorClass: 'FakeError',
        attempts: 1,
        providerMs: Date.now() - startedAt,
      } as const;
    }
    return { ok: true, modelJson: next.model, attempts: 1, providerMs: Date.now() - startedAt } as const;
  }
}

/** Valid model output for the salary-change pair. */
export function validModelExtraction(): ModelExtraction {
  return {
    documents: [
      {
        role: 'offer',
        fields: [
          {
            fieldKey: 'employer_name',
            state: 'present',
            rawText: 'Gulf Horizon Facilities Services LLC',
            value: { kind: 'text', text: 'Gulf Horizon Facilities Services LLC' },
            evidence: [{ page: 1, quote: 'Gulf Horizon Facilities Services LLC' }],
            qualityNotes: [],
          },
          {
            fieldKey: 'basic_salary',
            state: 'present',
            rawText: 'AED 2,400 per month',
            value: {
              kind: 'money',
              amount: '2400.00',
              currency: 'AED',
              frequency: 'monthly',
              component: 'basic_salary',
              payer: null,
            },
            evidence: [{ page: 1, quote: 'AED 2,400 per month' }],
            qualityNotes: [],
          },
        ],
        unreadablePages: [],
        note: '',
      },
      {
        role: 'contract',
        fields: [
          {
            fieldKey: 'basic_salary',
            state: 'present',
            rawText: 'AED 1,800 per month',
            value: {
              kind: 'money',
              amount: '1800.00',
              currency: 'AED',
              frequency: 'monthly',
              component: 'basic_salary',
              payer: null,
            },
            evidence: [{ page: 1, quote: 'AED 1,800 per month' }],
            qualityNotes: [],
          },
        ],
        unreadablePages: [],
        note: '',
      },
    ],
  };
}

const MARKER = 'SYNTHETIC SAMPLE - FICTIONAL';

export async function createPdf(pageCount: number, text: string): Promise<Buffer> {
  return createTextPdf(Array.from({ length: pageCount }, (_, i) => [`${MARKER} ${text} page ${i + 1}`]));
}

/** PDF whose page i carries exactly the given lines (deterministic text layer). */
export async function createTextPdf(pageLines: string[][]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const lines of pageLines) {
    const page = pdf.addPage([595, 842]);
    lines.forEach((line, index) => {
      page.drawText(line, { x: 50, y: 780 - index * 20, size: 10, font });
    });
  }
  return Buffer.from(await pdf.save());
}

function manifestScope() {
  return {
    origin: 'PK' as const,
    destination: 'AE' as const,
    declaredRegime: 'uae_mainland_private' as const,
    declaredWorkerCategory: 'non_domestic' as const,
  };
}

export interface TestFixture {
  manifest: SampleManifest;
  cleanup(): Promise<void>;
}

/** Writes a temp manifest with one valid case and deliberately broken cases. */
export async function writeTestManifest(): Promise<TestFixture> {
  const created = await mkdir(path.join(tmpdir(), `wazeh-test-${Date.now()}-${Math.random()}`), {
    recursive: true,
  });
  if (!created) throw new Error('could not create test fixture directory');
  const root: string = created;

  const writeCase = async (caseId: string, file: string, bytes: Buffer): Promise<void> => {
    const dir = path.join(root, caseId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, file), bytes);
  };

  await writeCase('TC-002', 'sample-offer.pdf', await createPdf(1, 'OFFER'));
  await writeCase('TC-002', 'sample-contract.pdf', await createPdf(1, 'CONTRACT'));
  await writeCase(
    'TC-TEXT',
    'offer.pdf',
    await createTextPdf([
      ['Fictional employer Gulf Horizon', 'Basic salary AED 2,400 per month'],
      ['Contract duration six months'],
    ]),
  );
  await writeCase('TC-LONG', 'sample-offer.pdf', await createPdf(20, 'LONG'));
  await writeCase('TC-GARBAGE', 'sample-offer.pdf', Buffer.from('%PDF-1.4 this is not a real pdf'));
  await writeCase('TC-EMPTY', 'sample-offer.pdf', Buffer.alloc(0));
  await writeCase('TC-NOTPDF', 'sample-offer.pdf', Buffer.from('GIF89a-not-a-pdf'));

  const offer = { role: 'offer' as const, file: 'sample-offer.pdf', previewUrl: '' };
  const manifest: SampleManifest = {
    rootDir: root,
    entries: [
      {
        sampleCaseId: 'TC-002',
        title: 'Fictional salary change',
        description: 'test',
        scope: manifestScope(),
        documents: [
          { role: 'offer', file: 'sample-offer.pdf', previewUrl: '/samples/TC-002/sample-offer.pdf' },
          { role: 'contract', file: 'sample-contract.pdf', previewUrl: '/samples/TC-002/sample-contract.pdf' },
        ],
      },
      { sampleCaseId: 'TC-LONG', title: 't', description: 't', scope: manifestScope(), documents: [offer] },
      {
        sampleCaseId: 'TC-TEXT',
        title: 't',
        description: 't',
        scope: manifestScope(),
        documents: [{ role: 'offer' as const, file: 'offer.pdf', previewUrl: '' }],
      },
      { sampleCaseId: 'TC-GARBAGE', title: 't', description: 't', scope: manifestScope(), documents: [offer] },
      { sampleCaseId: 'TC-EMPTY', title: 't', description: 't', scope: manifestScope(), documents: [offer] },
      { sampleCaseId: 'TC-NOTPDF', title: 't', description: 't', scope: manifestScope(), documents: [offer] },
    ],
  };

  return {
    manifest,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
}

export function buildTestApp(options: {
  config?: AppConfig;
  gemini?: GeminiExtractionService;
  manifest?: SampleManifest;
} = {}) {
  const manifest = options.manifest ?? { rootDir: path.join(tmpdir(), 'wazeh-nonexistent'), entries: [] };
  return buildApp({
    config: options.config ?? testConfig(),
    gemini: options.gemini ?? new FakeGemini(),
    manifest,
  });
}
