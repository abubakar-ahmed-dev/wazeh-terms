/**
 * Registry integrity (P2 D-G2): every unit resolvable, ids unique, links
 * point at anchors that the doc router will serve (well-formed), glossary
 * present. Copy-law spot checks: forbidden verdict words must not appear in
 * unit bodies (P3 §5 do-not-say list) — reviewed-meaning exceptions are
 * listed explicitly.
 */
import { describe, expect, it } from 'vitest';

import {
  GUIDE_UNITS,
  REQUIRED_UNIT_IDS,
  emptyGroupTipId,
  groupTipId,
  unit,
} from './guides';
import { GLOSSARY, GLOSSARY_BY_SLUG } from './glossary';

describe('guide registry integrity', () => {
  it('has no duplicate ids (object literal keys are unique by construction)', () => {
    expect(Object.keys(GUIDE_UNITS).length).toBeGreaterThan(30);
  });

  it('resolves every required id', () => {
    for (const id of REQUIRED_UNIT_IDS) {
      expect(() => unit(id)).not.toThrow();
    }
  });

  it('every group tip exists for the 12 canonical groups', () => {
    const groups = [
      'employer',
      'occupation',
      'location',
      'pay',
      'term',
      'probation',
      'working_time',
      'ending_terms',
      'deductions',
      'recruitment_and_travel_costs',
      'benefits',
      'document_details',
    ];
    for (const group of groups) {
      expect(unit(groupTipId(group)).body.length).toBeGreaterThan(0);
    }
  });

  it('links are well-formed in-app help/article paths or anchors', () => {
    for (const [id, entry] of Object.entries(GUIDE_UNITS)) {
      for (const [, href] of entry.links ?? []) {
        expect(href.startsWith('/'), `${id} link ${href}`).toBe(true);
        expect(href, `${id} link ${href}`).toMatch(/^\/(help|how-it-works|examples|upload)/);
      }
    }
  });

  it('bodies never claim a verdict or safety (copy law)', () => {
    const hardForbidden = [/\bguaranteed\b/i, /\blegally checked\b/i, /\b100%\b/];
    // "safe" may appear only inside an explicit negation.
    const safeNegations = [
      /not a statement that the documents are good, safe, or compliant/,
      /not proof (?:a term is missing|of absence)/,
    ];
    for (const [id, entry] of Object.entries(GUIDE_UNITS)) {
      for (const paragraph of entry.body) {
        for (const pattern of hardForbidden) {
          expect(pattern.test(paragraph), `${id}: ${paragraph}`).toBe(false);
        }
        if (/\bsafe\b/i.test(paragraph)) {
          expect(
            safeNegations.some((negation) => negation.test(paragraph)),
            `${id} uses "safe" outside a negation: ${paragraph}`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('empty-group message selection (R11 state-specific)', () => {
  it('all-absent → absent message', () => {
    expect(emptyGroupTipId(['absent', 'absent'])).toBe('rev.empty.absent');
  });
  it('nothing usable (unclear/unreadable mix) → unresolved message', () => {
    expect(emptyGroupTipId(['unclear', 'unreadable'])).toBe('rev.empty.unresolved');
  });
  it('mixed usable/unusable → mixed message', () => {
    expect(emptyGroupTipId(['present', 'unclear', 'absent'])).toBe('rev.empty.mixed');
  });
  it('empty list → null (group has nothing to explain)', () => {
    expect(emptyGroupTipId([])).toBeNull();
  });
});

describe('glossary integrity', () => {
  it('slugs unique and resolvable', () => {
    const slugs = GLOSSARY.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(GLOSSARY_BY_SLUG.get(slug)?.definition.length).toBeGreaterThan(10);
    }
  });

  it('expiry definition makes no absolute retention claim', () => {
    const expiry = GLOSSARY_BY_SLUG.get('expiry');
    expect(expiry?.definition).toContain('keeps no copy');
    expect(expiry?.definition).toContain('provider');
  });
});
