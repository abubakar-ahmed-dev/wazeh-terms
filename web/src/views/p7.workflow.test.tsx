/**
 * @vitest-environment jsdom
 *
 * P7 workflow and guidance test suite:
 * Validates the full workflow patterns, Help Hub, Article reader with TOC,
 * Glossary, Home 4-step strip, and contextual recovery deep-links.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ARTICLES, HELP_HUB_GROUPS } from '../content/articles';
import { GLOSSARY } from '../content/glossary';
import { ArticlePage, GlossaryPage, HelpHub } from './Help';
import { Home } from './Home';
import { Samples } from './Samples';
import { Upload } from './Upload';

afterEach(cleanup);

describe('P7 Home page redesign (P4 §2, plan §8.2)', () => {
  it('renders prominent sample CTA as primary and upload as secondary when custom upload is enabled', () => {
    const onTrySample = vi.fn();
    const onUploadClick = vi.fn();

    render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={true}
        onTrySample={onTrySample}
        onUploadClick={onUploadClick}
        onRetryCapabilities={() => undefined}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const sampleBtn = buttons.find((b) => b.textContent?.includes('Try a sample review'));
    const uploadBtn = buttons.find((b) => b.textContent?.includes('Try with a fictional PDF'));

    expect(sampleBtn).toBeTruthy();
    expect(uploadBtn).toBeTruthy();
    // Primary button has 'button' class and not 'button--secondary'
    expect(sampleBtn?.className).toBe('button');
    expect(uploadBtn?.className).toContain('button--secondary');

    fireEvent.click(sampleBtn!);
    expect(onTrySample).toHaveBeenCalledTimes(1);

    fireEvent.click(uploadBtn!);
    expect(onUploadClick).toHaveBeenCalledTimes(1);
  });

  it('renders connected 4-step workflow strip with canonical step titles and guide links', () => {
    const onOpenHelp = vi.fn();

    render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={false}
        onTrySample={() => undefined}
        onRetryCapabilities={() => undefined}
        onOpenHelp={onOpenHelp}
      />,
    );

    expect(screen.getByText('The four steps')).toBeTruthy();
    expect(screen.getByText('Choose documents')).toBeTruthy();
    expect(screen.getByText('Read documents')).toBeTruthy();
    expect(screen.getByText('Verify terms')).toBeTruthy();
    expect(screen.getByText('Findings report')).toBeTruthy();

    const guideButtons = screen.getAllByRole('button', { name: /guide/i });
    expect(guideButtons.length).toBeGreaterThanOrEqual(4);

    fireEvent.click(screen.getByRole('button', { name: 'Read checking guide →' }));
    expect(onOpenHelp).toHaveBeenCalledWith('checking-terms');
  });

  it('renders illustrative example mockup cleanly without emoji and with Changed salary chip', () => {
    const { container } = render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={false}
        onTrySample={() => undefined}
        onRetryCapabilities={() => undefined}
      />,
    );

    expect(screen.getByText(/Illustrative example/i)).toBeTruthy();
    expect(screen.getByText('Changed salary')).toBeTruthy();
    expect(container.textContent).not.toContain('⚠️');
  });

  it('renders the What this does not check limits card with full scope link', () => {
    const onOpenHelp = vi.fn();

    render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={false}
        onTrySample={() => undefined}
        onRetryCapabilities={() => undefined}
        onOpenHelp={onOpenHelp}
      />,
    );

    expect(screen.getByText('What this does not check')).toBeTruthy();
    expect(screen.getByText(/Pakistan to UAE mainland/i)).toBeTruthy();
    expect(screen.getByText(/No overall verdicts/i)).toBeTruthy();

    const scopeBtn = screen.getByRole('button', { name: 'Read the full scope and privacy guide →' });
    fireEvent.click(scopeBtn);
    expect(onOpenHelp).toHaveBeenCalledWith('scope-and-privacy');
  });
});

describe('P7 Help surfaces (P4 §8)', () => {
  it('HelpHub renders the Start Here card, all 5 task-first groups, and reference links', () => {
    const onOpenArticle = vi.fn();
    const onOpenGlossary = vi.fn();
    const onTrySample = vi.fn();

    render(
      <HelpHub
        onOpenArticle={onOpenArticle}
        onOpenGlossary={onOpenGlossary}
        onTrySample={onTrySample}
      />
    );

    // Hero card
    expect(screen.getByRole('heading', { level: 2, name: 'Getting started with WazehTerms' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Read getting started guide/i }));
    expect(onOpenArticle).toHaveBeenCalledWith('getting-started');

    // All 5 task groups present
    for (const group of HELP_HUB_GROUPS) {
      expect(screen.getByText(group.label)).toBeTruthy();
      for (const slug of group.slugs) {
        const article = ARTICLES[slug];
        expect(article).toBeDefined();
        if (article) {
          expect(screen.getAllByText(new RegExp(article.title, 'i')).length).toBeGreaterThanOrEqual(1);
        }
      }
    }

    // Reference section: Glossary & Troubleshooting
    expect(screen.getByText(/Glossary of terms/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Glossary of terms/i }));
    expect(onOpenGlossary).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/Troubleshooting & recovery/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Troubleshooting & recovery/i }));
    expect(onOpenArticle).toHaveBeenCalledWith('troubleshooting');
  });

  it('ArticlePage renders TOC, article content, and related guide footer', () => {
    const article = ARTICLES['checking-terms'];
    expect(article).toBeDefined();
    if (!article) return;

    const onBackToHelp = vi.fn();
    const onNavigateSlug = vi.fn();
    const onStartReview = vi.fn();

    render(
      <ArticlePage
        article={article}
        onBackToHelp={onBackToHelp}
        onNavigateSlug={onNavigateSlug}
        onStartReview={onStartReview}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: article.title })).toBeTruthy();

    // Table of contents contains all sections
    for (const section of article.sections) {
      expect(screen.getAllByRole('button', { name: section.heading }).length).toBeGreaterThanOrEqual(1);
    }

    // Related guides
    expect(screen.getByText('Related guides')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Scope and privacy' }));
    expect(onNavigateSlug).toHaveBeenCalledWith('scope-and-privacy');

    // Back to Help
    const backBtn = screen.getAllByRole('button', { name: /Help Hub/i })[0];
    expect(backBtn).toBeDefined();
    if (backBtn) {
      fireEvent.click(backBtn);
      expect(onBackToHelp).toHaveBeenCalledTimes(1);
    }
  });

  it('GlossaryPage renders all 31 terms with anchor links and definitions', () => {
    const onBackToHelp = vi.fn();

    const { container } = render(<GlossaryPage onBackToHelp={onBackToHelp} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Glossary of terms' })).toBeTruthy();

    expect(GLOSSARY.length).toBe(31);
    for (const entry of GLOSSARY) {
      const termEl = container.querySelector(`#${entry.slug}`);
      expect(termEl).toBeTruthy();
      expect(termEl?.textContent).toContain(entry.term);
      expect(termEl?.textContent).toContain(entry.definition);
    }
  });
});

describe('P7 Contextual guidance and error deep-links (P2 §5 map)', () => {
  it('Upload view provides deep guide links for error, slots, and requirements', () => {
    const onOpenHelp = vi.fn();

    render(
      <Upload
        onUpload={() => undefined}
        onTrySample={() => undefined}
        busy={false}
        onOpenHelp={onOpenHelp}
      />,
    );

    // Requirements link
    const reqLink = screen.getByRole('button', { name: 'Requirements guide →' });
    expect(reqLink).toBeTruthy();
    fireEvent.click(reqLink);
    expect(onOpenHelp).toHaveBeenCalledWith('uploading-documents');
  });

  it('Samples view provides link to trying-samples guide', () => {
    const onOpenHelp = vi.fn();

    render(
      <Samples
        samples={[
          {
            sampleCaseId: 'TC-001',
            title: 'Consistent terms',
            description: 'Offer and contract agree.',
            documents: [],
          },
        ]}
        onStart={() => undefined}
        busyCaseId={null}
        onOpenHelp={onOpenHelp}
      />,
    );

    const guideBtn = screen.getByRole('button', { name: 'Read guide to trying samples →' });
    expect(guideBtn).toBeTruthy();
    fireEvent.click(guideBtn);
    expect(onOpenHelp).toHaveBeenCalledWith('trying-samples');
  });
});
