/**
 * Eligibility gate suite (plans/phase-10 §Test list items 4–5): the happy
 * path emits a complete SourceCitation; every failure mode withholds with
 * its closed reason and never produces a citation.
 */
import { describe, expect, it } from 'vitest';

import { gateCandidate, type GateContext } from '../../src/services/eligibility/gate.js';
import type { CanonicalRule, CanonicalSource } from '../../src/services/canonical/reader.js';
import type { RuleCandidate } from '../../src/services/retrieval/candidates.js';

const SOURCE: CanonicalSource = {
  sourceKey: 'uae-federal-decree-law-33-2021',
  versionKey: 'mohre-pdf-2026',
  title: 'Federal Decree-Law No. 33 of 2021',
  evidenceClass: 'binding_official_rule',
  jurisdiction: 'AE',
  officialUrl: 'https://www.mohre.gov.ae/assets/download/4d342ff8/example.pdf',
  issuingAuthorityName: 'Ministry of Human Resources and Emiratisation',
  effectiveFrom: '2022-02-02',
  effectiveTo: null,
  recordStatus: 'current',
  reviewStatus: 'approved',
  retrievedAt: '2026-09-29T08:00:00.000Z',
  lastVerifiedAt: '2026-09-29T08:00:00.000Z',
  schemaVersion: 1,
};

const RULE: CanonicalRule = {
  ruleKey: 'ae-recruitment-costs-employer-bears',
  revision: 2,
  title: 'Employer bears recruitment costs',
  claimText: 'The employer bears the recruitment cost and shall not recover it from the worker.',
  topic: 'worker_costs',
  triggerKey: 'worker_charge.payer_must_be_uae_employer',
  ruleKind: 'obligation',
  evidenceClass: 'binding_official_rule',
  jurisdiction: 'AE',
  origin: 'PK',
  destination: 'AE',
  employmentRegime: 'uae_mainland_private',
  workerCategory: 'non_domestic',
  responsibleParty: 'uae_employer',
  conditions: [],
  exceptions: [],
  machineConditionKeys: ['worker_charge_class_present'],
  effectiveFrom: '2022-02-02',
  effectiveTo: null,
  currentGuidanceVerifiedAt: null,
  pinpoint: { label: 'Article 8(2)', quote: 'The employer shall bear the recruitment cost.' },
  primarySource: SOURCE,
  plainEnglish: 'Your employer must pay recruitment costs; they cannot pass them to you.',
  sourceCheckedAt: '2026-09-29T08:00:00.000Z',
  recordStatus: 'current',
  reviewStatus: 'approved',
  schemaVersion: 1,
};

const CANDIDATE: RuleCandidate = {
  entryId: 'kb-entry-1',
  ruleKey: 'ae-recruitment-costs-employer-bears',
  revision: 2,
  snippet: 'retrieved excerpt',
};

const CONTEXT: GateContext = {
  analysisDate: new Date('2026-09-29T10:00:00Z'),
  sourceCheckMaxAgeDays: 180,
  machineConditions: {
    chargeClassPresent: true,
    chargePayerStated: true,
    frequencyCovered: true,
    totalComponentsCheckable: true,
  },
};

function ruleWith(overrides: Partial<CanonicalRule>): CanonicalRule {
  return { ...RULE, ...overrides, primarySource: overrides.primarySource ?? SOURCE };
}

function sourceWith(overrides: Partial<CanonicalSource>): CanonicalSource {
  return { ...SOURCE, ...overrides };
}

describe('happy path', () => {
  it('produces a complete citation from canonical fields only', () => {
    const verdict = gateCandidate(CANDIDATE, RULE, SOURCE, CONTEXT);
    expect(verdict.verdict).toBe('eligible');
    if (verdict.verdict !== 'eligible') return;
    expect(verdict.citation).toEqual({
      ruleKey: 'ae-recruitment-costs-employer-bears',
      ruleRevision: 2,
      sourceKey: SOURCE.sourceKey,
      versionKey: SOURCE.versionKey,
      issuingAuthority: SOURCE.issuingAuthorityName,
      officialUrl: SOURCE.officialUrl,
      pinpoint: { label: 'Article 8(2)', quote: 'The employer shall bear the recruitment cost.' },
      jurisdiction: 'AE',
      responsibleParty: 'uae_employer',
      effectiveFrom: '2022-02-02',
      effectiveTo: null,
      sourceCheckedAt: '2026-09-29T08:00:00.000Z',
      evidenceClass: 'binding_official_rule',
    });
  });

  it('is deterministic: same inputs, same citation', () => {
    expect(gateCandidate(CANDIDATE, RULE, SOURCE, CONTEXT)).toEqual(
      gateCandidate(CANDIDATE, RULE, SOURCE, CONTEXT),
    );
  });
});

