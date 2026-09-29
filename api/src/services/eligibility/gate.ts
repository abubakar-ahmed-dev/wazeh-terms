/**
 * Eligibility gate (docs/DATABASE_SCHEMA.md §9 "Runtime eligibility",
 * docs/ADR-007): the hard deterministic boundary between a retrieved
 * candidate and any displayed `source_backed_concern`. Every check fails
 * closed — a withheld claim keeps the document findings and records its
 * reason; nothing is ever guessed into eligibility.
 *
 * Pure module: no I/O, no model. Same inputs → identical verdict.
 */
import type { SourceCitation } from '../../contracts/index.js';
import type { CanonicalRule, CanonicalSource } from '../canonical/reader.js';
import type { RuleCandidate } from '../retrieval/candidates.js';
import {
  MACHINE_CONDITIONS,
  triggerDefinition,
  type MachineConditionContext,
} from './trigger-keys.js';

export type WithholdReason =
  | 'unmappable_candidate'
  | 'not_approved'
  | 'not_current'
  | 'revision_mismatch'
  | 'source_superseded'
  | 'evidence_class_mismatch'
  | 'trigger_unregistered'
  | 'condition_unverifiable'
  | 'scope_mismatch'
  | 'temporal_mismatch'
  | 'pinpoint_missing'
  | 'source_check_stale'
  | 'schema_version_unsupported'
  | 'ambiguous_record';

export type GateVerdict =
  | { readonly verdict: 'eligible'; readonly citation: SourceCitation }
  | { readonly verdict: 'withheld'; readonly reason: WithholdReason };

export interface GateContext {
  readonly analysisDate: Date;
  /** Retrieval runs only for a supported mainland route; anything else never reaches here. */
  readonly sourceCheckMaxAgeDays: number;
  readonly machineConditions: MachineConditionContext;
}

export function gateCandidate(
  candidate: RuleCandidate,
  rule: CanonicalRule,
  source: CanonicalSource,
  context: GateContext,
): GateVerdict {
  // 1. Unambiguous mapping: the candidate must name this rule (and revision
  //    when it pins one). A bare KB snippet maps to nothing.
  if (!candidate.ruleKey || candidate.ruleKey !== rule.ruleKey) {
    return withheld('unmappable_candidate');
  }
  if (candidate.revision !== undefined && candidate.revision !== rule.revision) {
    return withheld('revision_mismatch');
  }

  // 2. Editorial states.
  if (rule.reviewStatus !== 'approved' || source.reviewStatus !== 'approved') {
    return withheld('not_approved');
  }
  if (rule.recordStatus !== 'current') return withheld('not_current');
  if (source.recordStatus !== 'current') return withheld('source_superseded');
  if (rule.schemaVersion > 1 || source.schemaVersion > 1) {
    return withheld('schema_version_unsupported');
  }

  // 3. Trigger + evidence-class compatibility.
  const trigger = rule.triggerKey ? triggerDefinition(rule.triggerKey) : undefined;
  if (rule.triggerKey && !trigger) return withheld('trigger_unregistered');
  if (rule.evidenceClass !== source.evidenceClass) return withheld('evidence_class_mismatch');
  // International guidance can never produce a national-law citation
  // (docs/API.md §6: the citation's evidenceClass is binding-or-official).
  if (rule.evidenceClass === 'international_guidance' || source.evidenceClass === 'international_guidance') {
    return withheld('evidence_class_mismatch');
  }

  // 4. Machine conditions: every required condition must be registered and
  //    evaluate true; 'unverifiable' and unregistered keys both withhold.
  for (const key of rule.machineConditionKeys) {
    const predicate = MACHINE_CONDITIONS[key];
    if (!predicate) return withheld('condition_unverifiable');
    if (predicate(context.machineConditions) !== true) return withheld('condition_unverifiable');
  }

  // 5. Scope: the rule's own applicability fields must match the analysis
  //    context (mainland non-domestic UAE route; the gate is only reached in
  //    that scope, so any other rule value is a mismatch).
  if (
    rule.jurisdiction !== 'AE' ||
    rule.employmentRegime !== 'uae_mainland_private' ||
    rule.workerCategory !== 'non_domestic'
  ) {
    return withheld('scope_mismatch');
  }

  // 6. Temporal validity against the analysis date.
  if (!withinTemporalValidity(rule, source, context.analysisDate)) {
    return withheld('temporal_mismatch');
  }

  // 7. Pinpoint must exist and be complete (label + reviewed exact quote).
  if (!rule.pinpoint.label || !rule.pinpoint.quote || !source.officialUrl) {
    return withheld('pinpoint_missing');
  }

  // 8. Source-check freshness: a rule whose source was checked too long ago
  //    is stale (docs/SOURCES.md §5 scheduled check).
  if (isStale(sourceCheckedAt(rule, source), context.analysisDate, context.sourceCheckMaxAgeDays)) {
    return withheld('source_check_stale');
  }

  return {
    verdict: 'eligible',
    citation: {
      ruleKey: rule.ruleKey,
      ruleRevision: rule.revision,
      sourceKey: source.sourceKey,
      versionKey: source.versionKey,
      issuingAuthority: source.issuingAuthorityName,
      officialUrl: source.officialUrl,
      pinpoint: { label: rule.pinpoint.label, quote: rule.pinpoint.quote },
      jurisdiction: rule.jurisdiction,
      responsibleParty: rule.responsibleParty,
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo,
      sourceCheckedAt: sourceCheckedAt(rule, source) ?? rule.sourceCheckedAt ?? source.lastVerifiedAt ?? '',
      // International was excluded above, so the class is citation-legal.
      evidenceClass: rule.evidenceClass as SourceCitation['evidenceClass'],
    },
  };
}

function withheld(reason: WithholdReason): GateVerdict {
  return { verdict: 'withheld', reason };
}

function sourceCheckedAt(rule: CanonicalRule, source: CanonicalSource): string | null {
  // Prefer the rule's own pinpoint-check date; fall back to the source's.
  return rule.sourceCheckedAt ?? source.lastVerifiedAt;
}

function isStale(checkedAt: string | null, analysisDate: Date, maxAgeDays: number): boolean {
  if (!checkedAt) return true;
  const checked = Date.parse(checkedAt);
  if (Number.isNaN(checked)) return true;
  const ageMs = analysisDate.getTime() - checked;
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}

function withinTemporalValidity(rule: CanonicalRule, source: CanonicalSource, analysisDate: Date): boolean {
  const when = analysisDate.getTime();
  const ruleOk = withinRange(rule.effectiveFrom, rule.effectiveTo, when);
  if (!ruleOk) return false;

  if (rule.evidenceClass === 'binding_official_rule') {
    // A binding rule needs a verified temporal start; null start on a dated
    // binding provision blocks the concern (docs/DATABASE_SCHEMA.md §6).
    if (!rule.effectiveFrom) return false;
    return withinRange(source.effectiveFrom, source.effectiveTo, when);
  }
  // Official guidance without formal dates needs current verification.
  if (!rule.currentGuidanceVerifiedAt) return false;
  return isStale(rule.currentGuidanceVerifiedAt, analysisDate, 365);
}

function withinRange(from: string | null, to: string | null, when: number): boolean {
  // `from` inclusive, `to` exclusive (docs/DATABASE_SCHEMA.md §2/§6).
  if (from && when < Date.parse(`${from}T00:00:00Z`)) return false;
  if (to && when >= Date.parse(`${to}T00:00:00Z`)) return false;
  return true;
}
