/**
 * Help surfaces (P4 §8): Help Hub, Article Page with Table of Contents,
 * and Glossary. Provides task-first orientation, full-depth guidance,
 * and predictable recovery anchors.
 */
import { useEffect, useState, useRef } from 'react';

import { ARTICLES, HELP_HUB_GROUPS, type Article } from '../content/articles';
import { GLOSSARY } from '../content/glossary';
import { ArticleBody } from '../ui';

interface HelpHubProps {
  onOpenArticle: (slug: string) => void;
  onOpenGlossary: () => void;
  onTrySample: () => void;
}

const ARTICLE_SUMMARIES: Readonly<Record<string, string>> = {
  'getting-started': 'How WazehTerms reads and compares terms, what the four steps do, and how to begin.',
  'trying-samples': 'Walk through a full review in minutes using ready-made fictional document pairs.',
  'uploading-documents': 'File requirements, document roles, privacy notices, and how to prepare fictional PDFs.',
  'checking-terms': 'Verify extracted values against the original pages across all 12 groups before analysis.',
  'reading-findings': 'Interpret differences, questions, coverage, and source-backed concerns without verdicts.',
  'evidence-and-sources': 'How page quotes, model transcriptions, corrections, and official rules are distinguished.',
  'troubleshooting': 'Recover from unreadable files, rate limits, expired reviews, or unexpected errors.',
  'scope-and-privacy': 'What WazehTerms can and cannot do, supported routes, and what happens to your data.',
};

