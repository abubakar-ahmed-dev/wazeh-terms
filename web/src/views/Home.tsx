/**
 * Home (spec §4.1; P4 §2 rework): prominent sample CTA, illustrative example,
 * connected 4-step workflow strip, and unified scope & limits panel.
 */
import { Notice } from '../ui';

export function Home({
  capabilityState,
  sampleModeEnabled,
  customUploadEnabled,
  onTrySample,
  onUploadClick,
  onRetryCapabilities,
  onOpenHelp,
  onOpenTechnical,
}: {
  capabilityState: 'loading' | 'ready' | 'error';
  sampleModeEnabled: boolean | null;
  customUploadEnabled?: boolean | null;
  onTrySample: () => void;
  onUploadClick?: () => void;
  onRetryCapabilities: () => void;
  onOpenHelp?: (slug: string) => void;
  onOpenTechnical?: () => void;
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
              sampleModeEnabled ? (
                <>
                  <button className="button" onClick={onTrySample}>
                    <span>Try a sample review</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  {customUploadEnabled ? (
                    <button className="button button--secondary" onClick={onUploadClick}>
                      Try with a fictional PDF
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => onOpenHelp?.('getting-started')}
                    >
                      Read the short guide
                    </button>
                  )}
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
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                  <button
                    type="button"
                    className="guide-link"
                    onClick={() => onOpenHelp?.('troubleshooting')}
                  >
                    Read troubleshooting guide →
                  </button>
                </p>
              </Notice>
            )}
          </div>

          <p className="hero__sub">
            No account needed.{' '}
            {customUploadEnabled ? (
              <>Demo mode — try the review with a fictional PDF. Not for real job offers or contracts.</>
            ) : (
              <>Personal document upload is not available yet — this public demo works with fictional samples only.</>
            )}{' '}
            <button
              type="button"
              className="guide-link"
              onClick={() => onOpenHelp?.('getting-started')}
            >
              First time? Read the short guide.
            </button>
          </p>

          {/* Illustrative Example (P4 §2: Offer vs Contract comparison preview) */}
          <div className="hero-mockup" aria-label="Visual demonstration of offer versus contract comparison">
            <div className="hero-mockup__head">
              <span><strong>Illustrative example</strong> · Comparing offer and contract</span>
              <span className="chip chip--scenario">Changed salary</span>
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
              <span><strong>Different wording detected:</strong> Basic salary differs by AED 600.00 between offer and contract.</span>
            </div>
          </div>
        </section>

        {/* 4-Step Connected Journey Stepper (P4 §2.1; HOME-2) */}
        <section id="how-it-works" className="stepper-section" aria-labelledby="four-steps-heading">
          <div className="section-head">
            <h2 id="four-steps-heading">The four steps</h2>
            <p>How WazehTerms reads and compares documents before you sign.</p>
          </div>

          <ol className="stepper-strip">
            <li className="stepper-step">
              <div className="stepper-step__head">
                <div className="stepper-step__num" aria-hidden="true">1</div>
                <h3>Choose documents</h3>
              </div>
              <p>Pick a fictional sample, or upload your own fictional PDFs (offer, contract, or both).</p>
              <button
                type="button"
                className="guide-link"
                onClick={() => onOpenHelp?.('trying-samples')}
              >
                Read sample guide →
              </button>
            </li>

            <li className="stepper-step">
              <div className="stepper-step__head">
                <div className="stepper-step__num" aria-hidden="true">2</div>
                <h3>Read documents</h3>
              </div>
              <p>WazehTerms extracts the written terms from the pages, with original excerpts and page numbers.</p>
              <button
                type="button"
                className="guide-link"
                onClick={() => onOpenHelp?.('getting-started')}
              >
                Read workflow guide →
              </button>
            </li>

            <li className="stepper-step">
              <div className="stepper-step__head">
                <div className="stepper-step__num" aria-hidden="true">3</div>
                <h3>Verify terms</h3>
              </div>
              <p>You check each extracted value against the original pages across 12 groups, and correct anything wrong.</p>
              <button
                type="button"
                className="guide-link"
                onClick={() => onOpenHelp?.('checking-terms')}
              >
                Read checking guide →
              </button>
            </li>

            <li className="stepper-step">
              <div className="stepper-step__head">
                <div className="stepper-step__num" aria-hidden="true">4</div>
                <h3>Findings report</h3>
              </div>
              <p>Differences, missing terms, questions, and source-backed concerns, each supported by evidence.</p>
              <button
                type="button"
                className="guide-link"
                onClick={() => onOpenHelp?.('reading-findings')}
              >
                Read findings guide →
              </button>
            </li>
          </ol>
        </section>

        {/* Scope and Limits Boundaries (P4 §2 merged limits panel) */}
        <div className="limits-card" aria-labelledby="limits-heading">
          <h2 id="limits-heading">What this does not check</h2>
          <ul>
            <li>
              <strong>Supported scope:</strong> Rule checks target one corridor: Pakistan to UAE mainland,
              non-domestic private-sector employment.
            </li>
            <li>
              <strong>No verification or legal advice:</strong> WazehTerms does not verify employers, visas, or
              document authenticity, and does not provide legal advice.
            </li>
            <li>
              <strong>No overall verdicts:</strong> It never issues a "safe", "compliant", or "clean" judgment —
              the assessment remains yours.
            </li>
            <li>
              <strong>Document limits:</strong> A single document cannot produce a comparison; unreadable pages
              hide terms from every check.
            </li>
          </ul>
          <p style={{ margin: '0.75rem 0 0' }}>
            <button
              type="button"
              className="guide-link"
              onClick={() => onOpenHelp?.('scope-and-privacy')}
            >
              Read the full scope and privacy guide →
            </button>
          </p>
        </div>

        {/* Engineering and Project Discovery */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
          <span>Want to inspect the architecture? </span>
          <button
            type="button"
            className="guide-link"
            onClick={onOpenTechnical}
          >
            How WazehTerms works inside →
          </button>
        </div>
      </div>
    </div>
  );
}
