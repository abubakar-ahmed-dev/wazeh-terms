/**
 * HMAC-SHA256 issuance and verification for the signed extraction handoff
 * (`docs/API.md` §5, `docs/SECURITY.md` §3).
 *
 * HMAC provides integrity only — not encryption, not user identity, no
 * replay protection within the TTL. Key material is injected by the caller
 * (the config layer, Phase 03); this module never reads the environment.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import { canonicalJson } from './canonical-json.js';

export const KEY_ID_REGEX = /^[a-z0-9][a-z0-9-]{0,31}$/;
const KeyIdSchema = z.string().regex(KEY_ID_REGEX);
const SignatureSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/); // base64url of 32 bytes

export interface HmacKey {
  readonly keyId: string;
  readonly secret: string;
}

export interface IssuedProof {
  readonly keyId: string;
  readonly signature: string;
}

const ProofSchema = z.strictObject({
  keyId: KeyIdSchema,
  signature: SignatureSchema,
});

function signatureInput(payload: object, keyId: string): string {
  return canonicalJson({ issuedExtraction: payload, keyId });
}

function computeSignature(payload: object, key: HmacKey): string {
  return createHmac('sha256', key.secret)
    .update(signatureInput(payload, key.keyId), 'utf8')
    .digest('base64url');
}

export function signIssuedExtraction(payload: object, key: HmacKey): IssuedProof {
  if (!KeyIdSchema.safeParse(key.keyId).success) {
    throw new Error(`Invalid signing keyId: ${key.keyId}`);
  }
  if (key.secret.length < 32) {
    throw new Error('Signing secret must be at least 32 characters');
  }
  return { keyId: key.keyId, signature: computeSignature(payload, key) };
}

export type ProofVerification =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason:
        | 'malformed'
        | 'unknown_key'
        | 'unsupported_schema_version'
        | 'signature_mismatch'
        | 'expired';
    };

/**
 * Verify an issued payload and its proof.
 *
 * Check order: proof shape → payload shape/schema version → key allowlist →
 * constant-time signature compare → expiry. Signature bytes are re-derived
 * from the received payload object's canonical serialization; a client
 * cannot reserialize a subset or reorder fields without breaking the MAC.
 * Callers enforce request size bounds before invoking this module.
 */
export function verifyIssuedExtraction(
  payload: unknown,
  proof: unknown,
  keys: readonly HmacKey[],
  nowMs: number,
): ProofVerification {
  const parsedProof = ProofSchema.safeParse(proof);
  if (!parsedProof.success) {
    return { ok: false, reason: 'malformed' };
  }

  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, reason: 'malformed' };
  }
  const record = payload as Record<string, unknown>;
  if (record.schemaVersion !== 1) {
    return { ok: false, reason: 'unsupported_schema_version' };
  }

  const key = keys.find((candidate) => candidate.keyId === parsedProof.data.keyId);
  if (!key) {
    return { ok: false, reason: 'unknown_key' };
  }

  let expected: string;
  try {
    expected = computeSignature(payload, key);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const received = Buffer.from(parsedProof.data.signature, 'utf8');
  const expectedBytes = Buffer.from(expected, 'utf8');
  if (received.length !== expectedBytes.length || !timingSafeEqual(received, expectedBytes)) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  const expiresAt = record.expiresAt;
  if (typeof expiresAt !== 'string' || !Number.isFinite(Date.parse(expiresAt))) {
    return { ok: false, reason: 'malformed' };
  }
  if (Date.parse(expiresAt) <= nowMs) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true };
}
