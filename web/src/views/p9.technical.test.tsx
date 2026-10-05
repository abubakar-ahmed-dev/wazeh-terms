/**
 * @vitest-environment jsdom
 *
 * P9 Technical Documentation and Transparency Suite:
 * Validates Technical Hub (/how-it-works), Technical Article Reader (/how-it-works/:slug),
 * About page (/about), and Home discovery link.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TECHNICAL_ARTICLES, TECHNICAL_ORDER } from '../content/technical';
import { Home } from './Home';
import { AboutPage, TechnicalArticlePage, TechnicalHub } from './Technical';

afterEach(cleanup);

describe('P9 Technical Hub (/how-it-works)', () => {
  it('renders header, hero CTA, and all 7 technical articles in reading order', () => {
    const onOpenArticle = vi.fn();
    const onOpenAbout = vi.fn();
    const onOpenHelp = vi.fn();

    render(
      <TechnicalHub
        onOpenArticle={onOpenArticle}
        onOpenAbout={onOpenAbout}
        onOpenHelp={onOpenHelp}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: /How WazehTerms works inside/i })).toBeTruthy();
    expect(screen.getByText(/Suggested reading order \(T1–T7\)/i)).toBeTruthy();

    // Check that hero button navigates to T1 system-overview
    const heroBtn = screen.getByRole('button', { name: /Start with System overview/i });
    fireEvent.click(heroBtn);
    expect(onOpenArticle).toHaveBeenCalledWith('system-overview');

    // Check all 7 articles are listed
    for (const slug of TECHNICAL_ORDER) {
      const article = TECHNICAL_ARTICLES[slug]!;
      expect(screen.getByRole('button', { name: new RegExp(article.title, 'i') })).toBeTruthy();
    }

    // Click T4 article link
    const t4Article = TECHNICAL_ARTICLES['from-candidates-to-concerns']!;
    const t4Btn = screen.getByRole('button', { name: new RegExp(t4Article.title, 'i') });
    fireEvent.click(t4Btn);
    expect(onOpenArticle).toHaveBeenCalledWith('from-candidates-to-concerns');

    // Click About discovery card
    const aboutBtn = screen.getByRole('button', { name: /About WazehTerms/i });
    fireEvent.click(aboutBtn);
    expect(onOpenAbout).toHaveBeenCalledTimes(1);

    // Click Help discovery card
    const helpBtn = screen.getByRole('button', { name: /User guidance & Help hub/i });
    fireEvent.click(helpBtn);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });
});

describe('P9 Technical Article Page (/how-it-works/:slug)', () => {
  it('renders article header, TOC sections, and previous/next navigation for T1', () => {
    const t1 = TECHNICAL_ARTICLES['system-overview']!;
    const onBackToHub = vi.fn();
    const onNavigateSlug = vi.fn();

    // Mock scrollIntoView for jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(
      <TechnicalArticlePage
        article={t1}
        onBackToHub={onBackToHub}
        onNavigateSlug={onNavigateSlug}
      />,
    );

    // Eyebrow and title
    expect(screen.getByText('Technical article T1')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: t1.title })).toBeTruthy();

    // Breadcrumb
    const backBtn = screen.getByRole('button', { name: /← How WazehTerms works/i });
    fireEvent.click(backBtn);
    expect(onBackToHub).toHaveBeenCalledTimes(1);

    // Sections in TOC
    for (const sec of t1.sections) {
      expect(screen.getByRole('button', { name: sec.heading })).toBeTruthy();
    }

    // For T1, there is no previous, but Next should be T2
    expect(screen.queryByRole('button', { name: /← Previous/i })).toBeNull();
    const nextBtn = screen.getByRole('button', { name: /Next:/i });
    expect(nextBtn.textContent).toContain(TECHNICAL_ARTICLES['employment-knowledge-content']!.title);
    fireEvent.click(nextBtn);
    expect(onNavigateSlug).toHaveBeenCalledWith('employment-knowledge-content');
  });

  it('renders back to hub button on the last article (T7 evaluation)', () => {
    const t7 = TECHNICAL_ARTICLES['evaluation']!;
    const onBackToHub = vi.fn();
    const onNavigateSlug = vi.fn();

    render(
      <TechnicalArticlePage
        article={t7}
        onBackToHub={onBackToHub}
        onNavigateSlug={onNavigateSlug}
      />,
    );

    expect(screen.getByText('Technical article T7')).toBeTruthy();

    // Previous is T6
    const prevBtn = screen.getByRole('button', { name: /← Previous/i });
    expect(prevBtn.textContent).toContain(TECHNICAL_ARTICLES['privacy-and-limits']!.title);
    fireEvent.click(prevBtn);
    expect(onNavigateSlug).toHaveBeenCalledWith('privacy-and-limits');

    // No next button; instead Back to Technical Hub
    expect(screen.queryByRole('button', { name: /Next:/i })).toBeNull();
    const finishBtn = screen.getByRole('button', { name: /Back to Technical Hub/i });
    fireEvent.click(finishBtn);
    expect(onBackToHub).toHaveBeenCalledTimes(1);
  });
});

describe('P9 About Page (/about)', () => {
  it('renders project mission, architectural commitments, and discovery actions', () => {
    const onOpenTechnicalHub = vi.fn();
    const onOpenHelp = vi.fn();
    const onTrySample = vi.fn();

    render(
      <AboutPage
        onOpenTechnicalHub={onOpenTechnicalHub}
        onOpenHelp={onOpenHelp}
        onTrySample={onTrySample}
      />,
    );

    // Headings
    expect(screen.getByRole('heading', { level: 1, name: 'WazehTerms' })).toBeTruthy();
    expect(screen.getByText(/Why WazehTerms exists/i)).toBeTruthy();

    // 4 Architectural commitments
    expect(screen.getByRole('heading', { level: 3, name: /Deterministic comparisons/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /Curated Sanity Knowledge Base/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /Zero-retention privacy/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: /No overall verdicts/i })).toBeTruthy();

    // Actions
    const techBtn = screen.getByRole('button', { name: /How WazehTerms works inside \(Engineering\)/i });
    fireEvent.click(techBtn);
    expect(onOpenTechnicalHub).toHaveBeenCalledTimes(1);

    const sampleBtn = screen.getByRole('button', { name: /Try a fictional sample/i });
    fireEvent.click(sampleBtn);
    expect(onTrySample).toHaveBeenCalledTimes(1);

    const helpBtn = screen.getByRole('button', { name: /Help & user guides/i });
    fireEvent.click(helpBtn);
    expect(onOpenHelp).toHaveBeenCalledTimes(1);

    // GitHub link
    const ghLink = screen.getByRole('link', { name: /github\.com\/abubakar-ahmed-dev\/wazeh-terms/i });
    expect(ghLink.getAttribute('href')).toBe('https://github.com/abubakar-ahmed-dev/wazeh-terms');
    expect(ghLink.getAttribute('target')).toBe('_blank');
  });
});

describe('P9 Home technical discovery link', () => {
  it('renders technical discovery button and triggers onOpenTechnical', () => {
    const onOpenTechnical = vi.fn();

    render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={false}
        onTrySample={() => undefined}
        onRetryCapabilities={() => undefined}
        onOpenTechnical={onOpenTechnical}
      />,
    );

    const discBtn = screen.getByRole('button', { name: /How WazehTerms works inside →/i });
    expect(discBtn).toBeTruthy();
    fireEvent.click(discBtn);
    expect(onOpenTechnical).toHaveBeenCalledTimes(1);
  });
});
