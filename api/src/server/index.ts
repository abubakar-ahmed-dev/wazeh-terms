/**
 * Server bootstrap: real config, real Gemini service, bundled manifest.
 * Startup logs name only configuration state, never values.
 */
import { loadConfig, configSourceSummary } from '../config.js';
import { loadBundledSampleManifest } from '../content/samples-manifest.js';
import { logStartup } from '../logging.js';
import { createGeminiHttpService } from '../services/gemini/gemini-http.js';
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

const app = buildApp({ config, gemini, manifest });

app.listen(config.port, () => {
  logStartup({
    port: config.port,
    config: configSourceSummary(config),
    sampleCases: manifest.entries.map((entry) => entry.sampleCaseId),
  });
});
