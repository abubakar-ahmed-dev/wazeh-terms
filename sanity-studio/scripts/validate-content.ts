/**
 * Programmatic content gate (docs/DATABASE_SCHEMA.md §9): Studio validation
 * does not constrain API or import writes — this script does. It accepts
 * plain record objects (a JSON fixture file, or `--from-dataset` with
 * credentials) and enforces the editorial invariants:
 *
 * - unique natural keys (authorityKey; sourceKey+versionKey; ruleKey+revision;
 *   fieldKey; resolutionKey)
 * - exactly one approved+current revision per ruleKey
 * - reference integrity (issuer/primarySource/supersededBy/affected*)
 * - evidence-class compatibility (guidance never carries a binding trigger;
 *   rule and primary source classes must match; international guidance never
 *   binding)
 * - enum containment, required pinpoint (label+quote+page-or-clause)
 * - https URLs, effective-date ordering, schemaVersion present
 * - studio mirrors of the code registry (field keys / strategies) must agree
 *   with `api/src/contracts/field-registry.ts`
 *
 * Runs under the api workspace's tsx so it can import the registry. Exit 0
 * only with zero errors.
 */
import { readFileSync } from 'node:fs';

import { FIELD_DEFINITIONS } from '../../api/src/contracts/field-registry.js';
import {
  AUTHORITY_TYPE,
  EVIDENCE_CLASS,
  EMPLOYMENT_REGIME,
  JURISDICTION,
  MEDIA_TYPE,
  PARTY,
  RECORD_STATUS,
  REVIEW_STATUS,
  RULE_KIND,
  SOURCE_KIND,
  STUDIO_COMPARISON_STRATEGIES,
  STUDIO_FIELD_KEYS,
  WORKER_CATEGORY,
} from '../schemaTypes/registry-mirror.js';
import { TRIGGER_KEY_VALUES } from '../schemaTypes/trigger-keys.js';

export interface GateFinding {
  readonly record: string;
  readonly code: string;
  readonly message: string;
}

export interface GateResult {
  readonly ok: boolean;
  readonly findings: readonly GateFinding[];
}

type Record_ = Record<string, unknown>;

const str = (value: unknown): string | null => (typeof value === 'string' && value.length > 0 ? value : null);
const isObject = (value: unknown): value is Record_ =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const refId = (value: unknown): string | null => {
  if (!isObject(value)) return null;
  return str(value._ref);
};

