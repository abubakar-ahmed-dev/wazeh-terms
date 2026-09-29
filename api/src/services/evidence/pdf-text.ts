/**
 * PDF text-layer extraction (docs/TECHNICAL_ARCHITECTURE.md §3.1 step 4):
 * per-page text used to corroborate reported passages. The text is
 * untrusted data — matching code treats it as such. Rendering, fonts, and
 * workers are disabled; only `getTextContent` runs, bounded by the admitted
 * page count.
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export class PdfTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfTextError';
  }
}

export interface PdfTextOptions {
  /** Hard cap; callers pass the admission page limit. */
  readonly maxPages: number;
}

/**
 * Returns one entry per page (1-based order): the page's text items joined
 * with spaces, or `null` when the page exposes no usable text layer
 * (scanned/image-only pages).
 */
export async function extractPdfPageTexts(
  bytes: Buffer,
  options: PdfTextOptions,
): Promise<Array<string | null>> {
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    useSystemFonts: false,
  });

  let document: Awaited<typeof loadingTask.promise>;
  try {
    document = await loadingTask.promise;
  } catch {
    // Admission already vetted parseability; a failure here is defensive.
    throw new PdfTextError('PDF text layer could not be extracted');
  }

  try {
    const pageTexts: Array<string | null> = [];
    const pageCount = Math.min(document.numPages, options.maxPages);
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
      pageTexts.push(text.length > 0 ? text : null);
      page.cleanup();
    }
    return pageTexts;
  } catch {
    throw new PdfTextError('PDF text layer could not be extracted');
  } finally {
    // In pdfjs v6 the loading task owns the worker/transport teardown.
    await loadingTask.destroy();
  }
}
