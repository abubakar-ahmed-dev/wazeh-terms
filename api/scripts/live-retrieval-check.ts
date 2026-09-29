/**
 * Phase 10 live verification checklist (docs/TESTING.md release evidence;
 * master plan §Phase 10 exit criteria). Run ONLY against the real endpoint
 * as part of real work — never in CI, never on a timer:
 *
 *   SANITY_CONTEXT_MCP_URL=… SANITY_ORGANIZATION_TOKEN=… \
 *   SANITY_PROJECT_ID=… SANITY_DATASET=… \
 *   LIVE_KNOWN_ANSWER_QUERY="recruitment costs employer" \
 *   LIVE_KNOWN_ANSWER_RULE_KEY=ae-recruitment-costs-employer-bears \
 *   npm run live:retrieval -w api
 *
 * Steps: tools/list + mode verification → known-answer read → gate a demo
 * candidate end to end. Output records pass/fail per step; nothing from the
 * endpoint is echoed beyond counts and verdicts.
 */
import { loadConfig } from '../src/config.js';
import { readCanonicalRule } from '../src/services/canonical/reader.js';
import { gateCandidate } from '../src/services/eligibility/gate.js';
import { verifyKnownAnswer } from '../src/services/retrieval/known-answer.js';
import { createFetchMcpTransport } from '../src/services/retrieval/transport.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const { sanity, retrieval } = config;

  if (!sanity.contextMcpUrl || !sanity.projectId || !sanity.dataset) {
    console.error('FAIL setup: SANITY_CONTEXT_MCP_URL / SANITY_PROJECT_ID / SANITY_DATASET are required.');
    process.exitCode = 1;
    return;
  }

  const transport = createFetchMcpTransport({
    url: sanity.contextMcpUrl,
    bearerToken: sanity.organizationToken,
    timeoutMs: retrieval.timeoutMs,
  });

  // Step 1+2: tools/list and Knowledge Base mode verification happen inside
  // the known-answer check; a wrong-mode endpoint fails here.
  const query = process.env.LIVE_KNOWN_ANSWER_QUERY;
  const expectRuleKey = process.env.LIVE_KNOWN_ANSWER_RULE_KEY;
  if (!query || !expectRuleKey) {
    console.error('FAIL setup: LIVE_KNOWN_ANSWER_QUERY and LIVE_KNOWN_ANSWER_RULE_KEY are required.');
    process.exitCode = 1;
    return;
  }

  const knownAnswer = await verifyKnownAnswer(transport, { query, expectRuleKey });
  if (knownAnswer.ok) {
    console.log(`PASS tools/list + mode verification + known-answer read (${knownAnswer.entryCount} entries).`);
  } else {
    console.error(`FAIL known-answer: ${knownAnswer.reason}.`);
    process.exitCode = 1;
    transport.close();
    return;
  }

  // Step 3: read the canonical rule and run it through the eligibility gate
  // with the live configuration. Proves the citation path end to end.
  const canonical = await readCanonicalRule(
    {
      projectId: sanity.projectId,
      dataset: sanity.dataset,
      readToken: sanity.readToken,
      timeoutMs: retrieval.timeoutMs,
    },
    expectRuleKey,
    null,
  );
  if (!canonical.ok) {
    console.error(`FAIL canonical read: ${canonical.reason}.`);
    process.exitCode = 1;
    transport.close();
    return;
  }

  const verdict = gateCandidate(
    { entryId: 'live-check', ruleKey: canonical.rule.ruleKey, revision: canonical.rule.revision, snippet: 'live-check' },
    canonical.rule,
    canonical.source,
    {
      analysisDate: new Date(),
      sourceCheckMaxAgeDays: retrieval.sourceCheckMaxAgeDays,
      machineConditions: {
        chargeClassPresent: true,
        chargePayerStated: true,
        frequencyCovered: true,
        totalComponentsCheckable: true,
      },
    },
  );
  if (verdict.verdict === 'eligible') {
    console.log(
      `PASS gate: rule ${verdict.citation.ruleKey} r${verdict.citation.ruleRevision} → ${verdict.citation.sourceKey}/${verdict.citation.versionKey}.`,
    );
  } else {
    console.error(`FAIL gate: withheld (${verdict.reason}).`);
    process.exitCode = 1;
  }
  transport.close();
}

void main();