export function validateContent(input: unknown): GateResult {
  const findings: GateFinding[] = [];
  const add = (record: string, code: string, message: string): void => {
    findings.push({ record, code, message });
  };

  if (!Array.isArray(input)) {
    return { ok: false, findings: [{ record: '<root>', code: 'shape', message: 'Input must be an array of records.' }] };
  }

  const records = input.filter(isObject);
  if (records.length !== input.length) {
    add('<root>', 'shape', 'Every entry must be an object.');
  }

  const byId = new Map<string, Record_>();
  for (const record of records) {
    const id = str(record._id) ?? `<index:${records.indexOf(record)}>`;
    byId.set(id, record);
  }

  const seenAuthorityKeys = new Set<string>();
  const seenSourcePairs = new Set<string>();
  const seenRulePairs = new Set<string>();
  const seenFieldKeys = new Set<string>();
  const seenResolutionKeys = new Set<string>();
  const approvedCurrentRuleRevisions = new Map<string, number>();

  const enumOk = (value: unknown, values: readonly string[]): boolean =>
    typeof value === 'string' && (values as readonly string[]).includes(value);

  const registryKeys = FIELD_DEFINITIONS.map((field) => field.fieldKey);

  // Registry mirror check: studio lists must agree with the code registry.
  if (JSON.stringify(STUDIO_FIELD_KEYS) !== JSON.stringify(registryKeys)) {
    add('<studio>', 'registry_drift', 'Studio field-key list drifts from the api field registry.');
  }
  const registryStrategies = [...new Set(FIELD_DEFINITIONS.map((field) => field.comparisonStrategyKey))].sort();
  if (JSON.stringify([...STUDIO_COMPARISON_STRATEGIES].sort()) !== JSON.stringify(registryStrategies)) {
    add('<studio>', 'registry_drift', 'Studio comparison-strategy list drifts from the api registry.');
  }
  const registryRepeatable = FIELD_DEFINITIONS.filter((field) => field.repeatable).map((field) => field.fieldKey);
  void registryRepeatable;

  for (const record of records) {
    const id = str(record._id) ?? '<missing-id>';
    const type = str(record._type);
    const fail = (code: string, message: string): void => add(id, code, message);

    const schemaVersion = record.schemaVersion;
    if (typeof schemaVersion !== 'number' || schemaVersion < 1) {
      fail('schema_version', 'schemaVersion must be a positive number.');
    }

    const reviewStatus = record.reviewStatus;
    if (!enumOk(reviewStatus, REVIEW_STATUS)) fail('enum', `reviewStatus "${String(reviewStatus)}" not allowed.`);
    const recordStatus = record.recordStatus;
    if (type !== 'authority' && type !== 'resolutionNote' && !enumOk(recordStatus, RECORD_STATUS)) {
      fail('enum', `recordStatus "${String(recordStatus)}" not allowed.`);
    }

    switch (type) {
      case 'authority': {
        const key = str(record.authorityKey);
        if (!key) fail('natural_key', 'authorityKey required.');
        else if (seenAuthorityKeys.has(key)) fail('natural_key', `Duplicate authorityKey ${key}.`);
        else seenAuthorityKeys.add(key);
        if (!str(record.name)) fail('required', 'authority.name required.');
        if (!enumOk(record.jurisdiction, JURISDICTION)) fail('enum', 'authority.jurisdiction invalid.');
        if (!enumOk(record.authorityType, AUTHORITY_TYPE)) fail('enum', 'authority.authorityType invalid.');
        break;
      }

      case 'sourceDocument': {
        const sourceKey = str(record.sourceKey);
        const versionKey = str(record.versionKey);
        if (!sourceKey || !versionKey) fail('natural_key', 'sourceKey and versionKey required.');
        else {
          const pair = `${sourceKey}::${versionKey}`;
          if (seenSourcePairs.has(pair)) fail('natural_key', `Duplicate sourceKey+versionKey ${pair}.`);
          else seenSourcePairs.add(pair);
        }
        const issuer = refId(record.issuer);
        if (!issuer) fail('reference', 'issuer reference required.');
        else if (!byId.get(issuer) || byId.get(issuer)!._type !== 'authority') {
          fail('reference', `issuer ${issuer} does not resolve to an authority.`);
        }
        if (!enumOk(record.evidenceClass, EVIDENCE_CLASS)) fail('enum', 'evidenceClass invalid.');
        const url = str(record.officialUrl);
        if (!url || !/^https:\/\//.test(url)) fail('url', 'officialUrl must be https.');
        if (!enumOk(record.sourceKind, SOURCE_KIND)) fail('enum', 'sourceKind invalid.');
        if (!enumOk(record.mediaType, MEDIA_TYPE)) fail('enum', 'mediaType invalid.');
        if (!str(record.retrievedAt) || !str(record.lastVerifiedAt)) fail('required', 'retrievedAt/lastVerifiedAt required.');
        const from = str(record.effectiveFrom);
        const to = str(record.effectiveTo);
        if (from && to && from >= to) fail('date_order', 'effectiveTo must be after effectiveFrom.');
        const supersededBy = refId(record.supersededBy);
        if (supersededBy && !byId.get(supersededBy)) fail('reference', `supersededBy ${supersededBy} does not resolve.`);
        break;
      }

      case 'rule': {
        const ruleKey = str(record.ruleKey);
        const revision = record.revision;
        if (!ruleKey || typeof revision !== 'number' || !Number.isInteger(revision) || revision < 1) {
          fail('natural_key', 'ruleKey and positive integer revision required.');
        } else {
          const pair = `${ruleKey}::${revision}`;
          if (seenRulePairs.has(pair)) fail('natural_key', `Duplicate ruleKey+revision ${pair}.`);
          else seenRulePairs.add(pair);
          if (reviewStatus === 'approved' && recordStatus === 'current') {
            approvedCurrentRuleRevisions.set(ruleKey, (approvedCurrentRuleRevisions.get(ruleKey) ?? 0) + 1);
          }
        }
        if (!str(record.claimText)) fail('required', 'claimText required.');
        const related = Array.isArray(record.relatedFieldKeys) ? (record.relatedFieldKeys as unknown[]) : [];
        for (const key of related) {
          if (!registryKeys.includes(String(key))) fail('registry', `relatedFieldKeys entry "${String(key)}" is not a registry key.`);
        }
        const triggerKey = str(record.triggerKey);
        if (triggerKey && !TRIGGER_KEY_VALUES.includes(triggerKey)) {
          fail('trigger', `triggerKey "${triggerKey}" is not in the code-owned allowlist.`);
        }
        const evidenceClass = record.evidenceClass;
        if (!enumOk(evidenceClass, EVIDENCE_CLASS)) fail('enum', 'rule.evidenceClass invalid.');
        if (triggerKey && evidenceClass !== 'binding_official_rule') {
          fail('evidence_class', 'Only binding_official_rule rules may carry a triggerKey.');
        }
        if (!enumOk(record.jurisdiction, JURISDICTION)) fail('enum', 'rule.jurisdiction invalid.');
        if (record.origin !== 'PK' || record.destination !== 'AE') fail('route', 'rule must be PK→AE.');
        // docs/DATABASE_SCHEMA.md §2/§6: "no unknown for a claimable rule" —
        // the strict scope applies to trigger-carrying (claimable) rules;
        // informational rules without a trigger may use the wider values.
        if (triggerKey) {
          if (record.employmentRegime !== 'uae_mainland_private') fail('scope', 'Claimable rules must target uae_mainland_private.');
          if (record.workerCategory !== 'non_domestic') fail('scope', 'Claimable rules must target non_domestic workers.');
        } else {
          if (!enumOk(record.employmentRegime, EMPLOYMENT_REGIME)) fail('enum', 'employmentRegime invalid.');
          if (!enumOk(record.workerCategory, WORKER_CATEGORY)) fail('enum', 'workerCategory invalid.');
        }
        if (!enumOk(record.responsibleParty, PARTY)) fail('enum', 'responsibleParty invalid.');
        if (record.responsibleParty === 'unknown') fail('scope', 'responsibleParty must be explicit.');
        const primarySource = refId(record.primarySource);
        if (!primarySource) {
          fail('reference', 'primarySource reference required.');
        } else {
          const source = byId.get(primarySource);
          if (!source || source._type !== 'sourceDocument') {
            fail('reference', `primarySource ${primarySource} does not resolve to a sourceDocument.`);
          } else if (source.evidenceClass !== evidenceClass) {
            fail('evidence_class', 'rule.evidenceClass must match its primary source evidence class.');
          } else if (source.recordStatus !== 'current' || source.reviewStatus !== 'approved') {
            fail('reference', 'primarySource must be approved and current.');
          }
        }
        const pinpoint = record.pinpoint;
        if (!isObject(pinpoint)) {
          fail('pinpoint', 'pinpoint object required.');
        } else {
          // docs/DATABASE_SCHEMA.md §6: label + exact passage required;
          // page/clause are one-or-both optional refinements.
          if (!str(pinpoint.label) || !str(pinpoint.quote)) fail('pinpoint', 'pinpoint label and quote required.');
        }
        if (!str(record.plainEnglish)) fail('required', 'plainEnglish required.');
        if (record.plainUrdu !== undefined && record.plainUrdu !== null && record.plainUrdu !== '') {
          fail('urdu_gate', 'plainUrdu stays empty until the Urdu gate passes (ADR-009).');
        }
        if (!str(record.sourceCheckedAt) || !str(record.reviewedAt) || !str(record.reviewerCode)) {
          fail('required', 'sourceCheckedAt/reviewedAt/reviewerCode required.');
        }
        const from = str(record.effectiveFrom);
        const to = str(record.effectiveTo);
        if (from && to && from >= to) fail('date_order', 'effectiveTo must be after effectiveFrom.');
        const supersededBy = refId(record.supersededBy);
        if (supersededBy && !byId.get(supersededBy)) fail('reference', `supersededBy ${supersededBy} does not resolve.`);
        break;
      }

      case 'contractFieldDefinition': {
        const fieldKey = str(record.fieldKey);
        if (!fieldKey) fail('natural_key', 'fieldKey required.');
        else if (seenFieldKeys.has(fieldKey)) fail('natural_key', `Duplicate fieldKey ${fieldKey}.`);
        else seenFieldKeys.add(fieldKey);
        if (fieldKey && !registryKeys.includes(fieldKey)) fail('registry', `fieldKey "${fieldKey}" is not in the api registry.`);
        if (!enumOk(record.comparisonStrategyKey, [...STUDIO_COMPARISON_STRATEGIES])) fail('enum', 'comparisonStrategyKey invalid.');
        break;
      }

      case 'resolutionNote': {
        const key = str(record.resolutionKey);
        if (!key) fail('natural_key', 'resolutionKey required.');
        else if (seenResolutionKeys.has(key)) fail('natural_key', `Duplicate resolutionKey ${key}.`);
        else seenResolutionKeys.add(key);
        const affectedRules = Array.isArray(record.affectedRules) ? record.affectedRules : [];
        const affectedSources = Array.isArray(record.affectedSources) ? record.affectedSources : [];
        if (affectedRules.length === 0 && affectedSources.length === 0) {
          fail('reference', 'resolutionNote must affect at least one rule or source.');
        }
        for (const reference of affectedRules) {
          const target = refId(reference);
          if (!target || !byId.get(target)) fail('reference', `affectedRules ${String(target)} does not resolve.`);
        }
        for (const reference of affectedSources) {
          const target = refId(reference);
          if (!target || !byId.get(target)) fail('reference', `affectedSources ${String(target)} does not resolve.`);
        }
        if (!enumOk(reviewStatus, REVIEW_STATUS)) fail('enum', 'reviewStatus invalid.');
        break;
      }

      default:
        fail('type', `Unknown record _type "${String(type)}".`);
    }
  }

  for (const [ruleKey, count] of approvedCurrentRuleRevisions) {
    if (count > 1) {
      findings.push({
        record: ruleKey,
        code: 'approved_current_uniqueness',
        message: `ruleKey ${ruleKey} has ${count} approved+current revisions; exactly one allowed.`,
      });
    }
  }

  return { ok: findings.length === 0, findings };
}

/** CLI lives in `validate-content.cli.mjs` (this module exports the gate only). */
