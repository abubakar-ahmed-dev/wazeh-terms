/**
 * Manual live check for the sample extraction path: runs TC-002 against the
 * real Gemini with the local git-ignored `api/.env` credentials and prints
 * coarse results only — stage status, field-state counts, evidence counts,
 * durations. Never prints quotes, values, prompts, payloads, or proofs.
 */
import { loadConfig } from '../src/config.js';
import { loadBundledSampleManifest } from '../src/content/samples-manifest.js';
import { verifyIssuedExtraction, IssuedExtractionV1Schema } from '../src/contracts/index.js';
import { createGeminiHttpService } from '../src/services/gemini/gemini-http.js';
import { buildApp } from '../src/server/app.js';
import type { Server } from 'node:http';

async function main(): Promise<void> {
  const config = loadConfig();
  if (!config.gemini.apiKey || !config.hmac.secret) {
    console.error(
      JSON.stringify({ result: 'skipped', reason: 'GEMINI_API_KEY or REVIEW_HMAC_SECRET not set in api/.env' }),
    );
    process.exitCode = 1;
    return;
  }

  const gemini = createGeminiHttpService({ apiKey: config.gemini.apiKey, model: config.gemini.model });
  const app = buildApp({ config, gemini, manifest: loadBundledSampleManifest() });
  const server: Server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no address');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/api/v1/extractions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sampleCaseId: 'TC-002' }),
    });
    const body: unknown = await response.json();
    const totalMs = Date.now() - startedAt;

    if (!response.ok) {
      const code = (body as { error?: { code?: string } }).error?.code ?? 'UNKNOWN';
      console.error(JSON.stringify({ result: 'error', status: response.status, code, totalMs }));
      if (code === 'EXTRACTION_UNAVAILABLE') {
        // One diagnostic probe outside the app path: which provider class failed.
        const probe = await gemini.extract({
          documents: [{ role: 'offer', pdfBase64: Buffer.from('%PDF-').toString('base64') }],
          deadlineMs: config.limits.applicationDeadlineMs,
        });
        console.error(JSON.stringify({ probe: probe.ok ? 'provider-ok' : { reason: probe.reason, errorClass: probe.errorClass ?? null } }));
      }
      process.exitCode = 1;
      return;
    }

    const parsed = body as {
      requestId: string;
      status: string;
      issuedExtraction: unknown;
      proof: { keyId: string };
      stages: { extraction: string };
      notices: string[];
    };

    const issued = IssuedExtractionV1Schema.parse(parsed.issuedExtraction);
    const verify = verifyIssuedExtraction(
      issued,
      parsed.proof,
      [{ keyId: config.hmac.keyId, secret: config.hmac.secret }],
      Date.now(),
    );

    const summary = {
      result: 'ok',
      httpStatus: response.status,
      status: parsed.status,
      stage: parsed.stages.extraction,
      proofVerified: verify.ok,
      verifyReason: verify.ok ? undefined : verify.reason,
      keyId: parsed.proof.keyId,
      totalMs,
      documents: issued.documents.map((document) => ({
        role: document.role,
        pageCount: document.pageCount,
        extractionStatus: document.extractionStatus,
        fields: document.fields.length,
        states: document.fields.reduce<Record<string, number>>((counts, field) => {
          counts[field.state] = (counts[field.state] ?? 0) + 1;
          return counts;
        }, {}),
        evidence: document.fields.reduce((sum, field) => sum + field.evidence.length, 0),
        unreadablePages: document.unreadablePages.length,
      })),
    };
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    server.close();
  }
}

main().catch((error: Error) => {
  console.error(JSON.stringify({ result: 'fatal', errorName: error.name }));
  process.exitCode = 1;
});
