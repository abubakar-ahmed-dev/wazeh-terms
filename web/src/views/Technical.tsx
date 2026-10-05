/**
 * Technical surfaces (P4 §8.2, P9): Technical Hub (/how-it-works),
 * Technical Article Reader (/how-it-works/:slug), and About page (/about).
 * Provides deep architectural transparency, benchmark figures, and
 * system responsibility documentation for engineers, recruiters, and evaluators.
 */
import { useEffect, useRef, useState } from 'react';

import { TECHNICAL_ARTICLES, TECHNICAL_ORDER } from '../content/technical';
import type { Article } from '../content/articles';
import { ArticleBody, Icon } from '../ui';

interface TechnicalHubProps {
  onOpenArticle: (slug: string) => void;
  onOpenAbout: () => void;
  onOpenHelp: () => void;
}

const TECHNICAL_SUMMARIES: Readonly<Record<string, string>> = {
  'system-overview': 'Pipeline walk-through, two-step signed contract integrity, and explicit system responsibility boundaries.',
  'employment-knowledge-content': 'Structured Sanity content modeling vs raw prose, document types, and published reference inventory.',
  'retrieval': 'Knowledge Base Context MCP integration, candidate matching, and fail-closed startup verification.',
  'from-candidates-to-concerns': 'The six-stage statutory eligibility gate, eligible vs withheld concerns, and document finding survival.',
  'content-review': 'The audited editorial lifecycle, provenance recording, human legal review, and statutory supersession.',
  'privacy-and-limits': 'Memory-only client and server processing, zero accounts, zero document databases, and rate limits.',
  'evaluation': '15-case synthetic benchmark results (100% precision & recall, p50 18.6s e2e) and tested boundaries.',
};

