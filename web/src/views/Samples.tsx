/**
 * Sample chooser (spec §4.2): manifest-driven cards, fixed same-origin previews.
 * Phase 12: Elevated dark scenario cards with clear categorization chips and preview drawers.
 */
import { useState } from 'react';

import type { SampleEntry } from '../lib/types';

function scenarioTag(caseId: string): string {
  switch (caseId) {
    case 'TC-001':
      return 'Consistent Terms';
    case 'TC-002':
      return 'Salary Discrepancy';
    case 'TC-012':
      return 'Worker Recruitment Charge';
    case 'TC-013':
      return 'Missing Notice Clause';
    case 'TC-014':
      return 'Single Contract / Abstention';
    default:
      return 'Document Scenario';
  }
}

export function Samples({
  samples,
  onStart,
  busyCaseId,
}: {
  samples: SampleEntry[];
  onStart: (sampleCaseId: string) => void;
  busyCaseId: string | null;
}) {
  const [previewCase, setPreviewCase] = useState<string | null>(null);

  return (
    <div className="view">
      <div className="view__inner">
        <header style={{ marginBottom: '2rem' }}>
          <span className="eyebrow">Interactive Testing Scenarios</span>
          <h1>Explore a fictional example</h1>
          <p>
            Every name, employer, and amount below is invented. Choosing a sample sends its fictional documents for
            extraction, then shows what we read for you to check.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {samples.map((sample) => {
            const isBusy = busyCaseId === sample.sampleCaseId;
            const isPreviewOpen = previewCase === sample.sampleCaseId;
            return (
              <article key={sample.sampleCaseId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="chip">Fictional sample</span>
                    <span className="chip chip--scenario">{sample.sampleCaseId}</span>
                  </div>
                  <span className="brand-badge">{scenarioTag(sample.sampleCaseId)}</span>
                </div>

                <h2>{sample.title}</h2>

                <div className="card__chips">
                  {sample.documents.map((document) => (
                    <span
                      key={document.role}
                      className={`chip ${document.role === 'offer' ? 'chip--offer' : 'chip--contract'}`}
                    >
                      <span aria-hidden="true">📄</span>
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
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)' }}>
                    <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--ink)' }}>
                      Downloadable Fictional Fixtures:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {sample.documents.map((document) => (
                        <li key={document.previewUrl} style={{ marginBottom: '0.25rem' }}>
                          <a href={document.previewUrl} target="_blank" rel="noreferrer">
                            {document.role === 'offer' ? 'Offer (PDF, opens elsewhere)' : 'Contract (PDF, opens elsewhere)'}
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