describe('withholding matrix', () => {
  const expectWithheld = (reason: string, candidate: RuleCandidate, rule: CanonicalRule, source: CanonicalSource, context: GateContext = CONTEXT) => {
    const verdict = gateCandidate(candidate, rule, source, context);
    expect(verdict).toEqual({ verdict: 'withheld', reason });
  };

  it('unmappable candidate (no ruleKey / different rule)', () => {
    expectWithheld('unmappable_candidate', { ...CANDIDATE, ruleKey: undefined }, RULE, SOURCE);
    expectWithheld('unmappable_candidate', { ...CANDIDATE, ruleKey: 'other-rule' }, RULE, SOURCE);
  });

  it('revision mismatch against the canonical revision', () => {
    expectWithheld('revision_mismatch', { ...CANDIDATE, revision: 1 }, RULE, SOURCE);
  });

  it('unapproved rule or source', () => {
    expectWithheld('not_approved', CANDIDATE, ruleWith({ reviewStatus: 'draft' }), SOURCE);
    expectWithheld('not_approved', CANDIDATE, RULE, sourceWith({ reviewStatus: 'rejected' }));
  });

  it('non-current rule', () => {
    expectWithheld('not_current', CANDIDATE, ruleWith({ recordStatus: 'superseded' }), SOURCE);
  });

  it('superseded source version', () => {
    expectWithheld('source_superseded', CANDIDATE, RULE, sourceWith({ recordStatus: 'superseded' }));
  });

  it('unsupported schema version', () => {
    expectWithheld('schema_version_unsupported', CANDIDATE, ruleWith({ schemaVersion: 2 }), SOURCE);
    expectWithheld('schema_version_unsupported', CANDIDATE, RULE, sourceWith({ schemaVersion: 3 }));
  });

  it('unregistered trigger key', () => {
    expectWithheld('trigger_unregistered', CANDIDATE, ruleWith({ triggerKey: 'salary.invented_trigger' }), SOURCE);
  });

  it('null triggerKey (informational record) never backs an automated concern', () => {
    expectWithheld('trigger_unregistered', CANDIDATE, ruleWith({ triggerKey: null }), SOURCE);
  });

  it('evidence-class mismatch between rule and source; international never cites', () => {
    expectWithheld(
      'evidence_class_mismatch',
      CANDIDATE,
      ruleWith({ evidenceClass: 'official_guidance' }),
      SOURCE,
    );
    expectWithheld(
      'evidence_class_mismatch',
      CANDIDATE,
      ruleWith({
        evidenceClass: 'international_guidance',
        jurisdiction: 'AE',
      }),
      sourceWith({ evidenceClass: 'international_guidance', jurisdiction: 'international' }),
    );
  });

  it('unverifiable machine condition (unregistered key or false/unverifiable)', () => {
    expectWithheld('condition_unverifiable', CANDIDATE, ruleWith({ machineConditionKeys: ['not_a_registered_key'] }), SOURCE);
    expectWithheld(
      'condition_unverifiable',
      CANDIDATE,
      RULE,
      SOURCE,
      { ...CONTEXT, machineConditions: { ...CONTEXT.machineConditions, chargeClassPresent: false } },
    );
  });

  it('scope mismatch (regime/category/jurisdiction)', () => {
    expectWithheld('scope_mismatch', CANDIDATE, ruleWith({ employmentRegime: 'other' }), SOURCE);
    expectWithheld('scope_mismatch', CANDIDATE, ruleWith({ workerCategory: 'domestic' }), SOURCE);
    expectWithheld('scope_mismatch', CANDIDATE, ruleWith({ jurisdiction: 'PK' }), SOURCE);
  });

  it('temporal mismatch (before effectiveFrom, after effectiveTo, undated binding)', () => {
    const early = { ...CONTEXT, analysisDate: new Date('2022-01-01T00:00:00Z') };
    expectWithheld('temporal_mismatch', CANDIDATE, RULE, SOURCE, early);
    expectWithheld('temporal_mismatch', CANDIDATE, ruleWith({ effectiveTo: '2026-01-01' }), SOURCE);
    expectWithheld('temporal_mismatch', CANDIDATE, ruleWith({ effectiveFrom: null }), SOURCE);
  });

  it('guidance without current verification is withheld', () => {
    expectWithheld(
      'temporal_mismatch',
      CANDIDATE,
      ruleWith({
        evidenceClass: 'official_guidance',
        effectiveFrom: null,
        currentGuidanceVerifiedAt: null,
      }),
      sourceWith({ evidenceClass: 'official_guidance' }),
    );
  });

  it('missing pinpoint or official URL', () => {
    expectWithheld('pinpoint_missing', CANDIDATE, ruleWith({ pinpoint: { label: '', quote: '' } }), SOURCE);
    expectWithheld('pinpoint_missing', CANDIDATE, RULE, sourceWith({ officialUrl: '' as unknown as string }));
  });

  it('stale source check (older than the freshness window)', () => {
    const staleRule = ruleWith({ sourceCheckedAt: '2025-01-01T00:00:00.000Z' });
    expectWithheld('source_check_stale', CANDIDATE, staleRule, SOURCE);
  });
});