export function HelpHub({ onOpenArticle, onOpenGlossary, onTrySample }: HelpHubProps) {
  return (
    <div className="view">
      <div className="view__inner view__inner--wide help-hub">
        <header className="help-hub__header">
          <span className="eyebrow">Help & guidance</span>
          <h1 tabIndex={-1}>Help with WazehTerms</h1>
          <p className="help-hub__lead">
            Practical guides for the review journey — how to start, check extracted terms against original pages,
            read findings reports, and recover when something goes wrong.
          </p>
        </header>

        {/* Hero Card: Getting Started */}
        <section className="help-hub__hero" aria-labelledby="start-here-heading">
          <div className="help-hub__hero-content">
            <span className="chip chip--scenario">Start here</span>
            <h2 id="start-here-heading">Getting started with WazehTerms</h2>
            <p>
              WazehTerms reads written terms in Pakistan-to-UAE employment offers and contracts, extracts concrete values
              with page evidence, and helps you spot discrepancies and missing terms before you sign.
            </p>
            <div className="help-hub__hero-actions">
              <button
                type="button"
                className="button"
                onClick={() => onOpenArticle('getting-started')}
              >
                Read getting started guide <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={onTrySample}
              >
                Try a sample review
              </button>
            </div>
          </div>
        </section>

        {/* Task-based Groupings (P4 §8.1) */}
        <div className="help-hub__groups">
          {HELP_HUB_GROUPS.map((group) => (
            <section key={group.label} className="help-group" aria-labelledby={`group-${group.label}`}>
              <div className="help-group__header">
                <span className="help-group__eyebrow">{group.label}</span>
                <h2 id={`group-${group.label}`} className="help-group__title">
                  {group.label === 'Start' && 'Preparing & starting'}
                  {group.label === 'Check' && 'Verifying documents'}
                  {group.label === 'Understand' && 'Findings & evidence'}
                  {group.label === 'Recover' && 'Troubleshooting & errors'}
                  {group.label === 'Boundaries' && 'Scope & privacy'}
                </h2>
              </div>
              <ul className="help-group__list">
                {group.slugs.map((slug) => {
                  const article = ARTICLES[slug];
                  if (!article) return null;
                  return (
                    <li key={slug} className="help-card">
                      <button
                        type="button"
                        className="help-card__button"
                        onClick={() => onOpenArticle(slug)}
                      >
                        <span className="help-card__title">
                          {article.title} <span aria-hidden="true">→</span>
                        </span>
                        <span className="help-card__desc">
                          {ARTICLE_SUMMARIES[slug] || article.intro[0]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Reference and Technical Section */}
        <section className="help-hub__reference" aria-labelledby="reference-heading">
          <h2 id="reference-heading" className="help-group__eyebrow">Reference & technical</h2>
          <div className="help-reference-grid">
            <div className="help-card">
              <button
                type="button"
                className="help-card__button"
                onClick={onOpenGlossary}
              >
                <span className="help-card__title">
                  Glossary of terms <span aria-hidden="true">→</span>
                </span>
                <span className="help-card__desc">
                  30 plain-language definitions of terms used across WazehTerms — offers, contracts, evidence, and rules.
                </span>
              </button>
            </div>

            <div className="help-card">
              <button
                type="button"
                className="help-card__button"
                onClick={() => onOpenArticle('troubleshooting')}
              >
                <span className="help-card__title">
                  Troubleshooting & recovery <span aria-hidden="true">→</span>
                </span>
                <span className="help-card__desc">
                  Solutions for rejected PDFs, scan issues, rate limits, expired reviews, or unexpected errors.
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface ArticlePageProps {
  article: Article;
  onBackToHelp: () => void;
  onNavigateSlug: (slug: string) => void;
  onStartReview: () => void;
}

export function ArticlePage({
  article,
  onBackToHelp,
  onNavigateSlug,
  onStartReview,
}: ArticlePageProps) {
  const [activeSection, setActiveSection] = useState<string | null>(() => {
    return typeof window !== 'undefined' && window.location.hash ? window.location.hash.slice(1) : null;
  });

  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    // Scroll to anchor if specified in hash
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
    window.history.replaceState({}, '', `/help/${article.slug}#${sectionId}`);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="view">
      <div className="view__inner view__inner--wide">
        <nav aria-label="Breadcrumbs" style={{ marginBottom: '1rem' }}>
          <button type="button" className="link-button" onClick={onBackToHelp}>
            ← Help Hub
          </button>
        </nav>

        <header className="article-header">
          <span className="eyebrow">Practical guide</span>
          <h1 ref={headingRef} tabIndex={-1}>
            {article.title}
          </h1>
        </header>

        <div className="article-layout">
          {/* Table of Contents (sticky on desktop, disclosure on mobile) */}
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
            <ArticleBody article={article} focusSection={activeSection ?? undefined} />

            {/* Footer / Where to go next */}
            <footer className="article-footer">
              <div className="article-footer__actions">
                <button type="button" className="button button--secondary" onClick={onBackToHelp}>
                  ← All help topics
                </button>
                <button type="button" className="button" onClick={onStartReview}>
                  Try a review →
                </button>
              </div>

              <div className="article-footer__related">
                <h3>Related guides</h3>
                <div className="article-footer__links">
                  {article.slug !== 'getting-started' ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onNavigateSlug('getting-started')}
                    >
                      Getting started
                    </button>
                  ) : null}
                  {article.slug !== 'checking-terms' ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onNavigateSlug('checking-terms')}
                    >
                      Checking terms
                    </button>
                  ) : null}
                  {article.slug !== 'reading-findings' ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onNavigateSlug('reading-findings')}
                    >
                      Reading findings
                    </button>
                  ) : null}
                  {article.slug !== 'troubleshooting' ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onNavigateSlug('troubleshooting')}
                    >
                      Troubleshooting
                    </button>
                  ) : null}
                  {article.slug !== 'scope-and-privacy' ? (
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => onNavigateSlug('scope-and-privacy')}
                    >
                      Scope and privacy
                    </button>
                  ) : null}
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

interface GlossaryPageProps {
  onBackToHelp: () => void;
}

export function GlossaryPage({ onBackToHelp }: GlossaryPageProps) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.focus?.();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="view">
      <div className="view__inner view__inner--wide">
        <nav aria-label="Breadcrumbs" style={{ marginBottom: '1rem' }}>
          <button type="button" className="link-button" onClick={onBackToHelp}>
            ← Help Hub
          </button>
        </nav>

        <header className="article-header">
          <span className="eyebrow">Reference</span>
          <h1 tabIndex={-1}>Glossary of terms</h1>
          <p className="help-hub__lead">
            One meaning per term across WazehTerms. Factual definitions of document, extraction, and report concepts.
          </p>
        </header>

        <div className="glossary-container">
          <dl className="glossary-dl">
            {GLOSSARY.map((entry) => (
              <div key={entry.slug} id={entry.slug} className="glossary-item" tabIndex={-1}>
                <dt className="glossary-term">
                  <a href={`#${entry.slug}`} className="glossary-term-anchor">
                    {entry.term}
                  </a>
                </dt>
                <dd className="glossary-definition">{entry.definition}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer style={{ marginTop: '2.5rem' }}>
          <button type="button" className="button button--secondary" onClick={onBackToHelp}>
            ← All help topics
          </button>
        </footer>
      </div>
    </div>
  );
}
