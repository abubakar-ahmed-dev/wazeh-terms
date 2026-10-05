/**
 * R31 closure test: every /help link in the guide registry resolves to a
 * served pilot article (full-section depth) — no link may target an unserved
 * path or a missing anchor. Also: every served article has unique section
 * ids and a heading hierarchy.
 */
import { describe, expect, it } from 'vitest';

import { GUIDE_UNITS } from './guides';
import { ARTICLES, servedAnchorSet } from './articles';

describe('registry links resolve to served pilot articles (R31)', () => {
  const served = servedAnchorSet();

  it('every /help link target is served with its anchor', () => {
    const unserved: string[] = [];
    for (const [id, entry] of Object.entries(GUIDE_UNITS)) {
      for (const [, href] of entry.links ?? []) {
        if (!href.startsWith('/help/')) continue;
        if (!served.has(href)) unserved.push(`${id} -> ${href}`);
      }
    }
    expect(unserved).toEqual([]);
  });

  it('every served article has unique section ids and content', () => {
    for (const article of Object.values(ARTICLES)) {
      const ids = article.sections.map((section) => section.id);
      expect(new Set(ids).size, article.slug).toBe(ids.length);
      for (const section of article.sections) {
        expect(section.blocks.length, `${article.slug}#${section.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('checking-terms serves all 12 group sections at full depth', () => {
    const article = ARTICLES['checking-terms'];
    expect(article).toBeTruthy();
    if (!article) return;
    const groups = [
      'group-employer',
      'group-occupation',
      'group-location',
      'group-pay',
      'group-term',
      'group-probation',
      'group-working-time',
      'group-ending-terms',
      'group-deductions',
      'group-recruitment-travel',
      'group-benefits',
      'group-document-details',
    ];
    for (const group of groups) {
      const section = article.sections.find((entry) => entry.id === group);
      expect(section, group).toBeTruthy();
      // Full depth: at least an inspection paragraph AND a nothing-usables line.
      expect(section?.blocks.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});
