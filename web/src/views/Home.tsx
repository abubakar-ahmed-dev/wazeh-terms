/**
 * Home (spec §4.1): promise → sample action → qualifiers, capabilities-aware.
 * Phase 12: Modern dark mode redesign with illustrative comparison preview and guided pipeline.
 */
import { Notice } from '../ui';

export function Home({
  capabilityState,
  sampleModeEnabled,
  customUploadEnabled,
  onTrySample,
  onUploadClick,
  onRetryCapabilities,
}: {
  capabilityState: 'loading' | 'ready' | 'error';
  sampleModeEnabled: boolean | null;
  customUploadEnabled?: boolean | null;
  onTrySample: () => void;
  onUploadClick?: () => void;
  onRetryCapabilities: () => void;
}) {
  return (
    <div className="view">
      <div className="view__inner">
        <section className="hero">
          <span className="eyebrow">
            <span aria-hidden="true">🇵🇰 → 🇦🇪</span> Pakistan → UAE mainland private-sector job offers
          </span>
          <h1>Understand your job offer before you sign</h1>
          <p className="hero__lead">
            WazehTerms reads the written terms in a job offer and contract, shows you the exact wording it
            found, and lists differences and questions to check — with references to approved official sources where
            they apply.
          </p>

          <div className="hero__actions">
            {capabilityState === 'loading' ? (
              <Notice kind="incomplete" role="status" title="Checking available review options.">
                <p>Please wait a moment.</p>
              </Notice>
            ) : capabilityState === 'ready' ? (
              customUploadEnabled ? (
                <>
                  <button className="button" onClick={onUploadClick}>
                    <span>Review your documents</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <button className="button button--secondary" onClick={onTrySample}>
                    Try a sample review
                  </button>
                </>
              ) : sampleModeEnabled ? (
                <>
                  <button className="button" onClick={onTrySample}>
                    <span>Try a sample review</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <a
                    className="button button--secondary"
                    href="#how-it-works"
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    See how it works
                  </a>
                </>
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
          </div>

          <p className="hero__sub">
            No account needed.
          </p>
          {customUploadEnabled ? (
            <p className="hero__sub">
              Custom PDF upload is enabled — upload your offer, contract, or both for automated verification.
            </p>
          ) : (
            <p className="hero__sub">
              Personal document upload is not available yet — this public demo works with fictional samples only.
            </p>
          )}

          {/* Interactive Offer vs Contract Preview Mockup */}
          <div className="hero-mockup" aria-label="Visual demonstration of offer versus contract comparison">
            <div className="hero-mockup__head">
              <span><strong>Sample Case Demonstration</strong> · Gulf Horizon Facilities Services LLC</span>
              <span className="chip chip--scenario">Salary Mismatch</span>
            </div>
            <div className="hero-mockup__grid">
              <div className="mockup-col mockup-col--offer">
                <span className="mockup-col__label">Job Offer · Page 2</span>
                <p className="mockup-col__text">“Basic salary: AED 2,400 per month with shared housing”</p>
              </div>
              <div className="mockup-col mockup-col--contract">
                <span className="mockup-col__label">Employment Contract · Page 1</span>
                <p className="mockup-col__text">“Basic salary: AED 1,800 per month with shared housing”</p>
              </div>
            </div>
            <div className="mockup-badge">
              <span aria-hidden="true">⚠️</span>
              <span><strong>Different wording detected:</strong> Basic salary differs by AED 600.00 between offer and contract.</span>
            </div>
          </div>
        </section>

        {/* 3-Step Guided Process Pipeline */}
        <section id="how-it-works" className="stepper-section">
          <div className="section-head">
            <h2>How WazehTerms Works</h2>
            <p>A deterministic, transparent review pipeline designed to protect workers before signing.</p>
          </div>

          <ol className="pipeline-grid">
            <li className="pipeline-card">
              <div className="pipeline-card__num" aria-hidden="true">1</div>
              <h3>Choose a fictional sample or document.</h3>
              <p>
                Select from five realistic Pakistan-to-UAE cases: consistent terms, salary discrepancies, worker recruitment charges, or missing clauses.
              </p>
            </li>
            <li className="pipeline-card">
              <div className="pipeline-card__num" aria-hidden="true">2</div>
              <h3>Check the terms we extracted against the original pages.</h3>
              <p>
                Inspect verbatim passages and page citations for 33 material components across salary, dates, and benefits. Correct any misread value before analysis.
              </p>
            </li>
            <li className="pipeline-card">
              <div className="pipeline-card__num" aria-hidden="true">3</div>
              <h3>Read evidence-backed findings and questions.</h3>
              <p>
                Review side-by-side discrepancies, suggested questions for the recruiter or employer, and checked UAE MOHRE and Pakistan BEOE legal citations.
              </p>
            </li>
          </ol>
        </section>

        {/* 3 Core Trust Guarantees */}
        <div className="features-grid">
          <div className="feature-box">
            <span className="feature-box__icon" aria-hidden="true">⚖️</span>
            <h3>Deterministic Comparison</h3>
            <p>
              All salary, allowance, and date comparisons run in audited application code. Language models never invent numerical differences.
            </p>
          </div>
          <div className="feature-box">
            <span className="feature-box__icon" aria-hidden="true">📜</span>
            <h3>Curated Official Rules</h3>
            <p>
              Rule claims cite exact verified pinpoints in UAE Federal Decree-Law No. 33 and Pakistan Emigration Rules, 1979.
            </p>
          </div>
          <div className="feature-box">
            <span className="feature-box__icon" aria-hidden="true">🔒</span>
            <h3>Zero-Retention Privacy</h3>
            <p>
              Your review lives in temporary browser memory only. No worker accounts, no server databases, and no permanent document storage.
            </p>
          </div>
        </div>

        {/* Scope Boundaries */}
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
    </div>
  );
}
