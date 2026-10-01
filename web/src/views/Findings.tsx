import { useMemo } from 'react';

import { EVIDENCE_LABELS, formatDateTime, roleLabel } from '../lib/format';
import { FIELD_LABELS, type AnalysisResponse, type Finding, type IssuedExtraction, type SourceCitation } from '../lib/types';
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
  issued,
  onReviewAnother,
  onReset,
}: {
  report: AnalysisResponse;
  issued?: IssuedExtraction | null;
  onReviewAnother: () => void;
  onReset: () => void;
}) {
  const partial = report.status === 'partial';
  const presentCategories = CATEGORY_ORDER.filter((category) =>
    report.findings.some((finding) => finding.category === category.key),
  );

  const documentRoleMap = useMemo(() => {
    const map = new Map<string, 'offer' | 'contract'>();
    if (issued?.documents) {
      for (const doc of issued.documents) {
        map.set(doc.documentId, doc.role);
      }
    } else if (report.coverage.documentIds.length === 2 && report.coverage.documentIds[0] && report.coverage.documentIds[1]) {
      map.set(report.coverage.documentIds[0], 'offer');
      map.set(report.coverage.documentIds[1], 'contract');
    }
    return map;
  }, [issued, report.coverage.documentIds]);

  return (
    <div className="view">
      <div className="view__inner view__inner--wide findings-view">
        <div className="findings-overview">
          <span className="eyebrow">Step 4 of 4: Findings Report</span>
          <div className="findings-overview__header">
            <div>
              <h1 tabIndex={-1} style={{ margin: 0, fontSize: '1.75rem' }}>Your document review</h1>
              <p style={{ margin: '0.4rem 0 0', color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
                <span className={`chip ${partial ? 'chip--state-unclear' : 'chip--state-found'}`}>
                  {partial ? 'Partial review' : 'Complete review'}
                </span>{' '}
                · reviewed {formatDateTime(report.reviewedAsOf)} · documents:{' '}
                <strong style={{ color: 'var(--ink)' }}>
                  {report.coverage.documentIds.length > 0
                    ? report.coverage.documentIds.map((_, index) => (index === 0 ? 'offer' : 'contract')).join(' + ')
                    : 'none'}
                </strong>
              </p>
            </div>
            <div>
              <span className="chip chip--scenario">Pakistan → UAE Mainland Private</span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
            {report.scopeApplicability === 'supported'
              ? 'Applicability for the Pakistan → UAE mainland private-sector route was checked. That checks the route, not the offer.'
              : report.scopeApplicability === 'conflicting'
                ? 'The documents contain wording that conflicts with the declared category, so category-specific rules were withheld.'
                : 'The employment category could not be established, so category-specific rules were withheld.'}
          </p>
        </div>

        {partial ? (
          <Notice kind="incomplete" role="status" title="Partial review">
            <p>{report.summary}</p>
            {report.limitations.map((limitation) => (
              <p key={limitation}>{limitation}</p>
            ))}
          </Notice>
        ) : null}

        <div className="findings-attention">
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>What needs your attention</h2>
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
        </div>

        {presentCategories.map((category) => (
          <section
            key={category.key}
            id={`finding-${category.key}`}
            aria-labelledby={`finding-${category.key}-h`}
            className="findings-section"
          >
            <h2 id={`finding-${category.key}-h`} className="findings-section__header">
              <span>{category.heading}</span>
            </h2>
            {report.findings
              .filter((finding) => finding.category === category.key)
              .map((finding) => (
                <FindingCard key={finding.id} finding={finding} documentRoleMap={documentRoleMap} />
              ))}
          </section>
        ))}

        <details className="group" style={{ marginTop: '2.5rem' }}>
          <summary className="group__summary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <svg
                className="group__chevron"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <strong>What we checked</strong>
            </div>
            <span className="chip">{Object.keys(report.stages).length} stages</span>
          </summary>
          <div className="fieldcard">
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Processing Stages</h4>
            <div className="stage-grid">
              {Object.entries(report.stages).map(([stage, status]) => (
                <div key={stage} className="stage-item">
                  <span className="stage-item__name">{stage}</span>
                  <span className="stage-item__status">
                    {status === 'not_applicable' && stage === 'comparison'
                      ? 'Not applicable — only one document supplied.'
                      : status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: '0.5rem 0' }}>
              <strong>Fields checked: </strong>
              <span style={{ color: 'var(--ink-secondary)' }}>
                {report.coverage.checkedFieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ')}
              </span>
            </p>
            {report.coverage.unreadableFieldKeys.length > 0 ? (
              <p style={{ margin: '0.5rem 0', color: 'var(--incomplete-ink)' }}>
                <strong>Could not read: </strong>
                {report.coverage.unreadableFieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ')}
              </p>
            ) : null}
            {report.coverage.omittedChecks.map((omitted) => (
              <p key={omitted} style={{ margin: '0.5rem 0', color: 'var(--incomplete-ink)' }}>
                <strong>Omitted check: </strong>{omitted}
              </p>
            ))}
          </div>
        </details>

        {report.officialNextSteps.length > 0 ? (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Official next steps</h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              Check verified official government resources for your procedure:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {report.officialNextSteps.map((step) => (
                <li key={step.url}>
                  <a className="button button--secondary" href={step.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem' }}>
                    {step.label} (leaves WazehTerms) ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="findings-actions">
          <button className="button" onClick={onReviewAnother}>
            Review another sample
          </button>
          <button className="button button--secondary" onClick={onReset}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  documentRoleMap,
}: {
  finding: Finding;
  documentRoleMap: Map<string, 'offer' | 'contract'>;
}) {
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
      <div className="finding__header">
        <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{heading}</h3>
        {finding.importance ? (
          <span className={`chip chip--priority-${finding.importance}`} style={{ textTransform: 'capitalize' }}>
            {finding.importance} priority
          </span>
        ) : null}
      </div>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--ink)', margin: '0.5rem 0 1rem' }}>{finding.explanation}</p>

      {finding.documentEvidence.length > 0 ? (
        finding.category === 'document_mismatch' ? (
          <div className="mismatch-box">
            {finding.documentEvidence.map((evidence, index) => {
              const role = documentRoleMap.get(evidence.documentId) ?? (index === 0 ? 'offer' : 'contract');
              return (
                <div
                  key={index}
                  className={`mismatch-pane ${role === 'offer' ? 'mismatch-pane--offer' : 'mismatch-pane--contract'}`}
                >
                  <div className="mismatch-pane__head">
                    {role === 'offer' ? 'Offer wording' : 'Contract wording'}
                  </div>
                  <EvidenceQuote evidence={evidence} role={role} />
                </div>
              );
            })}
          </div>
        ) : (
          finding.documentEvidence.map((evidence, index) => {
            const role = documentRoleMap.get(evidence.documentId);
            return <EvidenceQuote key={index} evidence={evidence} role={role} />;
          })
        )
      ) : null}

      {finding.valueOrigins.includes('user') ? (
        <p className="evidence__label" style={{ marginTop: '0.5rem', color: 'var(--incomplete-ink)' }}>
          Part of this difference comes from your correction — it is labelled as yours.
        </p>
      ) : null}

      {finding.source ? <Citation source={finding.source} /> : null}

      <div className="action-step-box">
        <svg
          className="action-step-box__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="action-step-box__content">
          <strong>Suggested question or step:</strong>{' '}
          <span>{finding.suggestedQuestionOrStep}</span>
        </div>
      </div>

      {finding.uncertaintyReasons.length > 0 ? (
        <p className="evidence__label" style={{ marginTop: '0.5rem' }}>
          Why we are careful here: {finding.uncertaintyReasons.join(', ')}
        </p>
      ) : null}
    </article>
  );
}

export function Citation({ source }: { source: SourceCitation }) {
  const isGuidance = source.evidenceClass === 'official_guidance';
  return (
    <div className="notice notice--source citation">
      <div className="citation__header">
        <span className="notice__title">{isGuidance ? 'Official guidance' : 'Official rule'}</span>
        <span className="chip chip--scenario">{source.issuingAuthority}</span>
      </div>
      <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
        {source.issuingAuthority} · {source.jurisdiction === 'AE' ? 'UAE' : 'Pakistan'} · responsible:{' '}
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{source.responsibleParty.replace(/_/g, ' ')}</span>
      </p>
      <p style={{ margin: '0.5rem 0 0.25rem' }}>
        <strong>{source.pinpoint.label}</strong>
      </p>
      <blockquote className="evidence__quote">“{source.pinpoint.quote}”</blockquote>
      <p style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', margin: '0.6rem 0 0.5rem' }}>
        In force from {source.effectiveFrom ?? 'not dated'} · source checked {formatDateTime(source.sourceCheckedAt)}
      </p>
      <p style={{ margin: '0.75rem 0 0' }}>
        <a className="button button--secondary" href={source.officialUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.88rem', padding: '0.35rem 0.85rem', minHeight: '38px' }}>
          Open the official source (leaves WazehTerms) ↗
        </a>
      </p>
      <details className="group" style={{ marginTop: '0.85rem', background: 'rgba(0,0,0,0.2)' }}>
        <summary className="group__summary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}>
          <strong>Source details</strong>
        </summary>
        <div style={{ padding: '0.75rem 0.85rem' }}>
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
        </div>
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
