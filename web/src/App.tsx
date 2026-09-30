/**
 * App shell, view router, and the single in-memory case state (spec §2, §5).
 * Private case data lives in React state only — never in URLs or storage.
 * Phase 12: Elevated dark theme with interactive workflow stepper and sleek header.
 */
import { useCallback, useEffect, useState } from 'react';

import { ApiError, analyze, extractSample, getCapabilities, getSamples } from './lib/api';
import type {
  AnalysisResponse,
  Capabilities,
  CorrectionDelta,
  ExtractionResponse,
  IssuedExtraction,
  Proof,
  SampleEntry,
} from './lib/types';
import { Findings } from './views/Findings';
import { Home } from './views/Home';
import { Review } from './views/Review';
import { Samples } from './views/Samples';
import { DocumentIcon, ErrorPanel, Notice } from './ui';

type View = 'home' | 'examples' | 'start' | 'extracting' | 'review' | 'analyzing' | 'result';

const RELOAD_COPY = 'A reload cannot restore an in-progress review — private case data is never saved.';

function currentPath(): View {
  switch (window.location.pathname) {
    case '/examples':
      return 'examples';
    case '/start':
      return 'start';
    case '/review':
      return 'review';
    case '/result':
      return 'result';
    default:
      return 'home';
  }
}

