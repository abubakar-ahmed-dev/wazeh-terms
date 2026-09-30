/** Home (spec §4.1): promise → sample action → qualifiers, capabilities-aware. */
import { Notice } from '../ui';

export function Home({
  capabilityState,
  sampleModeEnabled,
  onTrySample,
  onRetryCapabilities,
}: {
  capabilityState: 'loading' | 'ready' | 'error';
  sampleModeEnabled: boolean | null;
  onTrySample: () => void;
  onRetryCapabilities: () => void;
}) {
  return (
    <div className="view__inner">
      <p className="eyebrow">Pakistan → UAE mainland private-sector job offers</p>
      <h1>Understand your job offer before you sign</h1>
      <p>
        WazehTerms reads the written terms in a fictional job offer and contract, shows you the exact wording it
        found, and lists differences and questions to check — with references to approved official sources where
        they apply.
      </p>
      {capabilityState === 'loading' ? (
        <Notice kind="incomplete" role="status" title="Checking available review options.">
          <p>Please wait a moment.</p>
        </Notice>
      ) : capabilityState === 'ready' ? (
        sampleModeEnabled ? (
          <p>
            <button className="button button--full" onClick={onTrySample}>
              Try a sample review
            </button>
          </p>
        ) : (
          <Notice kind="incomplete" role="status" title="Samples are not available right now.">
            <p>Sample reviews are switched off on this deployment. Check back later.</p>
          </Notice>
        )
      ) : (
        <Notice kind="incomplete" role="alert" title="We could not check which review options are available.">
          <p>
            <button className="button" onClick={onRetryCapabilities}>
              Try again
            </button>
          </p>
        </Notice>
      )}
      <p>No account needed.</p>
      <p>Personal document upload is not available yet — this public demo works with fictional samples only.</p>

      <ol className="steps">
        <li>
          <span className="steps__num">1</span> Choose a fictional sample or document.
        </li>
        <li>
          <span className="steps__num">2</span> Check the terms we extracted against the original pages.
        </li>
        <li>
          <span className="steps__num">3</span> Read evidence-backed findings and questions.
        </li>
      </ol>

      <div className="card">
        <h2>What this does not check</h2>
        <p>
          WazehTerms does not verify employers, visas, or documents, and it does not give legal advice. A review
          compares written terms and points to official sources — official help may still be needed. Processing uses
          the Gemini API; see the privacy notice for what that means. Findings cite approved official sources only;
          sources are listed with each concern.
        </p>
        <p>
          <a href="https://console.cloud.google.com/terms/data-processing" target="_blank" rel="noreferrer">
            Provider and privacy information (opens elsewhere)
          </a>
          {' · '}
          <a href="https://www.sanity.io/docs" target="_blank" rel="noreferrer">
            How sources are handled (opens elsewhere)
          </a>
        </p>
      </div>
    </div>
  );
}
