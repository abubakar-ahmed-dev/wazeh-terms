/**
 * E2E server (test path only, per owner decision D2): the real Express app
 * with a deterministic fake Gemini that serves the corpus `extracted.json`
 * fixtures for the five production samples. No provider calls, no network
 * beyond localhost. Real HMAC signing, real pdfjs evidence verification, and
 * (when configured) the real retrieval service — so the browser journey
 * exercises the true pipeline.
 *
 *   REVIEW_TTL_MS=2500 npx tsx scripts/e2e-server.ts   # short TTL for expiry tests
 *
 * Identifies the sample by the sha256 of the uploaded fixture bytes, so no
 * case context needs to leak through the Gemini service interface.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from '../src/config.js';
import { loadBundledSampleManifest, type SampleManifest } from '../src/content/samples-manifest.js';
import { buildApp } from '../src/server/app.js';
import { ModelExtractionSchema, type ModelExtraction } from '../src/services/extraction/model-output.js';
import type { GeminiExtractionRequest, GeminiExtractionService } from '../src/services/gemini/types.js';
import { logStartup } from '../src/logging.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const corpusDir = path.resolve(here, '../../../test-corpus');

function fixtureSha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

/** Map sha256(bytes) → sampleCaseId so the fake knows which case is running. */
function buildCaseIndex(manifest: SampleManifest): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of manifest.entries) {
    for (const document of entry.documents) {
      index.set(fixtureSha256(path.join(manifest.rootDir, entry.sampleCaseId, document.file)), entry.sampleCaseId);
    }
  }
  return index;
}

export function modelExtractionFor(sampleCaseId: string): ModelExtraction {
  // extracted.json is the Phase 07 fixture-mode extraction (test path only).
  const raw = JSON.parse(readFileSync(path.join(corpusDir, sampleCaseId, 'extracted.json'), 'utf8')) as Record<
    string,
    { role: 'offer' | 'contract'; fields?: unknown[]; unreadablePages?: number[]; note?: string }
  >;
  const documents = Object.values(raw).map((document) => ({
    role: document.role,
    fields: (document.fields ?? []) as Array<Record<string, unknown>>,
    unreadablePages: document.unreadablePages ?? [],
    note: document.note,
  }));
  return ModelExtractionSchema.parse({ documents });
}

const fakeGemini: GeminiExtractionService = {
  extract(request: GeminiExtractionRequest) {
    const index = buildCaseIndex(loadBundledSampleManifest());
    const cases = request.documents.map((document) => index.get(createHash('sha256').update(Buffer.from(document.pdfBase64, 'base64')).digest('hex')));
    const sampleCaseId = cases.find((value) => value !== undefined);
    const started = Date.now();
    if (!sampleCaseId) {
      return Promise.resolve({ ok: false as const, reason: 'unavailable' as const, attempts: 1, providerMs: Date.now() - started });
    }
    return Promise.resolve({ ok: true as const, modelJson: modelExtractionFor(sampleCaseId), attempts: 1, providerMs: Date.now() - started });
  },
};

const config = loadConfig();
const manifest = loadBundledSampleManifest();
const app = buildApp({ config, gemini: fakeGemini, manifest });

app.listen(config.port, () => {
  logStartup({
    port: config.port,
    config: [
      'E2E SERVER (fake Gemini, corpus fixtures — test path only)',
      ...configSourceSummary(config),
    ],
    sampleCases: manifest.entries.map((entry) => entry.sampleCaseId),
  });
});

function configSourceSummary(config: ReturnType<typeof loadConfig>): string[] {
  return [
    `SAMPLE_MODE_ENABLED=${config.sampleModeEnabled}`,
    `CUSTOM_UPLOAD_ENABLED=${config.customUploadEnabled}`,
    `REVIEW_TTL_MS=${config.hmac.ttlMs}`,
    `REVIEW_HMAC_SECRET=${config.hmac.secret ? 'set' : 'missing'}`,
    `SANITY_CONTEXT_MCP_URL=${config.sanity.contextMcpUrl ? 'set' : 'missing'}`,
  ];
}
