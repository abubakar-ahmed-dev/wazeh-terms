/**
 * Sample chooser (spec §4.2, P4 §3 rework): manifest-driven cards; scenario
 * badges in plain words with an InfoTip each (P3 U2); case ids demoted to the
 * preview disclosure; jargon removed (issue 19).
 */
import { useState } from 'react';

import type { SampleEntry } from '../lib/types';
import { unit } from '../content/guides';
import { Icon, InfoTip } from '../ui';

function scenarioTag(caseId: string): string {
  switch (caseId) {
    case 'TC-001':
      return 'Consistent terms';
    case 'TC-002':
      return 'Changed salary';
    case 'TC-012':
      return 'Worker recruitment charge';
    case 'TC-013':
      return 'Missing notice clause';
    case 'TC-014':
      return 'Single contract (abstention)';
    case 'TC-015':
      return 'Adversarial instructions';
    default:
      return 'Document scenario';
  }
}

function scenarioTipId(caseId: string): string {
  switch (caseId) {
    case 'TC-001':
      return 'smp.scenario.consistent';
    case 'TC-002':
      return 'smp.scenario.salary';
    case 'TC-012':
      return 'smp.scenario.charge';
    case 'TC-013':
      return 'smp.scenario.missing';
    case 'TC-014':
      return 'smp.scenario.single';
    case 'TC-015':
      return 'smp.scenario.adversarial';
    default:
      return 'smp.intro';
  }
}

export function Samples({
  samples,
  onStart,
  busyCaseId,
  onOpenHelp,
}: {
  samples: SampleEntry[];
  onStart: (sampleCaseId: string) => void;
  busyCaseId: string | null;
  onOpenHelp?: (slug: string) => void;
}) {
  const [previewCase, setPreviewCase] = useState<string | null>(null);

  return (
    <div className="view">
      <div className="view__inner">
        <header style={{ marginBottom: '2rem' }}>
          <span className="eyebrow">Worked examples</span>
          <h1 tabIndex={-1}>Explore a fictional example</h1>
          <p>
            {unit('smp.intro').body[0]}{' '}
            <button
              type="button"
              className="guide-link"
              onClick={() => onOpenHelp?.('trying-samples')}
            >
              Read guide to trying samples →
            </button>
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {samples.map((sample) => {
            const isBusy = busyCaseId === sample.sampleCaseId;
            const isPreviewOpen = previewCase === sample.sampleCaseId;
            return (
              <article key={sample.sampleCaseId} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span className="chip">Fictional sample</span>
                  <span className="brand-badge">
                    {scenarioTag(sample.sampleCaseId)}
                    <InfoTip label={`About the ${scenarioTag(sample.sampleCaseId)} scenario`} unit={unit(scenarioTipId(sample.sampleCaseId))} />
                  </span>
                </div>

                <h2>{sample.title}</h2>

                <div className="card__chips">
                  {sample.documents.map((document) => (
                    <span
                      key={document.role}
                      className={`chip ${document.role === 'offer' ? 'chip--offer' : 'chip--contract'}`}
                    >
                      <Icon name="doc" size={11} />
                      {document.role === 'offer' ? 'Job offer (PDF)' : 'Employment contract (PDF)'}
                    </span>
                  ))}
                </div>

                <p>{sample.description}</p>

                <div className="doc-pane__toolbar" style={{ marginTop: '1.25rem' }}>
                  <button
                    className="button"
                    disabled={busyCaseId !== null}
                    onClick={() => onStart(sample.sampleCaseId)}
                  >
                    {isBusy ? (
                      <>
                        <span className="spinner" style={{ width: '1rem', height: '1rem', margin: 0 }} aria-hidden="true" />
                        <span>Starting review…</span>
                      </>
                    ) : (
                      <>
                        <span>Review this sample</span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                  <button
                    className="button button--secondary"
                    aria-expanded={isPreviewOpen}
                    onClick={() => setPreviewCase(isPreviewOpen ? null : sample.sampleCaseId)}
                  >
                    {isPreviewOpen ? 'Hide files' : 'Preview files'}
                  </button>
                </div>

                {isPreviewOpen ? (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'var(--surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--ink)' }}>
                      Sample files — the actual PDFs this review reads
                    </p>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                      Sample set {sample.sampleCaseId} · {unit('smp.preview').body[0]}
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {sample.documents.map((document) => (
                        <li key={document.previewUrl} style={{ marginBottom: '0.25rem' }}>
                          <a href={document.previewUrl} target="_blank" rel="noreferrer">
                            {document.role === 'offer'
                              ? 'Offer (PDF, opens elsewhere)'
                              : 'Contract (PDF, opens elsewhere)'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
