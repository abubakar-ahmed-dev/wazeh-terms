import { describe, expect, it } from 'vitest';
import { TECHNICAL_ARTICLES, TECHNICAL_ORDER } from './technical';

describe('P9 Technical Articles Suite (T1–T7)', () => {
  it('defines exactly 7 technical articles matching TECHNICAL_ORDER', () => {
    expect(TECHNICAL_ORDER).toHaveLength(7);
    expect(TECHNICAL_ORDER).toEqual([
      'system-overview',
      'employment-knowledge-content',
      'retrieval',
      'from-candidates-to-concerns',
      'content-review',
      'privacy-and-limits',
      'evaluation',
    ]);

    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      expect(article).toBeDefined();
      expect(article.slug).toBe(slug);
      expect(article.title.length).toBeGreaterThan(5);
      expect(article.intro.length).toBeGreaterThanOrEqual(1);
      expect(article.sections.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('guarantees unique and well-formatted section IDs in every article', () => {
    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      const seenIds = new Set<string>();

      for (const section of article.sections) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(seenIds.has(section.id)).toBe(false);
        seenIds.add(section.id);
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it('contains well-formed table blocks where used', () => {
    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      for (const section of article.sections) {
        for (const block of section.blocks) {
          if (block.type === 'table') {
            expect(block.headers.length).toBeGreaterThan(1);
            expect(block.rows.length).toBeGreaterThanOrEqual(1);
            for (const row of block.rows) {
              expect(row.length).toBe(block.headers.length);
            }
          }
        }
      }
    }
  });

  it('cites accurate 2026-10-03 prod2 benchmark figures in evaluation article', () => {
    const evalArticle = TECHNICAL_ARTICLES['evaluation']!;
    expect(evalArticle).toBeDefined();

    // Check for exact numbers in sections
    const text = JSON.stringify(evalArticle);
    expect(text).toContain('53 / 53');
    expect(text).toContain('11 / 11');
    expect(text).toContain('13 / 13');
    expect(text).toContain('18.6 seconds');
    expect(text).toContain('21.5 seconds');
    expect(text).toContain('15');
  });

  it('cites accurate Sanity schema and published counts in knowledge-content article', () => {
    const kbArticle = TECHNICAL_ARTICLES['employment-knowledge-content']!;
    expect(kbArticle).toBeDefined();

    const text = JSON.stringify(kbArticle);
    expect(text).toContain('44 published reference records');
    expect(text).toContain('authority');
    expect(text).toContain('sourceDocument');
    expect(text).toContain('rule');
    expect(text).toContain('contractFieldDefinition');
  });

  it('enforces copy law: no positive standalone legal/safety verdict words without negation', () => {
    // Prohibited words unless preceded by 'not', 'never', 'no', 'without', or 'does not'
    const PROHIBITED_STANDALONE = /\b(fully compliant|is compliant|legally compliant|guaranteed safe|is safe|verified valid)\b/i;

    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      const text = JSON.stringify(article);
      expect(text).not.toMatch(PROHIBITED_STANDALONE);
    }
  });
});
