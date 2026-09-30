/** Findings report (spec §4.7): status + limitations first, categories in API order. */
import { EVIDENCE_LABELS, formatDateTime, roleLabel } from '../lib/format';
import { FIELD_LABELS, type AnalysisResponse, type Finding, type SourceCitation } from '../lib/types';
import { EvidenceQuote, Notice } from '../ui';

const CATEGORY_ORDER: ReadonlyArray<{ key: Finding['category']; heading: string }> = [
  { key: 'document_mismatch', heading: 'Different wording in the two documents' },
  { key: 'source_backed_concern', heading: 'Concern to check against an official source' },
  { key: 'missing_information', heading: 'Information we could not find' },
  { key: 'needs_clarification', heading: 'Question to clarify' },
  { key: 'unable_to_determine', heading: 'Could not determine' },
];

export function Findings({
  report,
  onReviewAnother,
  onReset,
}: {
  report: AnalysisResponse;
  onReviewAnother: () => void;
  onReset: () => void;
}) {
  const partial = report.status === 'partial';
  const presentCategories = CATEGORY_ORDER.filter((category) =>
    report.findings.some((finding) => finding.category === category.key),
  );

  return (
    <div className="view__inner" style={{ maxWidth: 'none' }}>
      <h1 tabIndex={-1}>Your document review</h1>
      <p>
        {partial ? 'Partial review' : 'Complete review'} · reviewed {formatDateTime(report.reviewedAsOf)} · documents:{' '}
        {report.coverage.documentIds.length > 0 ? report.coverage.documentIds.map((_, index) => (index === 0 ? 'offer' : 'contract')).join(' + ') : 'none'}
      </p>
      <p>
        {report.scopeApplicability === 'supported'
          ? 'Applicability for the Pakistan → UAE mainland private-sector route was checked. That checks the route, not the offer.'
          : report.scopeApplicability === 'conflicting'
            ? 'The documents contain wording that conflicts with the declared category, so category-specific rules were withheld.'
            : 'The employment category could not be established, so category-specific rules were withheld.'}
      </p>

      {partial ? (
        <Notice kind="incomplete" role="status" title="Partial review">
          <p>{report.summary}</p>
          {report.limitations.map((limitation) => (
            <p key={limitation}>{limitation}</p>
          ))}
        </Notice>
      ) : null}

      <h2>What needs your attention</h2>
      <nav className="findings-nav" aria-label="Finding categories">
        {presentCategories.map((category) => {
          const count = report.findings.filter((finding) => finding.category === category.key).length;
          return (
            <a key={category.key} href={`#finding-${category.key}`}>
              {category.heading} <span className="count-badge">{count}</span>
            </a>
          );
        })}
        {presentCategories.length === 0 && !partial ? <p>{report.summary}</p> : null}
        {presentCategories.length === 0 && partial ? <p>No specific findings were produced by the checks that finished.</p> : null}
      </nav>

      {presentCategories.map((category) => (
        <section key={category.key} id={`finding-${category.key}`} aria-labelledby={`finding-${category.key}-h`}>
          <h2 id={`finding-${category.key}-h`}>{category.heading}</h2>
          {report.findings
            .filter((finding) => finding.category === category.key)
            .map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
        </section>
      ))}

      <details className="group">
        <summary className="group__summary">
          <strong>What we checked</strong>
        </summary>
        <div className="fieldcard">
          <dl>
            {Object.entries(report.stages).map(([stage, status]) => (
              <p key={stage}>
                <strong>{stage}: </strong>
                {status === 'not_applicable' && stage === 'comparison'
                  ? 'Not applicable — only one document supplied.'
                  : status.replace(/_/g, ' ')}
              </p>
            ))}
          </dl>
          <p>
            <strong>Fields checked: </strong>
            {report.coverage.checkedFieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ')}
          </p>
          {report.coverage.unreadableFieldKeys.length > 0 ? (
            <p>
              <strong>Could not read: </strong>
              {report.coverage.unreadableFieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ')}
            </p>
          ) : null}
          {report.coverage.omittedChecks.map((omitted) => (
            <p key={omitted}>Omitted: {omitted}</p>
          ))}
        </div>
      </details>

      {report.officialNextSteps.length > 0 ? (
        <div className="card">
          <h2>Official next steps</h2>
          <ul>
            {report.officialNextSteps.map((step) => (
              <li key={step.url}>
                <a href={step.url} target="_blank" rel="noreferrer">
                  {step.label} (leaves WazehTerms)
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p>
        <button className="button" onClick={onReviewAnother}>
          Review another sample
        </button>{' '}
        <button className="button button--secondary" onClick={onReset}>
          Start over
        </button>
      </p>
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const fieldNames = finding.fieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ');
  const heading =
    finding.category === 'document_mismatch'
      ? `Different wording: ${fieldNames}`
      : finding.category === 'source_backed_concern'
        ? `Charge to question: ${fieldNames}`
        : finding.category === 'missing_information'
          ? `Not stated: ${fieldNames}`
          : finding.category === 'needs_clarification'
            ? `To clarify: ${fieldNames}`
            : `Could not determine: ${fieldNames}`;
  return (
    <article className={`card finding finding--${finding.category}`}>
      <h3>{heading}</h3>
      <p>{finding.explanation}</p>
      {finding.documentEvidence.length > 0 ? (
        finding.category === 'document_mismatch' ? (
          <div>
            {finding.documentEvidence.map((evidence, index) => (
              <div key={index}>
                <p className="evidence__label">
                  <strong>{index === 0 ? 'Offer wording' : 'Contract wording'}</strong>
                </p>
                <EvidenceQuote evidence={evidence} />
              </div>
            ))}
          </div>
        ) : (
          finding.documentEvidence.map((evidence, index) => <EvidenceQuote key={index} evidence={evidence} />)
        )
      ) : null}
      {finding.valueOrigins.includes('user') ? (
        <p className="evidence__label">Part of this difference comes from your correction — it is labelled as yours.</p>
      ) : null}
      {finding.source ? <Citation source={finding.source} /> : null}
      <p>
        <strong>Suggested question or step: </strong>
        {finding.suggestedQuestionOrStep}
      </p>
      {finding.uncertaintyReasons.length > 0 ? (
        <p className="evidence__label">Why we are careful here: {finding.uncertaintyReasons.join(', ')}</p>
      ) : null}
    </article>
  );
}

export function Citation({ source }: { source: SourceCitation }) {
  const isGuidance = source.evidenceClass === 'official_guidance';
  return (
    <div className="notice notice--source citation">
      <span className="notice__title">{isGuidance ? 'Official guidance' : 'Official rule'}</span>
      <p>
        {source.issuingAuthority} · {source.jurisdiction === 'AE' ? 'UAE' : 'Pakistan'} · responsible:{' '}
        {source.responsibleParty.replace(/_/g, ' ')}
      </p>
      <p>
        <strong>{source.pinpoint.label}</strong>
      </p>
      <blockquote className="evidence__quote">“{source.pinpoint.quote}”</blockquote>
      <p>
        In force from {source.effectiveFrom ?? 'not dated'} · source checked {formatDateTime(source.sourceCheckedAt)}
      </p>
      <p>
        <a href={source.officialUrl} target="_blank" rel="noreferrer">
          Open the official source (leaves WazehTerms)
        </a>
      </p>
      <details>
        <summary>Source details</summary>
        <dl>
          <dt>Rule</dt>
          <dd>
            {source.ruleKey} revision {source.ruleRevision}
          </dd>
          <dt>Source version</dt>
          <dd>
            {source.sourceKey} / {source.versionKey}
          </dd>
          <dt>Evidence class</dt>
          <dd>{isGuidance ? 'Official guidance — explanatory, not a statute' : 'Binding official rule'}</dd>
        </dl>
      </details>
    </div>
  );
}

export function evidenceLabelFor(evidence: { verification: 'matched_text' | 'model_transcription' }): string {
  return EVIDENCE_LABELS[evidence.verification];
}

export function roleWord(role: string): string {
  return roleLabel(role);
}
