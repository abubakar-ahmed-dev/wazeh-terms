/**
 * PDF structural inspection for admission (docs/API.md §4.1, SECURITY.md §4):
 * page count and parseability/encryption checks, run entirely before any
 * provider call. Bytes are treated as untrusted input.
 */
import { PDFDocument } from 'pdf-lib';

export type PdfStructureFailure = 'encrypted' | 'malformed';

export class PdfStructureError extends Error {
  readonly kind: PdfStructureFailure;

  constructor(kind: PdfStructureFailure) {
    super(kind === 'encrypted' ? 'PDF is encrypted' : 'PDF is malformed or unreadable');
    this.name = 'PdfStructureError';
    this.kind = kind;
  }
}

export interface PdfStructure {
  readonly pageCount: number;
}

export async function inspectPdf(bytes: Buffer): Promise<PdfStructure> {
  try {
    const document = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
    // Lenient loads can still fail here (e.g. a missing page tree) — the
    // document is malformed either way.
    return { pageCount: document.getPageCount() };
  } catch (error) {
    const name = (error as Error)?.name ?? '';
    const message = String((error as Error)?.message ?? '');
    if (name.includes('Encrypt') || /encrypt/i.test(message)) {
      throw new PdfStructureError('encrypted');
    }
    throw new PdfStructureError('malformed');
  }
}
