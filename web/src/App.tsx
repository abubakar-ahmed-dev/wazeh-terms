/**
 * App shell (P6 rework): hand-rolled routing + journey-state contract
 * (plans/usability-guides/p6-pilot.md §R30):
 *  - journey generation counter: a stale response never mutates state or
 *    navigates (issue 31);
 *  - AbortController per request; leaving a pending screen aborts and resets
 *    (no prompt — nothing user-authored exists yet), with honest copy;
 *  - analysis retry re-POSTs the SAME review, respects client-side expiry,
 *    and cannot double-submit; Retry-After shown when supplied (issue 4);
 *  - 422 INVALID_CORRECTION returns to the live review instead of ending it
 *    (issue 5);
 *  - leave-confirm guards navigation that would end an active review (issue 3);
 *  - /help serves the pilot articles (R31) via the doc view.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError, analyze, extractCustom, extractSample, getCapabilities, getSamples } from './lib/api';
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
import { Upload } from './views/Upload';
import { ARTICLES } from './content/articles';
import { JOURNEY_STEPS, unit } from './content/guides';
import { ConfirmDialog, ErrorPanel, Icon, Notice } from './ui';
import { ArticlePage, GlossaryPage, HelpHub } from './views/Help';
import { TECHNICAL_ARTICLES } from './content/technical';
import { AboutPage, TechnicalArticlePage, TechnicalHub } from './views/Technical';

type View =
  | 'home'
  | 'examples'
  | 'upload'
  | 'start'
  | 'extracting'
  | 'review'
  | 'analyzing'
  | 'result'
  | 'doc'
  | 'technical'
  | 'about';

const RELOAD_COPY = 'A reload cannot restore an in-progress review — private case data is never saved.';

function parsePath(): { view: View; docSlug: string | null } {
  const path = window.location.pathname;
  if (path === '/examples') return { view: 'examples', docSlug: null };
  if (path === '/upload' || path === '/start') return { view: 'upload', docSlug: null };
  if (path === '/review') return { view: 'review', docSlug: null };
  if (path === '/result') return { view: 'result', docSlug: null };
  if (path === '/help') return { view: 'doc', docSlug: null };
  if (path.startsWith('/help/')) return { view: 'doc', docSlug: path.slice('/help/'.length) };
  if (path === '/how-it-works') return { view: 'technical', docSlug: null };
  if (path.startsWith('/how-it-works/')) return { view: 'technical', docSlug: path.slice('/how-it-works/'.length) };
  if (path === '/about') return { view: 'about', docSlug: null };
  return { view: 'home', docSlug: null };
}

export function App() {
  const initial = parsePath();
  const [view, setView] = useState<View>(initial.view);
  const [docSlug, setDocSlug] = useState<string | null>(initial.docSlug);

  const [capabilityState, setCapabilityState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [samples, setSamples] = useState<SampleEntry[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [busyCaseId, setBusyCaseId] = useState<string | null>(null);
  const [busyUpload, setBusyUpload] = useState<boolean>(false);
  const [customPreviewUrls, setCustomPreviewUrls] = useState<Array<{ role: 'offer' | 'contract'; url: string }>>([]);
  const [issued, setIssued] = useState<IssuedExtraction | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'complete' | 'partial' | null>(null);
  const [extractionNotices, setExtractionNotices] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<CorrectionDelta[]>([]);
  const [correctionNotice, setCorrectionNotice] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [activeSample, setActiveSample] = useState<SampleEntry | null>(null);
  const [navConfirm, setNavConfirm] = useState<{ destination: View; docSlug: string | null } | null>(null);

  /** Journey generation (R30): stale async continuations are dropped. */
  const journeyRef = useRef(1);
  const extractionAbortRef = useRef<AbortController | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);

  const navigate = useCallback((next: View, nextDocSlug: string | null = null) => {
    let path = `/${next}`;
    if (next === 'home') path = '/';
    else if (next === 'doc') path = `/help${nextDocSlug ? `/${nextDocSlug}` : ''}`;
    else if (next === 'technical') path = `/how-it-works${nextDocSlug ? `/${nextDocSlug}` : ''}`;
    else if (next === 'about') path = '/about';
    window.history.pushState({}, '', path);
    setView(next);
    setDocSlug(nextDocSlug);
  }, []);

  useEffect(() => {
    const onPop = () => {
      const parsed = parsePath();
      setView(parsed.view);
      setDocSlug(parsed.docSlug);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  const inReviewFlow = view === 'extracting' || view === 'review' || view === 'analyzing' || view === 'result';
  const hasActiveWork = issued !== null || report !== null;

  // Warn before leaving the page with active work (P4 §6.5).
  useEffect(() => {
    if (!hasActiveWork) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasActiveWork]);

  const abortAll = useCallback(() => {
    extractionAbortRef.current?.abort();
    analysisAbortRef.current?.abort();
    extractionAbortRef.current = null;
    analysisAbortRef.current = null;
  }, []);

  const resetCase = useCallback(
    (destination: View = 'home', destinationDoc: string | null = null) => {
      journeyRef.current += 1;
      abortAll();
      customPreviewUrls.forEach((p) => URL.revokeObjectURL(p.url));
      setCustomPreviewUrls([]);
      setIssued(null);
      setProof(null);
      setExtractionStatus(null);
      setExtractionNotices([]);
      setCorrections([]);
      setCorrectionNotice(null);
      setReport(null);
      setExtractionError(null);
      setAnalysisError(null);
      setAnalysisBusy(false);
      setRetryAfterSeconds(null);
      setActiveSample(null);
      setNavConfirm(null);
      navigate(destination, destinationDoc);
    },
    [abortAll, customPreviewUrls, navigate],
  );

  /** Header navigation: guard anything that would end an active review (issue 3). */
  const guardedNavigate = useCallback(
    (destination: View, destinationDoc: string | null = null) => {
      if (inReviewFlow && hasActiveWork) {
        setNavConfirm({ destination, docSlug: destinationDoc });
        return;
      }
      if (inReviewFlow) {
        // Pending screens without issued work: abort quietly (R30).
        journeyRef.current += 1;
        abortAll();
      }
      navigate(destination, destinationDoc);
    },
    [abortAll, hasActiveWork, inReviewFlow, navigate],
  );

  const retryCountdown = useCallback((seconds: number | null) => {
    setRetryAfterSeconds(seconds);
    if (seconds === null) return;
    const timer = window.setInterval(() => {
      setRetryAfterSeconds((current) => {
        if (current === null) return null;
        return current <= 1 ? null : current - 1;
      });
    }, 1000);
    window.setTimeout(() => window.clearInterval(timer), (seconds + 1) * 1000);
  }, []);

  const runAnalysis = useCallback(
    (reviewIssued: IssuedExtraction, reviewProof: Proof, reviewCorrections: CorrectionDelta[]) => {
      const gen = journeyRef.current;
      setAnalysisError(null);
      setCorrectionNotice(null);
      setAnalysisBusy(true);
      navigate('analyzing');
      const controller = new AbortController();
      analysisAbortRef.current = controller;
      void analyze(reviewIssued, reviewProof, reviewCorrections, controller.signal)
        .then((response) => {
          if (gen !== journeyRef.current) return; // stale (R30/issue 31)
          setReport(response);
          navigate('result');
        })
        .catch((error: unknown) => {
          if (gen !== journeyRef.current) return;
          if (controller.signal.aborted) return; // deliberate cancel (R30)
          if (error instanceof ApiError && error.status === 422 && error.code === 'INVALID_CORRECTION') {
            // The review itself is fine — return to fix the correction (issue 5).
            setCorrectionNotice(
              'A correction could not be used in the analysis. Fix or remove the correction, then continue — nothing else was lost.',
            );
            navigate('review');
            return;
          }
          if (error instanceof ApiError && (error.status === 410 || error.status === 409)) {
            setAnalysisError('This review can no longer be continued. Start again to get a fresh extraction.');
            return;
          }
          setAnalysisError(error instanceof ApiError ? error.message : 'The analysis request failed.');
          retryCountdown(error instanceof ApiError ? error.retryAfterSeconds : null);
        })
        .finally(() => {
          if (gen === journeyRef.current) setAnalysisBusy(false);
        });
    },
    [navigate, retryCountdown],
  );

  const continueToAnalysis = useCallback(() => {
    if (!issued || !proof) return;
    if (Date.parse(issued.expiresAt) <= Date.now()) {
      setAnalysisError('This review has expired. Start again to get a fresh extraction.');
      return;
    }
    if (analysisBusy) return; // no duplicate submissions (R30)
    runAnalysis(issued, proof, corrections);
  }, [analysisBusy, corrections, issued, proof, runAnalysis]);

  /** Retry: the SAME review — same issued, proof, corrections snapshot (R30). */
  const retryAnalysis = useCallback(() => {
    if (!issued || !proof || analysisBusy) return;
    if (Date.parse(issued.expiresAt) <= Date.now()) {
      setAnalysisError('This review has expired. Start again to get a fresh extraction.');
      return;
    }
    runAnalysis(issued, proof, corrections);
  }, [analysisBusy, corrections, issued, proof, runAnalysis]);

  const handleCustomUpload = useCallback(
    (files: { offer?: File | null; contract?: File | null }) => {
      const gen = journeyRef.current;
      setBusyUpload(true);
      setExtractionError(null);
      setActiveSample(null);

      const urls: Array<{ role: 'offer' | 'contract'; url: string }> = [];
      if (files.offer) urls.push({ role: 'offer', url: URL.createObjectURL(files.offer) });
      if (files.contract) urls.push({ role: 'contract', url: URL.createObjectURL(files.contract) });
      setCustomPreviewUrls(urls);

      navigate('extracting');
      const controller = new AbortController();
      extractionAbortRef.current = controller;
      void extractCustom(files, undefined, controller.signal)
        .then((response: ExtractionResponse) => {
          if (gen !== journeyRef.current) return;
          setIssued(response.issuedExtraction);
          setProof(response.proof);
          setExtractionStatus(response.status);
          setExtractionNotices(response.notices);
          setCorrections([]);
          navigate('review');
        })
        .catch((error: unknown) => {
          if (gen !== journeyRef.current) return;
          if (controller.signal.aborted) return;
          const message =
            error instanceof ApiError && error.status === 422
              ? 'No usable text could be read from your document(s). Please ensure your PDF is not an image-only scan or encrypted.'
              : error instanceof ApiError
                ? error.message
                : 'The document upload and extraction failed.';
          setExtractionError(message);
        })
        .finally(() => {
          setBusyUpload(false);
        });
    },
    [navigate],
  );

  const startSample = useCallback(
    (sampleCaseId: string) => {
      const gen = journeyRef.current;
      customPreviewUrls.forEach((p) => URL.revokeObjectURL(p.url));
      setCustomPreviewUrls([]);
      const sample = samples.find((entry) => entry.sampleCaseId === sampleCaseId) ?? null;
      setActiveSample(sample);
      setBusyCaseId(sampleCaseId);
      setExtractionError(null);
      navigate('extracting');
      const controller = new AbortController();
      extractionAbortRef.current = controller;
      void extractSample(sampleCaseId, controller.signal)
        .then((response: ExtractionResponse) => {
          if (gen !== journeyRef.current) return;
          setIssued(response.issuedExtraction);
          setProof(response.proof);
          setExtractionStatus(response.status);
          setExtractionNotices(response.notices);
          setCorrections([]);
          navigate('review');
        })
        .catch((error: unknown) => {
          if (gen !== journeyRef.current) return;
          if (controller.signal.aborted) return;
          const message =
            error instanceof ApiError && error.status === 422
              ? 'No usable text could be read from this sample. Try another one.'
              : error instanceof ApiError
                ? error.message
                : 'The extraction request failed.';
          setExtractionError(message);
        })
        .finally(() => {
          // Busy flags are UI truth, not journey data — always clear them,
          // even for a stale journey (a stuck flag would disable samples).
          setBusyCaseId(null);
        });
    },
    [customPreviewUrls, navigate, samples],
  );

  const previewUrls =
    customPreviewUrls.length > 0
      ? customPreviewUrls
      : (activeSample?.documents ?? []).map((document) => ({
          role: document.role,
          url: document.previewUrl,
        }));

  const navLink = (label: string, destination: View, destinationDoc: string | null = null) => (
    <button
      type="button"
      className={`nav-link ${view === destination && docSlug === destinationDoc ? 'nav-link--active' : ''}`}
      onClick={() => {
        if (destination === 'home') {
          if (inReviewFlow) {
            if (hasActiveWork) setNavConfirm({ destination, docSlug: null });
            else {
              journeyRef.current += 1;
              abortAll();
              navigate('home');
            }
          } else navigate('home');
        } else {
          guardedNavigate(destination, destinationDoc);
        }
      }}
    >
      {label}
    </button>
  );

  const article = docSlug !== null ? ARTICLES[docSlug] : undefined;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand-group">
            <button
              type="button"
              className="wordmark"
              onClick={() => {
                if (inReviewFlow) {
                  if (hasActiveWork) setNavConfirm({ destination: 'home', docSlug: null });
                  else {
                    journeyRef.current += 1;
                    abortAll();
                    navigate('home');
                  }
                } else navigate('home');
              }}
            >
              <Icon name="doc" size={20} />
              <span>WazehTerms</span>
            </button>
            <span className="brand-badge">Demo</span>
          </div>

          <nav className="app-nav" aria-label="Main Navigation">
            {navLink('Home', 'home')}
            {capabilities?.customUploadEnabled !== false ? navLink('Demo upload', 'upload') : null}
            {navLink('Fictional Samples', 'examples')}
            {inReviewFlow ? (
              <button
                type="button"
                className="nav-link"
                onClick={() => window.open('/help', '_blank', 'noopener')}
                title="Opens in a new tab — your review stays open here"
              >
                Help <span aria-hidden="true">↗</span>
              </button>
            ) : (
              navLink('Help', 'doc')
            )}
          </nav>
        </div>
      </header>

      {inReviewFlow ? (
        <aside className="workflow-bar" aria-label="Review progress">
          <div className="workflow-bar__inner">
            <ol className="workflow-steps">
              {JOURNEY_STEPS.map((step, index) => {
                let currentStep = -1;
                let doneThrough = -1;
                if (view === 'extracting') {
                  currentStep = 1;
                  doneThrough = 0;
                } else if (view === 'review') {
                  currentStep = 2;
                  doneThrough = 1;
                } else if (view === 'analyzing') {
                  doneThrough = 2;
                } else if (view === 'result') {
                  currentStep = 3;
                  doneThrough = 2;
                }
                const current = index === currentStep;
                const done = index <= doneThrough;
                return (
                  <li
                    key={step}
                    className={`workflow-step ${current ? 'workflow-step--active' : done ? 'workflow-step--done' : ''}`}
                  >
                    <span aria-current={current ? 'step' : undefined}>
                      {index + 1}. {step}
                    </span>
                    {index < JOURNEY_STEPS.length - 1 ? (
                      <span className="workflow-sep" aria-hidden="true">
                        →
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {activeSample ? <span className="chip chip--scenario">{activeSample.title}</span> : null}
          </div>
        </aside>
      ) : null}

      <main id="main">
        {view === 'home' ? (
          <Home
            capabilityState={capabilityState}
            sampleModeEnabled={capabilities?.sampleModeEnabled ?? null}
            customUploadEnabled={capabilities?.customUploadEnabled ?? null}
            onTrySample={() => navigate('examples')}
            onUploadClick={() => navigate('upload')}
            onRetryCapabilities={loadCapabilities}
            onOpenHelp={(slug) => navigate('doc', slug)}
            onOpenTechnical={() => navigate('technical')}
          />
        ) : null}

        {view === 'upload' || view === 'start' ? (
          <Upload
            onUpload={handleCustomUpload}
            onTrySample={() => navigate('examples')}
            busy={busyUpload}
            maxBytesPerFile={capabilities?.maxBytesPerFile}
            maxTotalBytes={capabilities?.maxTotalBytes}
            maxPagesPerPdf={capabilities?.maxPagesPerPdf}
            customUploadEnabled={capabilities?.customUploadEnabled}
            privacyNoticeVersion={capabilities?.privacyNoticeVersion}
            onOpenHelp={(slug) => navigate('doc', slug)}
          />
        ) : null}

        {view === 'examples' ? (
          <Samples
            samples={samples}
            onStart={startSample}
            busyCaseId={busyCaseId}
            onOpenHelp={(slug) => navigate('doc', slug)}
          />
        ) : null}

        {view === 'doc' ? (
          docSlug === 'glossary' ? (
            <GlossaryPage onBackToHelp={() => navigate('doc')} />
          ) : article ? (
            <ArticlePage
              article={article}
              onBackToHelp={() => navigate('doc')}
              onNavigateSlug={(slug) => navigate('doc', slug)}
              onStartReview={() => navigate('examples')}
            />
          ) : !docSlug ? (
            <HelpHub
              onOpenArticle={(slug) => navigate('doc', slug)}
              onOpenGlossary={() => navigate('doc', 'glossary')}
              onTrySample={() => navigate('examples')}
            />
          ) : (
            <div className="view">
              <div className="view__inner">
                <Notice kind="incomplete" role="status" title="Guide topic not found">
                  <p>The requested help guide could not be found.</p>
                  <button type="button" className="button button--secondary" onClick={() => navigate('doc')}>
                    ← Back to Help Hub
                  </button>
                </Notice>
              </div>
            </div>
          )
        ) : null}

        {view === 'technical' ? (
          docSlug && TECHNICAL_ARTICLES[docSlug] ? (
            <TechnicalArticlePage
              article={TECHNICAL_ARTICLES[docSlug]}
              onBackToHub={() => navigate('technical')}
              onNavigateSlug={(slug) => navigate('technical', slug)}
            />
          ) : !docSlug ? (
            <TechnicalHub
              onOpenArticle={(slug) => navigate('technical', slug)}
              onOpenAbout={() => navigate('about')}
              onOpenHelp={() => navigate('doc')}
            />
          ) : (
            <div className="view">
              <div className="view__inner">
                <Notice kind="incomplete" role="status" title="Technical article not found">
                  <p>The requested technical article could not be found.</p>
                  <button type="button" className="button button--secondary" onClick={() => navigate('technical')}>
                    ← Back to How WazehTerms works
                  </button>
                </Notice>
              </div>
            </div>
          )
        ) : null}

        {view === 'about' ? (
          <AboutPage
            onOpenTechnicalHub={() => navigate('technical')}
            onOpenHelp={() => navigate('doc')}
            onTrySample={() => navigate('examples')}
          />
        ) : null}

        {view === 'extracting' ? (
          <div className="view">
            <div className="view__inner pending-panel">
              <div className="spinner" aria-hidden="true" />
              <h1 tabIndex={-1}>Reading the documents</h1>
              <p role="status">{activeSample ? activeSample.title : 'Your document(s)'} being read…</p>
              <p>{unit('pending.extract.next').body[0]}</p>
              {extractionError ? (
                <ErrorPanel message={extractionError}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        journeyRef.current += 1;
                        abortAll();
                        resetCase(customPreviewUrls.length > 0 ? 'upload' : 'examples');
                      }}
                    >
                      {customPreviewUrls.length > 0 ? 'Try uploading again' : 'Choose another sample'}
                    </button>
                    <button
                      type="button"
                      className="guide-link"
                      onClick={() => navigate('doc', 'troubleshooting')}
                    >
                      Read troubleshooting guide →
                    </button>
                  </div>
                </ErrorPanel>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === 'review' && issued ? (
          <>
            {correctionNotice ? (
              <div className="view" style={{ paddingBottom: 0 }}>
                <div className="view__inner view__inner--wide">
                  <div className="notice notice--incomplete" role="status">
                    <span className="notice__title">One correction needs attention</span>
                    <p>{correctionNotice}</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                      <button
                        type="button"
                        className="guide-link"
                        onClick={() => navigate('doc', 'troubleshooting')}
                      >
                        Correction troubleshooting →
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {extractionStatus === 'partial' ? (
              <div className="view" style={{ paddingBottom: 0 }}>
                <div className="view__inner view__inner--wide">
                  <div className="notice notice--incomplete" role="status">
                    <span className="notice__title">Partial extraction</span>
                    {extractionNotices.map((notice) => (
                      <p key={notice}>{notice}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
            <Review
              issued={issued}
              previewUrls={previewUrls}
              corrections={corrections}
              onCorrect={(delta) =>
                setCorrections((existing) => [
                  ...existing.filter((entry) => !(entry.documentId === delta.documentId && entry.instanceId === delta.instanceId)),
                  delta,
                ])
              }
              onUndoCorrection={(key) =>
                setCorrections((existing) =>
                  existing.filter((entry) => `${entry.documentId}:${entry.fieldKey}:${entry.instanceId}` !== key),
                )
              }
              onContinue={continueToAnalysis}
              onReset={() => resetCase('home')}
            />
          </>
        ) : null}

        {view === 'review' && !issued ? (
          <div className="view">
            <div className="view__inner">
              <h1 tabIndex={-1}>Nothing to review yet</h1>
              <div className="notice notice--incomplete" role="status">
                <p>{RELOAD_COPY}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                  <button
                    type="button"
                    className="guide-link"
                    onClick={() => navigate('doc', 'troubleshooting')}
                  >
                    Why in-progress reviews cannot be restored →
                  </button>
                </p>
              </div>
              <button
                type="button"
                className="button"
                onClick={() => (capabilities?.customUploadEnabled ? navigate('upload') : navigate('examples'))}
              >
                {capabilities?.customUploadEnabled ? 'Upload documents' : 'Choose a sample'}
              </button>
            </div>
          </div>
        ) : null}

        {view === 'analyzing' ? (
          <div className="view">
            <div className="view__inner pending-panel">
              <div className="spinner" aria-hidden="true" />
              <h1 tabIndex={-1}>Comparing written terms and checking sources</h1>
              <p role="status">
                {analysisBusy
                  ? 'Analyzing explicit terms deterministically and querying official labor rules…'
                  : 'The analysis request is not running.'}
              </p>
              <p>{unit('pending.analyze.next').body[0]}</p>
              {analysisError ? (
                <ErrorPanel message={analysisError}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {issued && proof && analysisError.startsWith('This review has expired') === false ? (
                      <button
                        type="button"
                        className="button"
                        disabled={analysisBusy || (retryAfterSeconds !== null && retryAfterSeconds > 0)}
                        onClick={retryAnalysis}
                      >
                        {retryAfterSeconds !== null && retryAfterSeconds > 0
                          ? `Try again available in ${retryAfterSeconds}s`
                          : 'Try again'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => {
                        journeyRef.current += 1;
                        abortAll();
                        resetCase(customPreviewUrls.length > 0 ? 'upload' : 'examples');
                      }}
                    >
                      Start a fresh review
                    </button>
                  </div>
                  <p style={{ marginTop: '0.6rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="guide-link"
                      onClick={() => navigate('doc', 'troubleshooting')}
                    >
                      Read troubleshooting guide →
                    </button>
                  </p>
                  <p className="evidence__label" style={{ marginTop: '0.75rem' }}>
                    Trying again resends this same review. Cancelling here stops the request in your browser; processing
                    on the provider's side may still complete.
                  </p>
                </ErrorPanel>
              ) : null}
            </div>
          </div>
        ) : null}

        {view === 'result' && report ? (
          <Findings
            report={report}
            issued={issued}
            onOpenHelp={(slug, section) => {
              const url = section ? `/help/${slug}#${section}` : `/help/${slug}`;
              window.open(url, '_blank', 'noopener');
            }}
            onReviewAnother={() => {
              journeyRef.current += 1;
              abortAll();
              resetCase(capabilities?.customUploadEnabled ? 'upload' : 'examples');
            }}
            onReset={() => resetCase('home')}
          />
        ) : null}

        {view === 'result' && !report ? (
          <div className="view">
            <div className="view__inner">
              <h1 tabIndex={-1}>No report to show</h1>
              <div className="notice notice--incomplete" role="status">
                <p>{RELOAD_COPY}</p>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                  <button
                    type="button"
                    className="guide-link"
                    onClick={() => navigate('doc', 'troubleshooting')}
                  >
                    Why in-progress reviews cannot be restored →
                  </button>
                </p>
              </div>
              <button type="button" className="button" onClick={() => navigate('examples')}>
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
              <strong>WazehTerms</strong> reviews written employment terms before signing. It does not verify employers,
              visas, or documents, and it is not legal advice — official help may still be needed. Findings cite
              approved official sources where they apply.
            </p>
          </div>
          <div className="footer-links">
            <button
              type="button"
              className="link-button"
              onClick={() => (inReviewFlow ? window.open('/help', '_blank', 'noopener') : navigate('doc'))}
            >
              Help hub
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => (inReviewFlow ? window.open('/help/glossary', '_blank', 'noopener') : navigate('doc', 'glossary'))}
            >
              Glossary
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => (inReviewFlow ? window.open('/how-it-works', '_blank', 'noopener') : navigate('technical'))}
            >
              How it works
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => (inReviewFlow ? window.open('/about', '_blank', 'noopener') : navigate('about'))}
            >
              About
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => (inReviewFlow ? window.open('/help/scope-and-privacy', '_blank', 'noopener') : navigate('doc', 'scope-and-privacy'))}
            >
              Privacy and scope
            </button>
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
              Gemini API terms (opens elsewhere)
            </a>
          </div>
        </div>
      </footer>

      {navConfirm ? (
        <ConfirmDialog
          title={unit('dialog.leave').title}
          body={unit('dialog.leave').body[0] ?? ''}
          safeIndex={0}
          actions={[
            {
              label: 'Stay',
              kind: 'primary',
              onChoose: () => setNavConfirm(null),
            },
            {
              label: 'Leave',
              kind: 'danger',
              onChoose: () => {
                const destination = navConfirm.destination;
                const destinationDoc = navConfirm.docSlug;
                setNavConfirm(null);
                resetCase(destination === 'home' ? 'home' : destination, destinationDoc);
              },
            },
          ]}
        />
      ) : null}
    </>
  );
}
