import { describe, expect, it } from 'vitest';

import { extractPdfPageTexts } from '../../src/services/evidence/pdf-text.js';
import { createTextPdf } from '../phase-03/helpers.js';

describe('extractPdfPageTexts', () => {
  it('extracts per-page text in order', async () => {
    const bytes = await createTextPdf([
      ['First page line A', 'First page line B'],
      ['Second page line'],
      [],
    ]);
    const texts = await extractPdfPageTexts(bytes, { maxPages: 15 });
    expect(texts).toHaveLength(3);
    expect(texts[0]).toContain('First page line A');
    expect(texts[0]).toContain('First page line B');
    expect(texts[1]).toContain('Second page line');
    expect(texts[2]).toBeNull();
  });

  it('marks pages without text as null (image-only/blank)', async () => {
    const bytes = await createTextPdf([[], ['only text here']]);
    const texts = await extractPdfPageTexts(bytes, { maxPages: 15 });
    expect(texts[0]).toBeNull();
    expect(texts[1]).toContain('only text here');
  });

  it('respects the page cap', async () => {
    const bytes = await createTextPdf(
      Array.from({ length: 15 }, (_, i) => [`page ${i + 1}`]),
    );
    const texts = await extractPdfPageTexts(bytes, { maxPages: 3 });
    expect(texts).toHaveLength(3);
  });

  it('throws the typed error for unusable bytes', async () => {
    await expect(
      extractPdfPageTexts(Buffer.from('not a pdf at all'), { maxPages: 15 }),
    ).rejects.toMatchObject({ name: 'PdfTextError' });
  });
});
