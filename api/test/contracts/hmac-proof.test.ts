import { describe, expect, it } from 'vitest';

import {
  signIssuedExtraction,
  verifyIssuedExtraction,
  type IssuedProof,
} from '../../src/contracts/index.js';
import {
  NOW_AFTER_EXPIRY,
  NOW_BEFORE_EXPIRY,
  clone,
  testKey,
  validIssuedExtraction,
} from './helpers.js';

const payload = () => validIssuedExtraction();
const sign = () => signIssuedExtraction(payload(), testKey());

describe('HMAC proof issuance', () => {
  it('produces a base64url signature bound to the keyId', () => {
    const proof = sign();
    expect(proof.keyId).toBe('test-key');
    expect(proof.signature).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('rejects an invalid keyId or a short secret', () => {
    expect(() => signIssuedExtraction(payload(), testKey('BAD_KEY'))).toThrow();
    expect(() => signIssuedExtraction(payload(), { keyId: 'k', secret: 'short' })).toThrow();
  });

  it('is deterministic for identical input and differs across payloads', () => {
    expect(sign().signature).toBe(sign().signature);
    const other = clone(payload());
    other.sourceMode = 'custom';
    expect(signIssuedExtraction(other, testKey()).signature).not.toBe(sign().signature);
  });
});

describe('HMAC proof verification', () => {
  it('accepts a valid proof before expiry', () => {
    expect(verifyIssuedExtraction(payload(), sign(), [testKey()], NOW_BEFORE_EXPIRY)).toEqual({ ok: true });
  });

  it('fails every tamper vector with signature_mismatch', () => {
    const proof: IssuedProof = sign();

    const changedValue = clone(payload());
    changedValue.documents[0]!.fields[0]!.rawText = 'Tampered salary text';
    expect(verifyIssuedExtraction(changedValue, proof, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });

    const changedScope = clone(payload());
    (changedScope.scope as { declaredRegime: string }).declaredRegime = 'unknown';
    expect(verifyIssuedExtraction(changedScope, proof, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });

    const changedDigest = clone(payload());
    changedDigest.documents[0]!.sha256 = 'b'.repeat(64);
    expect(verifyIssuedExtraction(changedDigest, proof, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });

    const changedExpiry = clone(payload());
    changedExpiry.expiresAt = '2026-09-28T23:59:00.000Z';
    expect(verifyIssuedExtraction(changedExpiry, proof, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });

  it('rejects an unknown keyId and keys absent from the allowlist', () => {
    expect(verifyIssuedExtraction(payload(), { ...sign(), keyId: 'other-key' }, [testKey()], NOW_BEFORE_EXPIRY)).toEqual(
      { ok: false, reason: 'unknown_key' },
    );
    expect(verifyIssuedExtraction(payload(), sign(), [testKey('another-key')], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'unknown_key',
    });
  });

  it('supports rotation: a second allowlisted key verifies its own signatures', () => {
    const keys = [testKey('old-key'), testKey('new-key')];
    const proof = signIssuedExtraction(payload(), keys[1]!);
    expect(verifyIssuedExtraction(payload(), proof, keys, NOW_BEFORE_EXPIRY)).toEqual({ ok: true });
  });

  it('reports expiry separately from integrity', () => {
    expect(verifyIssuedExtraction(payload(), sign(), [testKey()], NOW_AFTER_EXPIRY)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects an unsupported payload schema version before signature work', () => {
    const wrongVersion = clone(payload());
    (wrongVersion as { schemaVersion: number }).schemaVersion = 2;
    expect(
      verifyIssuedExtraction(wrongVersion, signIssuedExtraction(wrongVersion as never, testKey()), [testKey()], NOW_BEFORE_EXPIRY),
    ).toEqual({ ok: false, reason: 'unsupported_schema_version' });
  });

  it('treats malformed proofs and payloads as malformed', () => {
    expect(verifyIssuedExtraction(payload(), { keyId: 'test-key', signature: 'short' }, [testKey()], NOW_BEFORE_EXPIRY)).toEqual(
      { ok: false, reason: 'malformed' },
    );
    expect(verifyIssuedExtraction(payload(), null, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'malformed',
    });
    expect(verifyIssuedExtraction(null, sign(), [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'malformed',
    });
    expect(verifyIssuedExtraction([], sign(), [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'malformed',
    });
  });

  it('rejects a signature issued with a different secret (wrong shared material)', () => {
    const proof = signIssuedExtraction(payload(), { keyId: 'test-key', secret: 's'.repeat(48) });
    expect(verifyIssuedExtraction(payload(), proof, [testKey()], NOW_BEFORE_EXPIRY)).toEqual({
      ok: false,
      reason: 'signature_mismatch',
    });
  });
});
