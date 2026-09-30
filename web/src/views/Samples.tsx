/** Sample chooser (spec §4.2): manifest-driven cards, fixed same-origin previews. */
import { useState } from 'react';

import type { SampleEntry } from '../lib/types';

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
    <div className="view__inner">
      <h1>Explore a fictional example</h1>
      <p>
        Every name, employer, and amount below is invented. Choosing a sample sends its fictional documents for
        extraction, then shows what we read for you to check.
      </p>
      {samples.map((sample) => (
        <div key={sample.sampleCaseId} className="card">
          <span className="chip">Fictional sample</span>
          <h2>{sample.title}</h2>
          <div className="card__chips">
            {sample.documents.map((document) => (
              <span key={document.role} className="chip">
                {document.role === 'offer' ? 'Job offer' : 'Employment contract'}
              </span>
            ))}
          </div>
          <p>{sample.description}</p>
          <div className="doc-pane__toolbar">
            <button className="link-button" aria-expanded={previewCase === sample.sampleCaseId} onClick={() => setPreviewCase(previewCase === sample.sampleCaseId ? null : sample.sampleCaseId)}>
              {previewCase === sample.sampleCaseId ? 'Hide files' : 'Preview files'}
            </button>
            <button className="button" disabled={busyCaseId !== null} onClick={() => onStart(sample.sampleCaseId)}>
              Review this sample
            </button>
          </div>
          {previewCase === sample.sampleCaseId ? (
            <ul>
              {sample.documents.map((document) => (
                <li key={document.previewUrl}>
                  <a href={document.previewUrl} target="_blank" rel="noreferrer">
                    {document.role === 'offer' ? 'Offer (PDF, opens elsewhere)' : 'Contract (PDF, opens elsewhere)'}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}