export function App() {
  const [view, setView] = useState<View>(currentPath);

  const [capabilityState, setCapabilityState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [busyCaseId, setBusyCaseId] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssuedExtraction | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'complete' | 'partial' | null>(null);
  const [extractionNotices, setExtractionNotices] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<CorrectionDelta[]>([]);
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeSample, setActiveSample] = useState<SampleEntry | null>(null);

  const navigate = useCallback((next: View) => {
    const path = next === 'home' ? '/' : `/${next}`;
    window.history.pushState({}, '', path);
    setView(next);
  }, []);

  useEffect(() => {
    const onPop = () => setView(currentPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Move focus to the view heading on view change (spec §7).
  useEffect(() => {
    const heading = document.querySelector<HTMLHeadingElement>('#main h1');
    heading?.focus();
    window.scrollTo(0, 0);
  }, [view]);

  const loadCapabilities = useCallback(() => {
    setCapabilityState('loading');
    setCapabilities(null);
    void getCapabilities()
      .then((caps) => {
        setCapabilities(caps);
        setCapabilityState('ready');
        if (caps.sampleModeEnabled) {
          return getSamples().then((listing) => setSamples(listing.samples));
        }
      })
      .catch(() => {
        setCapabilities(null);
        setCapabilityState('error');
      });
  }, []);

  useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  const resetCase = useCallback(() => {
    setIssued(null);
    setProof(null);
    setExtractionStatus(null);
    setExtractionNotices([]);
    setCorrections([]);
    setReport(null);
    setExtractionError(null);
    setAnalysisError(null);
    setActiveSample(null);
    navigate('home');
  }, [navigate]);

  const startSample = useCallback(
    (sampleCaseId: string) => {
      const sample = samples.find((entry) => entry.sampleCaseId === sampleCaseId) ?? null;
      setActiveSample(sample);
      setBusyCaseId(sampleCaseId);
      setExtractionError(null);
      navigate('extracting');
      void extractSample(sampleCaseId)
        .then((response: ExtractionResponse) => {
          setIssued(response.issuedExtraction);
          setProof(response.proof);
          setExtractionStatus(response.status);
          setExtractionNotices(response.notices);
          setCorrections([]);
          navigate('review');
        })
        .catch((error: unknown) => {
          const message =
            error instanceof ApiError && error.status === 422
              ? 'No usable text could be read from this sample. Try another one.'
              : error instanceof ApiError
                ? error.message
                : 'The extraction request failed.';
          setExtractionError(message);
        })
        .finally(() => setBusyCaseId(null));
    },
    [navigate, samples],
  );

  const continueToAnalysis = useCallback(() => {
    if (!issued || !proof) return;
    setAnalysisError(null);
    navigate('analyzing');
    void analyze(issued, proof, corrections)
      .then((response) => {
        setReport(response);
        navigate('result');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 410 || error.status === 409 || error.status === 422)) {
          setAnalysisError('This review can no longer be continued. Start again to get a fresh extraction.');
        } else {
          setAnalysisError(error instanceof ApiError ? error.message : 'The analysis request failed.');
        }
      });
  }, [corrections, issued, navigate, proof]);

  const addCorrection = useCallback((delta: CorrectionDelta) => {
    setCorrections((existing) => [
      ...existing.filter((entry) => !(entry.documentId === delta.documentId && entry.instanceId === delta.instanceId)),
      delta,
    ]);
  }, []);

  const removeCorrection = useCallback((key: string) => {
    setCorrections((existing) =>
      existing.filter((entry) => `${entry.documentId}:${entry.fieldKey}:${entry.instanceId}` !== key),
    );
  }, []);

  const previewUrls = (activeSample?.documents ?? []).map((document) => ({
    role: document.role,
    url: document.previewUrl,
  }));

  const inReviewFlow = view === 'extracting' || view === 'review' || view === 'analyzing' || view === 'result';

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand-group">
            <a
              className="wordmark"
              href="/"
              onClick={(event) => {
                event.preventDefault();
                resetCase();
              }}
            >
              <DocumentIcon className="wordmark__icon" />
              <span>WazehTerms</span>
            </a>
            <span className="brand-badge">Demo</span>
          </div>

          <nav className="app-nav" aria-label="Main Navigation">
            <button
              className={`nav-link ${view === 'home' ? 'nav-link--active' : ''}`}
              onClick={() => {
                if (inReviewFlow) resetCase();
                else navigate('home');
              }}
            >
              Home
            </button>
            <button
              className={`nav-link ${view === 'examples' ? 'nav-link--active' : ''}`}
              onClick={() => navigate('examples')}
            >
              Fictional Samples
            </button>
            <a
              className="nav-link"
              href="/#how-it-works"
              onClick={(event) => {
                if (view !== 'home') {
                  event.preventDefault();
                  navigate('home');
                  setTimeout(() => {
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }
              }}
            >
              How it works
            </a>
          </nav>
        </div>
      </header>

      {inReviewFlow ? (
        <aside className="workflow-bar" aria-label="Review Progress">
          <div className="workflow-bar__inner">
            <ol className="workflow-steps">
              <li className="workflow-step workflow-step--done">
                <span>1. Choose Sample</span>
                <span className="workflow-sep" aria-hidden="true">→</span>
              </li>
              <li className={`workflow-step ${view === 'extracting' ? 'workflow-step--active' : view === 'review' || view === 'analyzing' || view === 'result' ? 'workflow-step--done' : ''}`}>
                <span>2. Extraction</span>
                <span className="workflow-sep" aria-hidden="true">→</span>
              </li>
              <li className={`workflow-step ${view === 'review' ? 'workflow-step--active' : view === 'analyzing' || view === 'result' ? 'workflow-step--done' : ''}`}>
                <span>3. Verify Terms</span>
                <span className="workflow-sep" aria-hidden="true">→</span>
              </li>
              <li className={`workflow-step ${view === 'result' ? 'workflow-step--active' : ''}`}>
                <span>4. Findings Report</span>
              </li>
            </ol>
            {activeSample ? (
              <span className="chip chip--scenario">
                {activeSample.title}
              </span>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main id="main">
        {view === 'home' ? (
          <Home
            capabilityState={capabilityState}
            sampleModeEnabled={capabilities?.sampleModeEnabled ?? null}
            onTrySample={() => navigate('examples')}
            onRetryCapabilities={loadCapabilities}
          />
        ) : null}

        {view === 'examples' ? (
          <Samples samples={samples} onStart={startSample} busyCaseId={busyCaseId} />
        ) : null}

        {view === 'start' ? (
          <div className="view">
            <div className="view__inner">
              <h1 tabIndex={-1}>Personal document review</h1>
              <Notice kind="incomplete" title="Personal document upload is not available yet.">
                <p>
                  This public demo works with fictional samples only. When upload passes its privacy and testing
                  gates, this page will offer a personal review.
                </p>
              </Notice>
              <p>
                <button className="button" onClick={() => navigate('examples')}>
                  Try a fictional sample instead
                </button>
              </p>
            </div>
          </div>
        ) : null}

        {view === 'extracting' ? (
          <div className="view">
            <div className="view__inner pending-panel">
              <div className="spinner" aria-hidden="true" />
              <h1 tabIndex={-1}>
                Reading the documents
              </h1>
              <p role="status">
                {activeSample ? activeSample.title : 'Your sample'} is being read…
              </p>
              <p>Extracting 33 material components across salary, dates, benefits, and clauses.</p>
              {extractionError ? (
                <ErrorPanel message={extractionError}>
                  <button className="button" onClick={() => navigate('examples')}>
                    Choose another sample
                  </button>
                </ErrorPanel>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === 'review' && issued ? (
          <>
            {extractionStatus === 'partial' ? (
              <div className="view" style={{ paddingBottom: 0 }}>
                <div className="view__inner view__inner--wide">
                  <Notice kind="incomplete" role="status" title="Partial extraction">
                    {extractionNotices.map((notice) => (
                      <p key={notice}>{notice}</p>
                    ))}
                  </Notice>
                </div>
              </div>
            ) : null}
            <Review
              issued={issued}
              previewUrls={previewUrls}
              corrections={corrections}
              onCorrect={addCorrection}
              onUndoCorrection={removeCorrection}
              onContinue={continueToAnalysis}
              onReset={resetCase}
            />
          </>
        ) : null}

        {view === 'review' && !issued ? (
          <div className="view">
            <div className="view__inner">
              <h1 tabIndex={-1}>
                Nothing to review yet
              </h1>
              <Notice kind="incomplete" role="status">
                <p>{RELOAD_COPY}</p>
              </Notice>
              <button className="button" onClick={() => navigate('examples')}>
                Choose a sample
              </button>
            </div>
          </div>
        ) : null}

        {view === 'analyzing' ? (
          <div className="view">
            <div className="view__inner pending-panel">
              <div className="spinner" aria-hidden="true" />
              <h1 tabIndex={-1}>
                Comparing written terms and checking sources
              </h1>
              <p role="status">
                Analyzing explicit terms deterministically and querying official labor rules…
              </p>
              {analysisError ? (
                <ErrorPanel message={analysisError}>
                  <button className="button" onClick={() => navigate('examples')}>
                    Start a fresh review
                  </button>
                </ErrorPanel>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === 'result' && report ? (
          <Findings report={report} onReviewAnother={() => navigate('examples')} onReset={resetCase} />
        ) : null}

        {view === 'result' && !report ? (
          <div className="view">
            <div className="view__inner">
              <h1 tabIndex={-1}>
                No report to show
              </h1>
              <Notice kind="incomplete" role="status">
                <p>{RELOAD_COPY}</p>
              </Notice>
              <button className="button" onClick={() => navigate('examples')}>
                Choose a sample
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <div className="footer-copy">
            <p>
              <strong>WazehTerms</strong> reviews written employment terms before signing. It does not verify employers, visas, or documents, and it is not
              legal advice — official help may still be needed. Findings cite approved official sources; personal
              document upload stays closed until its release gates pass.
            </p>
          </div>
          <div className="footer-links">
            <a href="https://console.cloud.google.com/terms/data-processing" target="_blank" rel="noreferrer">
              Privacy & Provider
            </a>
            <a href="https://www.sanity.io/docs" target="_blank" rel="noreferrer">
              Source Policy
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
