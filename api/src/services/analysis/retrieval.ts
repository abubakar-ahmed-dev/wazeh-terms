/**
 * Retrieval orchestration (docs/TECHNICAL_ARCHITECTURE.md §3.2 steps 5–6):
 * fact-only KB queries for the triggered topics, bounded tool loop, mapping
 * of every candidate through the canonical reader and the eligibility gate.
 *
 * Failure philosophy (docs/ADR-010): retrieval problems never touch document
 * findings. Unavailable/misconfigured → disclosure + partial; per-candidate
 * failures → withheld with a reason; nothing is guessed.
 */
import type { StageStatus } from '../../contracts/index.js';
import type { AppConfig } from '../../config.js';
import type { FindingDraft } from '../../compare/compare.js';
import type { ScopeApplicability, SourceCitation } from '../../contracts/index.js';
import type { CanonicalRead, CanonicalReadFailed } from '../canonical/reader.js';
import { gateCandidate, type WithholdReason } from '../eligibility/gate.js';
import { evaluateTriggers, type TriggerEvaluation } from '../eligibility/triggers.js';
import { triggerDefinition, type MachineConditionContext } from '../eligibility/trigger-keys.js';
import { parseKbToolResult, type RuleCandidate } from '../retrieval/candidates.js';
import { initializeMcpClient, callKbTool } from '../retrieval/client.js';
import { buildRetrievalQuery, kbSearchArguments } from '../retrieval/query-builder.js';
import { McpTransportError, type McpTransport } from '../retrieval/transport.js';
import type { Reconciliation } from './reconcile.js';

export type RetrievalStage = StageStatus;

export interface RetrievalOutcome {
  readonly stage: RetrievalStage;
  /** Finding drafts for eligible candidates — empty unless the gate passed them. */
  readonly sourceFindings: readonly FindingDraft[];
  /** Every gated-and-withheld candidate, with its closed reason. */
  readonly withheld: ReadonlyArray<{ readonly ruleKey: string | null; readonly reason: WithholdReason }>;
  /** Set when retrieval could not run at all (unconfigured handled upstream). */
  readonly disclosure?: string;
}

export interface RetrievalService {
  run(input: {
    readonly reconciliation: Reconciliation;
    readonly scopeApplicability: ScopeApplicability;
    readonly analysisDate: Date;
    readonly deadlineMs: number;
  }): Promise<RetrievalOutcome>;
}

export interface RetrievalServiceOptions {
  readonly config: AppConfig;
  /** Injected transport — tests use a fake; production uses the fetch client. */
  readonly transport: McpTransport | null;
  readonly reader: ((ruleKey: string, revision: number | null) => Promise<CanonicalRead | CanonicalReadFailed>) | null;
}

interface TriggeredTopic {
  readonly triggerKey: string;
  readonly topic: 'worker_costs' | 'pay';
  readonly fieldKeys: readonly string[];
}

export function createRetrievalService(options: RetrievalServiceOptions): RetrievalService {
  return {
    async run(input): Promise<RetrievalOutcome> {
      const { config } = options;
      const unconfigured = !options.transport || !options.reader || !config.sanity.contextMcpUrl;
      if (unconfigured || input.scopeApplicability !== 'supported') {
        // Unconfigured is reported upstream (stage not_started + limitation);
        // unsupported scope keeps rules withheld without any retrieval call.
        return { stage: 'not_started', sourceFindings: [], withheld: [] };
      }

      const triggers = evaluateTriggers(input.reconciliation.offer, input.reconciliation.contract);
      const topics = triggeredTopics(triggers);
      if (topics.length === 0) {
        // Nothing triggered: the retrieval stage ran and had nothing to ask.
        return { stage: 'completed', sourceFindings: [], withheld: [] };
      }

      const init = await initializeMcpClient(options.transport);
      if (init.status !== 'ready' || !init.kbTools?.length) {
        return {
          stage: 'failed',
          sourceFindings: [],
          withheld: [],
          disclosure:
            init.status === 'wrong_mode'
              ? 'The configured reference endpoint is not in Knowledge Base mode, so no rule-backed concerns were checked.'
              : 'The reference endpoint could not be reached, so no rule-backed concerns were checked.',
        };
      }

      const deadlineAt = Date.now() + input.deadlineMs;
      const toolBudget = config.retrieval.maxToolCalls;
      let toolCalls = 0;
      const sourceFindings: FindingDraft[] = [];
      const withheld: Array<{ ruleKey: string | null; reason: WithholdReason }> = [];

      for (const topic of topics) {
        if (toolCalls >= toolBudget || Date.now() >= deadlineAt) break;

        const query = buildRetrievalQuery(topic.topic, input.analysisDate);
        let result: unknown;
        try {
          result = await callKbTool(options.transport, init.kbTools[0]!.name, kbSearchArguments(query));
          toolCalls += 1;
        } catch (error) {
          if (error instanceof McpTransportError && error.reason === 'timeout') break;
          return {
            stage: 'failed',
            sourceFindings: [],
            withheld,
            disclosure: 'The reference endpoint could not be reached, so no rule-backed concerns were checked.',
          };
        }

        const { candidates } = parseKbToolResult(result);
        for (const candidate of candidates.slice(0, 4)) {
          if (toolCalls >= toolBudget || Date.now() >= deadlineAt) break;
          const canonical = await readCanonicalRecord(options, candidate, deadlineAt);
          toolCalls += canonical.reads;
          if (!canonical.read) {
            if (canonical.failure) withheld.push({ ruleKey: candidate.ruleKey ?? null, reason: canonical.failure });
            continue;
          }
          const verdict = gateCandidate(candidate, canonical.read.rule, canonical.read.source, {
            analysisDate: input.analysisDate,
            sourceCheckMaxAgeDays: config.retrieval.sourceCheckMaxAgeDays,
            machineConditions: triggers.machineConditions as MachineConditionContext,
          });
          if (verdict.verdict === 'withheld') {
            withheld.push({ ruleKey: canonical.read.rule.ruleKey, reason: verdict.reason });
            continue;
          }
          sourceFindings.push(sourceFindingDraft(topic, canonical.read.rule, verdict.citation));
        }
      }

      return { stage: 'completed', sourceFindings, withheld };
    },
  };
}