export function TechnicalHub({ onOpenArticle, onOpenAbout, onOpenHelp }: TechnicalHubProps) {
  return (
    <div className="view">
      <div className="view__inner view__inner--wide technical-hub">
        <header className="help-hub__header">
          <span className="eyebrow">Architecture & engineering</span>
          <h1 tabIndex={-1}>How WazehTerms works inside</h1>
          <p className="help-hub__lead">
            An engineering deep dive into our deterministic comparison engine, versioned statutory knowledge models,
            Sanity Knowledge Base retrieval, and privacy-preserving review pipeline.
          </p>
        </header>

        {/* Hero Card: Architecture Overview */}
        <section className="help-hub__hero" aria-labelledby="tech-hero-heading">
          <div className="help-hub__hero-content">
            <span className="chip chip--scenario">System architecture</span>
            <h2 id="tech-hero-heading">Deterministic review without model verdicts</h2>
            <p>
              WazehTerms uses language models for what they do well — reading text and table cells from bounded PDF pages —
              while keeping mathematical comparison, date math, and legal eligibility checking inside audited application code.
            </p>
            <div className="help-hub__hero-actions">
              <button
                type="button"
                className="button"
                onClick={() => onOpenArticle('system-overview')}
              >
                Start with System overview <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={onOpenAbout}
              >
                About the project
              </button>
            </div>
          </div>
        </section>

        {/* Suggested Sequential Reading Order */}
        <section className="tech-reading-order" aria-labelledby="reading-order-heading">
          <div className="help-group__header">
            <span className="help-group__eyebrow">Technical documentation</span>
            <h2 id="reading-order-heading" className="help-group__title">
              Suggested reading order (T1–T7)
            </h2>
          </div>

          <ol className="tech-article-list">
            {TECHNICAL_ORDER.map((slug, index) => {
              const article = TECHNICAL_ARTICLES[slug];
              if (!article) return null;
              return (
                <li key={slug} className="tech-article-item card">
                  <div className="tech-article-item__num" aria-hidden="true">
                    T{index + 1}
                  </div>
                  <div className="tech-article-item__body">
                    <h3 className="tech-article-item__title">
                      <button
                        type="button"
                        className="tech-article-item__link"
                        onClick={() => onOpenArticle(slug)}
                      >
                        {article.title} <span aria-hidden="true">→</span>
                      </button>
                    </h3>
                    <p className="tech-article-item__desc">
                      {TECHNICAL_SUMMARIES[slug] || article.intro[0]}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Discovery Links */}
        <section className="help-hub__reference" aria-labelledby="discovery-heading">
          <h2 id="discovery-heading" className="help-group__eyebrow">Additional resources</h2>
          <div className="help-reference-grid">
            <div className="help-card">
              <button
                type="button"
                className="help-card__button"
                onClick={onOpenAbout}
              >
                <span className="help-card__title">
                  About WazehTerms <span aria-hidden="true">→</span>
                </span>
                <span className="help-card__desc">
                  Project mission, corridor focus, team commitments, and open source documentation.
                </span>
              </button>
            </div>

            <div className="help-card">
              <button
                type="button"
                className="help-card__button"
                onClick={onOpenHelp}
              >
                <span className="help-card__title">
                  User guidance & Help hub <span aria-hidden="true">→</span>
                </span>
                <span className="help-card__desc">
                  Practical step-by-step guides for workers checking offers, verifying terms, and reading findings.
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface TechnicalArticlePageProps {
  article: Article;
  onBackToHub: () => void;
  onNavigateSlug: (slug: string) => void;
}

export function TechnicalArticlePage({
  article,
  onBackToHub,
  onNavigateSlug,
}: TechnicalArticlePageProps) {
  const [activeSection, setActiveSection] = useState<string | null>(() => {
    return typeof window !== 'undefined' && window.location.hash ? window.location.hash.slice(1) : null;
  });

  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setActiveSection(hash);
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus?.();
        return;
      }
    }
    headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [article.slug]);

  const handleTocClick = (sectionId: string) => {
    setActiveSection(sectionId);
    window.history.replaceState({}, '', `/how-it-works/${article.slug}#${sectionId}`);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentIndex = TECHNICAL_ORDER.indexOf(article.slug);
  const prevSlug = currentIndex > 0 ? TECHNICAL_ORDER[currentIndex - 1] : null;
  const nextSlug = currentIndex < TECHNICAL_ORDER.length - 1 ? TECHNICAL_ORDER[currentIndex + 1] : null;

  return (
    <div className="view">
      <div className="view__inner view__inner--wide">
        <nav aria-label="Breadcrumbs" style={{ marginBottom: '1rem' }}>
          <button type="button" className="link-button" onClick={onBackToHub}>
            ← How WazehTerms works
          </button>
        </nav>

        <header className="article-header">
          <span className="eyebrow">Technical article T{currentIndex + 1}</span>
          <h1 ref={headingRef} tabIndex={-1}>
            {article.title}
          </h1>
        </header>

        <div className="article-layout">
          {/* Table of Contents */}
          <aside className="article-layout__sidebar">
            <details className="article-toc-mobile" open>
              <summary className="article-toc-summary">
                <span>On this page ({article.sections.length} sections)</span>
              </summary>
              <nav aria-label="Table of contents" className="article-toc-nav">
                <ol className="article-toc-list">
                  {article.sections.map((section) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        className={`article-toc-link ${activeSection === section.id ? 'article-toc-link--active' : ''}`}
                        onClick={() => handleTocClick(section.id)}
                      >
                        {section.heading}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          </aside>

          {/* Article Main Body */}
          <main className="article-layout__main">
            <ArticleBody article={article} />

            {/* Sequential Navigation Footer */}
            <footer className="article-footer">
              <div className="article-footer__actions">
                {prevSlug ? (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => onNavigateSlug(prevSlug)}
                  >
                    ← Previous: {TECHNICAL_ARTICLES[prevSlug]?.title}
                  </button>
                ) : null}
                {nextSlug ? (
                  <button
                    type="button"
                    className="button"
                    onClick={() => onNavigateSlug(nextSlug)}
                  >
                    Next: {TECHNICAL_ARTICLES[nextSlug]?.title} →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button"
                    onClick={onBackToHub}
                  >
                    Back to Technical Hub
                  </button>
                )}
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

interface AboutPageProps {
  onOpenTechnicalHub: () => void;
  onOpenHelp: () => void;
  onTrySample: () => void;
}

export function AboutPage({ onOpenTechnicalHub, onOpenHelp, onTrySample }: AboutPageProps) {
  return (
    <div className="view">
      <div className="view__inner view__inner--wide about-view">
        <header className="help-hub__header">
          <span className="eyebrow">About the project</span>
          <h1 tabIndex={-1}>WazehTerms</h1>
          <p className="help-hub__lead">
            An independent, evidence-backed employment document review assistant for people in Pakistan considering
            UAE mainland private-sector work.
          </p>
        </header>

        {/* Mission Statement */}
        <section className="card" style={{ marginBottom: '2rem' }}>
          <h2>Why WazehTerms exists</h2>
          <p>
            Every year, hundreds of thousands of workers migrate from Pakistan to the UAE. Many receive an initial offer
            letter that differs significantly from the formal mainland employment contract presented at signing or visa
            processing. Key terms — basic salaries, recruitment charges, allowance breakdowns, and notice clauses — are
            frequently altered, obscured, or omitted.
          </p>
          <p>
            WazehTerms provides workers and their families with clarity. It extracts concrete terms from PDF offers and
            contracts, compares them side by side with verbatim page citations, and checks them against official UAE and
            Pakistan labor statutes — without requiring an account, storing documents, or passing legal judgments.
          </p>
        </section>

        {/* Core Architectural Commitments */}
        <section className="about-commitments" style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem' }}>Architectural commitments</h2>
          <div className="about-grid">
            <div className="card about-box">
              <div className="about-box__head">
                <Icon name="check" size={20} />
                <h3>Deterministic comparisons</h3>
              </div>
              <p>
                All salary comparisons, currency conversions, and date calculations are executed in audited TypeScript code.
                Language models never decide whether numerical terms differ.
              </p>
            </div>

            <div className="card about-box">
              <div className="about-box__head">
                <Icon name="doc" size={20} />
                <h3>Curated Sanity Knowledge Base</h3>
              </div>
              <p>
                Rule claims cite exact statutory pinpoints in UAE Federal Decree-Law No. 33 and Pakistan Emigration Rules 1979,
                maintained under peer-reviewed editorial schemas in Sanity.
              </p>
            </div>

            <div className="card about-box">
              <div className="about-box__head">
                <Icon name="info" size={20} />
                <h3>Zero-retention privacy</h3>
              </div>
              <p>
                Your reviews exist only in transient browser memory. We maintain zero user accounts, zero database storage for
                worker documents, and zero tracking cookies.
              </p>
            </div>

            <div className="card about-box">
              <div className="about-box__head">
                <Icon name="alert" size={20} />
                <h3>No overall verdicts</h3>
              </div>
              <p>
                WazehTerms never issues a "safe to sign", "compliant", or "authentic" verdict. We present evidence and
                suggested questions so the assessment remains entirely yours.
              </p>
            </div>
          </div>
        </section>

        {/* Discovery & Actions */}
        <section className="about-actions-card card">
          <h2>Explore the system</h2>
          <p style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
            Inspect our engineering documentation, read practical user guides, or test the pipeline using fictional document pairs.
          </p>
          <div className="help-hub__hero-actions">
            <button type="button" className="button" onClick={onOpenTechnicalHub}>
              How WazehTerms works inside (Engineering) →
            </button>
            <button type="button" className="button button--secondary" onClick={onTrySample}>
              Try a fictional sample
            </button>
            <button type="button" className="button button--secondary" onClick={onOpenHelp}>
              Help & user guides
            </button>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
            Source repository:{' '}
            <a
              href="https://github.com/abubakar-ahmed-dev/wazeh-terms"
              target="_blank"
              rel="noreferrer"
              className="guide-link"
            >
              github.com/abubakar-ahmed-dev/wazeh-terms ↗
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
