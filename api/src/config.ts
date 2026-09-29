/**
 * Centralized configuration (docs/DEPLOYMENT.md §2 names). Every variable is
 * optional at the infrastructure level and degrades a capability explicitly:
 * the running service reports its real state via /api/v1/capabilities and
 * fails closed (`503 EXTRACTION_UNAVAILABLE`) where a capability is missing.
 *
 * Secrets are read here and injected into services — they never travel
 * further than the server process.
 */
import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const envFilePath = fileURLToPath(new URL('../.env', import.meta.url));
loadDotenv({ path: envFilePath, quiet: true });

export interface AppConfig {
  readonly gemini: {
    readonly apiKey: string | null;
    readonly model: string;
  };
  readonly hmac: {
    readonly secret: string | null;
    readonly keyId: string;
    /** Short proof TTL in milliseconds (docs/SECURITY.md §3). */
    readonly ttlMs: number;
  };
  readonly sampleModeEnabled: boolean;
  readonly customUploadEnabled: boolean;
  readonly imageInputEnabled: boolean;
  readonly urduExplanationEnabled: boolean;
  readonly limits: {
    readonly maxBytesPerFile: number;
    readonly maxTotalBytes: number;
    readonly maxPagesPerPdf: number;
    readonly maxCorrections: number;
    readonly applicationDeadlineMs: number;
  };
  readonly privacyNoticeVersion: string;
  readonly port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  // An empty string (copied template placeholder) counts as unset.
  const get = (name: string): string | undefined => {
    const value = env[name];
    return value === undefined || value.trim() === '' ? undefined : value.trim();
  };
  const getBool = (name: string, fallback: boolean): boolean => {
    const value = get(name);
    if (value === undefined) return fallback;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`Invalid boolean for ${name}: expected "true" or "false"`);
  };
  const getInt = (name: string, fallback: number): number => {
    const value = get(name);
    if (value === undefined) return fallback;
    const parsed = z.coerce.number().int().positive().safeParse(value);
    if (!parsed.success) throw new Error(`Invalid integer for ${name}`);
    return parsed.data;
  };

  return {
    gemini: {
      apiKey: get('GEMINI_API_KEY') ?? null,
      model: get('GEMINI_MODEL') ?? 'gemini-3.5-flash-lite',
    },
    hmac: {
      secret: get('REVIEW_HMAC_SECRET') ?? null,
      keyId: get('REVIEW_HMAC_KEY_ID') ?? 'key-1',
      ttlMs: getInt('REVIEW_TTL_MS', 1_800_000),
    },
    sampleModeEnabled: getBool('SAMPLE_MODE_ENABLED', true),
    customUploadEnabled: getBool('CUSTOM_UPLOAD_ENABLED', false),
    imageInputEnabled: getBool('IMAGE_INPUT_ENABLED', false),
    urduExplanationEnabled: getBool('URDU_EXPLANATION_ENABLED', false),
    limits: {
      maxBytesPerFile: getInt('MAX_BYTES_PER_FILE', 8 * 1024 * 1024),
      maxTotalBytes: getInt('MAX_TOTAL_BYTES', 16 * 1024 * 1024),
      maxPagesPerPdf: getInt('MAX_PAGES_PER_PDF', 15),
      maxCorrections: getInt('MAX_CORRECTIONS', 100),
      applicationDeadlineMs: getInt('APPLICATION_DEADLINE_MS', 30_000),
    },
    privacyNoticeVersion: get('PRIVACY_NOTICE_VERSION') ?? '2026-09-28-draft',
    port: getInt('PORT', 3000),
  };
}

/**
 * Startup/ops summary: reports which variables are SET, never their values
 * (docs/SECURITY.md §6 logging rules).
 */
export function configSourceSummary(config: AppConfig): string[] {
  return [
    `GEMINI_API_KEY=${config.gemini.apiKey ? 'set' : 'missing'}`,
    `GEMINI_MODEL=${config.gemini.model}`,
    `REVIEW_HMAC_SECRET=${config.hmac.secret ? 'set' : 'missing'}`,
    `REVIEW_HMAC_KEY_ID=${config.hmac.keyId}`,
    `SAMPLE_MODE_ENABLED=${config.sampleModeEnabled}`,
    `CUSTOM_UPLOAD_ENABLED=${config.customUploadEnabled}`,
    `IMAGE_INPUT_ENABLED=${config.imageInputEnabled}`,
    `URDU_EXPLANATION_ENABLED=${config.urduExplanationEnabled}`,
    `MAX_BYTES_PER_FILE=${config.limits.maxBytesPerFile}`,
    `MAX_TOTAL_BYTES=${config.limits.maxTotalBytes}`,
    `MAX_PAGES_PER_PDF=${config.limits.maxPagesPerPdf}`,
    `MAX_CORRECTIONS=${config.limits.maxCorrections}`,
    `APPLICATION_DEADLINE_MS=${config.limits.applicationDeadlineMs}`,
    `PRIVACY_NOTICE_VERSION=${config.privacyNoticeVersion}`,
    `PORT=${config.port}`,
  ];
}
