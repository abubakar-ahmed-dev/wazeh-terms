import { describe, expect, it } from 'vitest';

import { IssuedExtractionV1Schema } from '../../src/contracts/index.js';
import { clone, presentMoneyField, validIssuedExtraction } from './helpers.js';

describe('IssuedExtractionV1', () => {
  it('accepts a well-formed issued payload', () => {
    expect(IssuedExtractionV1Schema.safeParse(validIssuedExtraction()).success).toBe(true);
  });

  it('pins schemaVersion and scope literals', () => {
    const wrongVersion = clone(validIssuedExtraction());
    (wrongVersion as { schemaVersion: number }).schemaVersion = 2;
    expect(IssuedExtractionV1Schema.safeParse(wrongVersion).success).toBe(false);

    const wrongOrigin = clone(validIssuedExtraction());
    (wrongOrigin.scope as { origin: string }).origin = 'IN';
    expect(IssuedExtractionV1Schema.safeParse(wrongOrigin).success).toBe(false);

    const unknownRegime = clone(validIssuedExtraction());
    (unknownRegime.scope as { declaredRegime: string }).declaredRegime = 'free_zone';
    expect(IssuedExtractionV1Schema.safeParse(unknownRegime).success).toBe(false);
  });

  it('requires one or two documents with unique IDs', () => {
    const empty = clone(validIssuedExtraction());
    empty.documents = [];
    expect(IssuedExtractionV1Schema.safeParse(empty).success).toBe(false);

    const three = clone(validIssuedExtraction());
    three.documents.push(clone(three.documents[0]!));
    three.documents.push(clone(three.documents[0]!));
    expect(IssuedExtractionV1Schema.safeParse(three).success).toBe(false);

    const duplicate = clone(validIssuedExtraction());
    duplicate.documents.push({ ...clone(duplicate.documents[0]!), role: 'contract' });
    expect(IssuedExtractionV1Schema.safeParse(duplicate).success).toBe(false);
  });

  it('rejects expiresAt earlier than issuedAt', () => {
    const payload = clone(validIssuedExtraction());
    (payload as { expiresAt: string }).expiresAt = '2026-09-28T09:00:00.000Z';
    expect(IssuedExtractionV1Schema.safeParse(payload).success).toBe(false);
  });

  it('rejects evidence pages beyond the owning document pageCount', () => {
    const payload = clone(validIssuedExtraction());
    const field = payload.documents[0]!.fields[0]!;
    field.evidence = [{ ...field.evidence[0]!, page: 3 }];
    expect(IssuedExtractionV1Schema.safeParse(payload).success).toBe(false);
  });

  it('allows absence only on a document that was read, never a failed one', () => {
    const absent = presentMoneyField({ state: 'absent', value: null, rawText: null, evidence: [] });

    const readable = clone(validIssuedExtraction());
    readable.documents[0]!.fields = [{ ...absent }];
    expect(IssuedExtractionV1Schema.safeParse(readable).success).toBe(true);

    const failed = clone(validIssuedExtraction());
    failed.documents[0]!.extractionStatus = 'failed';
    failed.documents[0]!.fields = [{ ...absent }];
    expect(IssuedExtractionV1Schema.safeParse(failed).success).toBe(false);
  });

  it('requires unreadablePages unique ascending within pageCount', () => {
    const doc = (pages: number[]) => {
      const payload = clone(validIssuedExtraction());
      payload.documents[0]!.unreadablePages = pages;
      return payload;
    };
    expect(IssuedExtractionV1Schema.safeParse(doc([1, 2])).success).toBe(true);
    expect(IssuedExtractionV1Schema.safeParse(doc([2, 1])).success).toBe(false);
    expect(IssuedExtractionV1Schema.safeParse(doc([2, 2])).success).toBe(false);
    expect(IssuedExtractionV1Schema.safeParse(doc([5])).success).toBe(false);
  });

  it('enforces sha256 and mimeType formats', () => {
    const badDigest = clone(validIssuedExtraction());
    badDigest.documents[0]!.sha256 = 'not-a-digest';
    expect(IssuedExtractionV1Schema.safeParse(badDigest).success).toBe(false);

    const badMime = clone(validIssuedExtraction());
    badMime.documents[0]!.mimeType = 'pdf';
    expect(IssuedExtractionV1Schema.safeParse(badMime).success).toBe(false);
  });
});
