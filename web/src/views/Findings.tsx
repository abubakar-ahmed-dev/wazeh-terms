/**
 * Findings report (P4 §7 rework): priority-first ordering across categories,
 * search + filters + reset with live counts (plan §8.11/§8.12), per-category
 * card anatomy, three zero-states (R20 — the coverage gate decides the
 * words), one slim partial banner, absent-category summary line (issue 17),
 * no "unknown priority" chip (issue 10), effectiveTo range shown (issue 11).
 * Presentation only — findings data is never mutated by filtering.
 */
import { useMemo, useState } from 'react';

import { EVIDENCE_LABELS, formatDateTime, roleLabel } from '../lib/format';
import { FIELD_LABELS, type AnalysisResponse, type Finding, type IssuedExtraction, type SourceCitation } from '../lib/types';
import { unit } from '../content/guides';
import { EmptyMessage, EvidenceQuote, Icon, InfoTip, StepIntro } from '../ui';

const CATEGORY_ORDER: ReadonlyArray<{ key: Finding['category']; heading: string }> = [
  { key: 'document_mismatch', heading: 'Different wording in the two documents' },
  { key: 'source_backed_concern', heading: 'Concern to check against an official source' },
  { key: 'missing_information', heading: 'Information we could not find' },
  { key: 'needs_clarification', heading: 'Question to clarify' },
  { key: 'unable_to_determine', heading: 'Could not determine' },
];

const IMPORTANCE_RANK: Record<Finding['importance'], number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

type ImportanceFilter = 'all' | Finding['importance'];
type CategoryFilter = 'all' | Finding['category'];

