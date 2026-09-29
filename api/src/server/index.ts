/**
 * Server bootstrap: real config, real Gemini service, bundled manifest.
 * Startup logs name only configuration state, never values.
 */
import { loadConfig, configSourceSummary } from '../config.js';
import { loadBundledSampleManifest } from '../content/samples-manifest.js';
import { logStartup } from '../logging.js';
import { createGeminiHttpService } from '../services/gemini/gemini-http.js';
import { createRetrievalService } from '../services/analysis/retrieval.js';
import { readCanonicalRule } from '../services/canonical/reader.js';
import { createFetchMcpTransport } from '../services/retrieval/transport.js';
import { buildApp } from './app.js';

const config = loadConfig();
const manifest = loadBundledSampleManifest();

const gemini = config.gemini.apiKey
  ? createGeminiHttpService({ apiKey: config.gemini.apiKey, model: config.gemini.model })
  : // Fail-closed placeholder: every extraction answers 503 while the key is
    // absent (docs/API.md §7).
    {
      extract: async () =>
        ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) as const,
    };

// Phase 10: the retrieval chain exists only when the Knowledge Base-only MCP
// endpoint and the canonical dataset are both configured. Anything missing
// keeps the honest document-only partial (docs/ADR-006, docs/ADR-010).
const retrieval =
  config.sanity.contextMcpUrl && config.sanity.projectId && config.sanity.dataset
    ? createRetrievalService({
        config,
        transport: createFetchMcpTransport({
          url: config.sanity.contextMcpUrl,
          bearerToken: config.sanity.organizationToken,
          timeoutMs: config.retrieval.timeoutMs,
        }),
        reader: (ruleKey, revision) =>
          readCanonicalRule(
            {
              projectId: config.sanity.projectId!,
              dataset: config.sanity.dataset!,
              readToken: config.sanity.readToken,
              timeoutMs: config.retrieval.timeoutMs,
            },
            ruleKey,
            revision,
          ),
      })
    : undefined;

const app = buildApp({ config, gemini, manifest, ...(retrieval ? { retrieval } : {}) });

app.listen(config.port, () => {
  logStartup({
    port: config.port,
    config: configSourceSummary(config),
    sampleCases: manifest.entries.map((entry) => entry.sampleCaseId),
  });
});
