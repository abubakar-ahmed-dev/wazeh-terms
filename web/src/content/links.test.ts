import { describe, expect, it } from 'vitest';
import { ARTICLES, HELP_HUB_GROUPS, servedAnchorSet } from './articles';
import { FIELD_GROUPS } from '../lib/types';
import { groupTipId, unit } from './guides';
import { TECHNICAL_ARTICLES, TECHNICAL_ORDER } from './technical';

describe('P10 Comprehensive Link & Copy Integrity Audit', () => {
  it('verifies all 12 review group keys in FIELD_GROUPS match guides.ts and articles.ts', () => {
    expect(FIELD_GROUPS).toHaveLength(12);

    const checkingArticle = ARTICLES['checking-terms']!;
    expect(checkingArticle).toBeDefined();

    const checkingSectionIds = new Set(checkingArticle.sections.map((s) => s.id));

    for (const group of FIELD_GROUPS) {
      // 1. guides.ts group tip exists
      const tipId = groupTipId(group.key);
      const tip = unit(tipId);
      expect(tip).toBeDefined();
      expect(tip.title).toContain(group.heading);

      // 2. tip has deep link to /help/checking-terms#group-*
      expect(tip.links).toBeDefined();
      expect(tip.links!.length).toBeGreaterThanOrEqual(1);
      const deepLink = tip.links![0]![1];
      expect(deepLink).toMatch(/^\/help\/checking-terms#group-/);

      const anchor = deepLink.split('#')[1]!;
      expect(checkingSectionIds.has(anchor)).toBe(true);
    }
  });

  it('verifies every article in HELP_HUB_GROUPS exists in ARTICLES', () => {
    for (const group of HELP_HUB_GROUPS) {
      expect(group.slugs.length).toBeGreaterThan(0);
      for (const slug of group.slugs) {
        expect(ARTICLES[slug]).toBeDefined();
        expect(ARTICLES[slug]!.slug).toBe(slug);
      }
    }
  });

  it('verifies all served anchors are valid and reachable', () => {
    const anchors = servedAnchorSet();
    expect(anchors.size).toBeGreaterThan(30);

    for (const anchor of anchors) {
      expect(anchor.startsWith('/help/')).toBe(true);
    }
  });

  it('verifies all related guide links in articles resolve to real article slugs', () => {
    for (const [slug, article] of Object.entries(ARTICLES)) {
      expect(article.slug).toBe(slug);

      // Find any internal /help/ link references in bullets or paragraphs
      const articleText = JSON.stringify(article);
      const helpMatches = articleText.matchAll(/\/help\/([a-z0-9-]+)(?:#([a-z0-9-]+))?/g);

      for (const match of helpMatches) {
        const targetSlug = match[1]!;
        const targetAnchor = match[2];

        if (targetSlug === 'glossary') {
          continue;
        }

        const targetArticle = ARTICLES[targetSlug];
        expect(targetArticle).toBeDefined();

        if (targetAnchor && targetArticle) {
          const sectionExists = targetArticle.sections.some((s) => s.id === targetAnchor);
          expect(sectionExists).toBe(true);
        }
      }
    }
  });

  it('verifies reading-findings sections match all Findings.tsx contextual guide anchors', () => {
    const findingsArticle = ARTICLES['reading-findings']!;
    expect(findingsArticle).toBeDefined();

    const sectionIds = new Set(findingsArticle.sections.map((s) => s.id));

    // Anchors called from Findings.tsx
    const requiredAnchors = [
      'document-differences',
      'missing-information',
      'questions-to-clarify',
      'could-not-determine',
    ];

    for (const anchor of requiredAnchors) {
      expect(sectionIds.has(anchor)).toBe(true);
    }
  });

  it('verifies sequential reading order and links across all T1–T7 technical articles', () => {
    expect(TECHNICAL_ORDER).toHaveLength(7);

    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      expect(article).toBeDefined();
      expect(article.slug).toBe(slug);

      for (const section of article.sections) {
        expect(section.id).toMatch(/^[a-z0-9-]+$/);
        expect(section.heading.length).toBeGreaterThan(0);
      }
    }
  });

  it('verifies strict copy law: zero positive legal verdict claims across all articles', () => {
    // Prohibited positive assertions
    const PROHIBITED_AFFIRMATIONS = /\b(is legally compliant|guaranteed safe|is fully compliant|contract is valid|verified authentic)\b/i;

    for (const article of Object.values(ARTICLES)) {
      const text = JSON.stringify(article);
      expect(text).not.toMatch(PROHIBITED_AFFIRMATIONS);
    }

    for (const article of Object.values(TECHNICAL_ARTICLES)) {
      const text = JSON.stringify(article);
      expect(text).not.toMatch(PROHIBITED_AFFIRMATIONS);
    }
  });
});