const headingFor = (finding: Finding): string => {
  const fieldNames = finding.fieldKeys.map((key) => FIELD_LABELS[key] ?? key).join(', ');
  switch (finding.category) {
    case 'document_mismatch':
      return `Different wording: ${fieldNames}`;
    case 'source_backed_concern':
      return `Charge to question: ${fieldNames}`;
    case 'missing_information':
      return `Not stated: ${fieldNames}`;
    case 'needs_clarification':
      return `To clarify: ${fieldNames}`;
    default:
      return `Could not determine: ${fieldNames}`;
  }
};

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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<ImportanceFilter>('all');

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

  // Priority-first order, stable within equal keys (P4 §7.2).
  const ordered = useMemo(() => {
    const categoryRank = new Map(CATEGORY_ORDER.map((entry, index) => [entry.key, index]));
    return report.findings
      .map((finding, index) => ({ finding, index }))
      .sort(
        (a, b) =>
          IMPORTANCE_RANK[a.finding.importance] - IMPORTANCE_RANK[b.finding.importance] ||
          (categoryRank.get(a.finding.category) ?? 99) - (categoryRank.get(b.finding.category) ?? 99) ||
          a.index - b.index,
      )
      .map((entry) => entry.finding);
  }, [report.findings]);

  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const finding of report.findings) {
      const parts = [
        headingFor(finding),
        finding.explanation,
        ...finding.fieldKeys.map((key) => FIELD_LABELS[key] ?? key),
        ...finding.documentEvidence.map((evidence) => evidence.quote),
        finding.suggestedQuestionOrStep,
      ];
      map.set(finding.id, parts.join(' ').toLowerCase());
    }
    return map;
  }, [report.findings]);

  const searchTrimmed = search.trim().toLowerCase();
  const filtered = ordered.filter((finding) => {
    if (categoryFilter !== 'all' && finding.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && finding.importance !== priorityFilter) return false;
    if (searchTrimmed && !(haystacks.get(finding.id) ?? '').includes(searchTrimmed)) return false;
    return true;
  });
  const filtersActive = searchTrimmed !== '' || categoryFilter !== 'all' || priorityFilter !== 'all';

  const presentCategories = CATEGORY_ORDER.filter((category) =>
    report.findings.some((finding) => finding.category === category.key),
  );
  const absentCategories = CATEGORY_ORDER.filter(
    (category) => !presentCategories.some((entry) => entry.key === category.key),
  ).map((category) => category.heading);

  const allStagesSettled =
    !partial &&
    Object.values(report.stages).every((status) => status === 'completed' || status === 'not_applicable');

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setPriorityFilter('all');
  };

  const categoryLabel = (key: Finding['category']): string =>
    CATEGORY_ORDER.find((entry) => entry.key === key)?.heading ?? key;

  return (
    <div className="view">
      <div className="view__inner view__inner--wide findings-view">
        <div className="findings-overview">
          <span className="eyebrow">Step 4 of 4 · Findings report</span>
          <div className="findings-overview__header">
            <div>
              <h1 tabIndex={-1} style={{ margin: 0, fontSize: '1.75rem' }}>
                Your document review
              </h1>
              <p style={{ margin: '0.4rem 0 0', color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
                <span
                  className={`chip ${partial ? 'chip--state-unclear' : 'chip--state-found'}`}
                  aria-describedby={undefined}
                >
                  {partial ? 'Partial review' : 'Complete review'}
                </span>{' '}
                <InfoTip label="What the status means" unit={unit('fnd.tip.status')} /> · reviewed{' '}
                {formatDateTime(report.reviewedAsOf)} · documents:{' '}
                <strong style={{ color: 'var(--ink)' }}>
                  {report.coverage.documentIds.length > 0
                    ? report.coverage.documentIds.map((_, index) => (index === 0 ? 'offer' : 'contract')).join(' + ')
                    : 'none'}
                </strong>
              </p>
            </div>
            <span className="chip chip--scenario">Pakistan → UAE Mainland Private</span>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', margin: '0.75rem 0 0', lineHeight: 1.5 }}>
            {report.scopeApplicability === 'supported'
              ? 'Applicability for the Pakistan → UAE mainland private-sector route was checked. That checks the route, not the offer.'
              : report.scopeApplicability === 'conflicting'
                ? 'The documents contain wording that conflicts with the declared category, so category-specific rules were withheld.'
                : 'The employment category could not be established, so category-specific rules were withheld.'}
          </p>
          <StepIntro title={unit('fnd.intro').title}>
            {unit('fnd.intro').body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </StepIntro>
        </div>

        {partial ? (
          <div className="notice notice--incomplete partial-banner" role="status">
            <span className="notice__title">
              <Icon name="alert" size={16} /> Partial review
            </span>
            <p className="partial-banner__summary">{report.summary}</p>
            {report.limitations.map((limitation) => (
              <p className="partial-banner__limitation" key={limitation}>
                {limitation}
              </p>
            ))}
            <a
              className="guide-link"
              href="#findings-coverage"
              onClick={(event) => {
                event.preventDefault();
                document.getElementById('findings-coverage')?.scrollIntoView({ block: 'start' });
              }}
            >
              What was withheld, and what remains usable →
            </a>
          </div>
        ) : null}

        <section className="findings-attention" aria-label="Findings">
          <div className="findings-toolbar">
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>What needs your attention</h2>
            <div className="findings-toolbar__controls">
              <label className="findings-toolbar__search">
                <span className="sr-only">Search findings</span>
                <Icon name="search" size={14} />
                <input
                  type="search"
                  value={search}
                  placeholder="Search this report"
                  onChange={(event) => setSearch(event.target.value)}
                />
                <InfoTip label="About search" unit={unit('fnd.search.scope')} />
              </label>
              <label className="findings-toolbar__select">
                <span className="sr-only">Filter by category</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
                  <option value="all">All categories</option>
                  {CATEGORY_ORDER.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.heading}
                    </option>
                  ))}
                </select>
              </label>
              <label className="findings-toolbar__select">
                <span className="sr-only">Filter by priority</span>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as ImportanceFilter)}>
                  <option value="all">All priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <button type="button" className="link-button" onClick={resetFilters} disabled={!filtersActive}>
                Reset
              </button>
            </div>
            <p className="findings-count" role="status">
              {filtered.length} of {report.findings.length} finding
              {report.findings.length === 1 ? '' : 's'} shown
              {filtersActive ? ' with current filters' : ''} ·{' '}
              <InfoTip label="What priority means" unit={unit('fnd.tip.priority')} /> priority orders reading, not risk
            </p>
            {absentCategories.length > 0 && !filtersActive ? (
              <p className="findings-absent">
                Not flagged by finished checks: {absentCategories.join(' · ')}
              </p>
            ) : null}
          </div>

          {report.findings.length === 0 ? (
            partial || !allStagesSettled ? (
              <EmptyMessage message={unit('fnd.zero.partial').body[0] ?? ''} />
            ) : (
              <div className="zero-clean" role="status">
                <h3>{unit('fnd.zero.clean').title}</h3>
                <p>{unit('fnd.zero.clean').body[0] ?? ''}</p>
              </div>
            )
          ) : filtered.length === 0 ? (
            <EmptyMessage
              message={`${unit('fnd.zero.filtered').title}. ${unit('fnd.zero.filtered').body[0] ?? ''}`}
              action={
                <button type="button" className="link-button" onClick={resetFilters}>
                  Reset filters to see all {report.findings.length} findings
                </button>
              }
            />
          ) : (
            <ol className="findings-list">
              {filtered.map((finding) => (
                <li key={finding.id}>
                  <FindingCard finding={finding} documentRoleMap={documentRoleMap} categoryLabel={categoryLabel(finding.category)} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <details className="group" id="findings-coverage" style={{ marginTop: '2.5rem' }}>
          <summary className="group__summary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Icon name="chevron" size={18} />
              <strong>What we checked</strong>
            </div>
            <span className="chip">{Object.keys(report.stages).length} stages</span>
          </summary>
          <div className="fieldcard">
            <p style={{ margin: '0 0 0.75rem', color: 'var(--ink-secondary)' }}>
              {unit('fnd.coverage.intro').body[0]}
            </p>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Processing stages</h4>
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
                <strong>Omitted check: </strong>
                {omitted}
              </p>
            ))}
          </div>
        </details>

        {report.officialNextSteps.length > 0 ? (
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h2>Official next steps</h2>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>{unit('fnd.nextSteps.line').body[0]}</p>
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
          <button type="button" className="button" onClick={onReviewAnother}>
            Review another set of documents
          </button>
          <button type="button" className="button button--secondary" onClick={onReset}>
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
  categoryLabel,
}: {
  finding: Finding;
  documentRoleMap: Map<string, 'offer' | 'contract'>;
  categoryLabel: string;
}) {
  return (
    <article className={`card finding finding--${finding.category}`}>
      <div className="finding__header">
        <span className={`finding__category cat-${finding.category}`}>
          <span className="finding__category-dot" aria-hidden="true" />
          {categoryLabel}
        </span>
        {finding.importance !== 'unknown' ? (
          <span className={`chip chip--priority-${finding.importance}`} style={{ textTransform: 'capitalize' }}>
            {finding.importance} priority
          </span>
        ) : null}
      </div>
      <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.15rem' }}>{headingFor(finding)}</h3>
      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--ink)', margin: '0.5rem 0 1rem' }}>
        {finding.explanation}
      </p>

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
                  <div className="mismatch-pane__head">{role === 'offer' ? 'Offer wording' : 'Contract wording'}</div>
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
        <Icon name="info" size={18} />
        <div className="action-step-box__content">
          <strong>Suggested question or step:</strong> <span>{finding.suggestedQuestionOrStep}</span>
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
        <span className="notice__title">
          {isGuidance ? 'Official guidance' : 'Official rule'}
          <InfoTip label="About this citation" unit={unit('fnd.tip.citation')} />
        </span>
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
        In force from {source.effectiveFrom ?? 'not dated'}
        {source.effectiveTo ? ` to ${source.effectiveTo}` : ''} · source checked {formatDateTime(source.sourceCheckedAt)}
      </p>
      <p style={{ margin: '0.75rem 0 0' }}>
        <a
          className="button button--secondary"
          href={source.officialUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '0.88rem', padding: '0.35rem 0.85rem', minHeight: '38px' }}
        >
          Open the official source (leaves WazehTerms) ↗
        </a>
      </p>
      <details className="group" style={{ marginTop: '0.85rem' }}>
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

export { EVIDENCE_LABELS, roleLabel };
