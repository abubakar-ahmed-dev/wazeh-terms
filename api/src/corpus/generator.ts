/**
 * Deterministic corpus generation (test-path only — D2: the runtime sample
 * experience always calls Gemini). Pure builders + loader; the CLI in
 * `tools/corpus/generate.ts` writes the artifacts.
 *
 * PDFs embed fixed timestamps so regeneration is byte-identical. Extraction
 * fixtures are built from `truth.json` + `sample-text.json` and validate
 * against the Phase 02 contracts.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';

import {
  ExtractedFieldSchema,
  FIELD_DEFINITIONS,
  type ExtractedField,
  type IssuedExtractionDocument,
  type IssuedExtractionV1,
  type NormalizedValue,
} from '../contracts/index.js';
import { TruthSchema, type Truth, type TruthExpectedField } from './truth-schema.js';

export type { Truth };

export interface CaseText {
  readonly note: string;
  readonly offer: readonly string[];
  readonly contract: readonly string[];
}

/** Fixed epoch so regenerated PDFs are byte-identical. */
const FIXED_DATE = new Date(0);

export async function buildCasePdf(lines: readonly string[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setCreationDate(FIXED_DATE);
  pdf.setModificationDate(FIXED_DATE);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const perPage = 24;
  for (let offset = 0; offset < Math.max(lines.length, 1); offset += perPage) {
    const page = pdf.addPage([595, 842]);
    lines
      .slice(offset, offset + perPage)
      .forEach((line, index) => {
        page.drawText(line, { x: 40, y: 800 - index * 18, size: 8, font });
      });
  }
  return Buffer.from(await pdf.save({ updateFieldAppearances: false }));
}

function quoteFor(text: CaseText, role: 'offer' | 'contract', line: number): string {
  const lines = role === 'offer' ? text.offer : text.contract;
  const quote = lines[line];
  if (quote === undefined || quote.trim() === '') {
    throw new Error(`Evidence line ${line} missing/blank in ${role} text`);
  }
  return quote;
}

function fieldFromExpected(
  expected: TruthExpectedField,
  text: CaseText,
  documentId: string,
): ExtractedField {
  const quote =
    expected.state === 'present' && expected.evidence
      ? quoteFor(text, expected.evidence.role, expected.evidence.line)
      : null;
  const value: NormalizedValue | null = expected.state === 'present' ? expected.value : null;
  return ExtractedFieldSchema.parse({
    fieldKey: expected.fieldKey,
    instanceId: `${expected.fieldKey}:0`,
    state: expected.state,
    rawText: quote,
    value,
    evidence:
      expected.state === 'present' && expected.evidence && quote
        ? [{ documentId, page: expected.evidence.page, quote, verification: 'matched_text' as const }]
        : [],
    qualityNotes: [],
  });
}

export function buildExtractionFixture(
  truth: Truth,
  text: CaseText,
): { offer?: IssuedExtractionDocument; contract?: IssuedExtractionDocument } {
  const result: { offer?: IssuedExtractionDocument; contract?: IssuedExtractionDocument } = {};
  for (const documentTruth of truth.documents) {
    const documentId = `doc-${documentTruth.role}`;
    const roleLines = documentTruth.role === 'offer' ? text.offer : text.contract;
    const byKey = new Map(
      truth.expectedFields
        .filter((expected) => expected.role === documentTruth.role)
        .map((expected) => [expected.fieldKey, expected]),
    );

    const fields: ExtractedField[] = FIELD_DEFINITIONS.map((definition) => {
      const expected = byKey.get(definition.fieldKey);
      if (expected) return fieldFromExpected(expected, text, documentId);
      // Extraction emits every registry key; unmentioned keys are explicit
      // absences with readable coverage.
      return ExtractedFieldSchema.parse({
        fieldKey: definition.fieldKey,
        instanceId: `${definition.fieldKey}:0`,
        state: 'absent',
        rawText: null,
        value: null,
        evidence: [],
        qualityNotes: [],
      });
    });

    const unreadablePages = Array.from(
      { length: documentTruth.pageCount },
      (_, index) => index + 1,
    ).filter((page) => !documentTruth.readablePages.includes(page));

    result[documentTruth.role] = {
      documentId,
      role: documentTruth.role,
      mimeType: 'application/pdf',
      pageCount: documentTruth.pageCount,
      sha256: createHash('sha256').update(roleLines.join('\n')).digest('hex'),
      extractionStatus: unreadablePages.length > 0 ? 'partial' : 'completed',
      fields,
      unreadablePages,
    };
  }
  return result;
}

export function buildIssuedPayload(
  truth: Truth,
  documents: ReturnType<typeof buildExtractionFixture>,
): IssuedExtractionV1 {
  // Runtime-fresh timestamps: the proof TTL must be live when tests sign.
  const issuedAt = new Date();
  return {
    schemaVersion: 1,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + 30 * 60 * 1000).toISOString(),
    scope: { ...truth.route },
    sourceMode: 'sample',
    documents: (['offer', 'contract'] as const)
      .map((role) => documents[role])
      .filter((document): document is IssuedExtractionDocument => document !== undefined),
  };
}

export function loadCaseText(caseDir: string): CaseText {
  return JSON.parse(readFileSync(path.join(caseDir, 'sample-text.json'), 'utf8')) as CaseText;
}

export function loadTruth(caseDir: string): Truth {
  return TruthSchema.parse(JSON.parse(readFileSync(path.join(caseDir, 'truth.json'), 'utf8')));
}