interface CanonicalLookup {
  readonly read: CanonicalRead | null;
  /** Set when the canonical read failed with a reportable reason. */
  readonly failure: WithholdReason | null;
  readonly reads: number;
}

async function readCanonicalRecord(
  options: RetrievalServiceOptions,
  candidate: Pick<RuleCandidate, 'ruleKey' | 'revision'>,
  deadlineAt: number,
): Promise<CanonicalLookup> {
  // An unmappable candidate never spends a canonical read.
  if (!candidate.ruleKey || !options.reader) {
    return { read: null, failure: 'unmappable_candidate', reads: 0 };
  }
  if (Date.now() >= deadlineAt) return { read: null, failure: 'unmappable_candidate', reads: 0 };
  const read = await options.reader(candidate.ruleKey, candidate.revision ?? null);
  return { read: read.ok ? read : null, failure: read.ok ? null : mapReadFailure(read, candidate.revision), reads: 1 };
}

function mapReadFailure(failure: CanonicalReadFailed, pinnedRevision: number | undefined): WithholdReason {
  switch (failure.reason) {
    case 'not_found':
      // A pinned revision that no longer exists against an approved current
      // record is a revision mismatch; an unpinned miss maps to nothing.
      return pinnedRevision === undefined ? 'unmappable_candidate' : 'revision_mismatch';
    case 'ambiguous_record':
      return 'ambiguous_record';
    case 'schema_version_unsupported':
      return 'schema_version_unsupported';
    case 'unavailable':
      return 'unmappable_candidate';
  }
}

function triggeredTopics(triggers: TriggerEvaluation): TriggeredTopic[] {
  const topics: TriggeredTopic[] = [];
  if (triggers.workerChargePayer.fired) {
    topics.push({
      triggerKey: 'worker_charge.payer_must_be_uae_employer',
      topic: 'worker_costs',
      fieldKeys: triggers.workerChargePayer.fieldKeys,
    });
  }
  if (triggers.paymentFrequencyMonthly.fired) {
    topics.push({
      triggerKey: 'salary.payment_frequency_must_be_monthly',
      topic: 'pay',
      fieldKeys: triggers.paymentFrequencyMonthly.fieldKeys,
    });
  }
  if (triggers.statedTotalMatchesComponents.fired) {
    topics.push({
      triggerKey: 'salary.stated_total_must_match_components',
      topic: 'pay',
      fieldKeys: triggers.statedTotalMatchesComponents.fieldKeys,
    });
  }
  return topics.filter((topic) => !!triggerDefinition(topic.triggerKey));
}

function sourceFindingDraft(
  topic: TriggeredTopic,
  rule: { claimText: string; plainEnglish: string; triggerKey: string | null },
  citation: SourceCitation,
): FindingDraft {
  const triggerLabel = topic.topic === 'worker_costs' ? 'worker-paid costs' : 'pay terms';
  return {
    category: 'source_backed_concern',
    fieldKeys: [...topic.fieldKeys],
    importance: topic.topic === 'worker_costs' ? 'high' : 'medium',
    explanation: `${rule.plainEnglish} (Official source: ${citation.issuingAuthority}, ${citation.pinpoint.label}.)`,
    documentEvidence: [],
    valueOrigins: ['document'],
    source: citation,
    uncertaintyReasons: [],
    suggestedQuestionOrStep: `Ask the employer to confirm, in writing, how the ${triggerLabel} in your documents align with the cited official provision.`,
  } satisfies FindingDraft;
}
