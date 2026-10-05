/**
 * Shared presentational components (design foundation; spec §3 + §7).
 * Elevated dark mode styling with crisp contrast and accessible SVG icons.
 * P6 additions: guidance primitives (InfoTip, StepIntro, GuideLink,
 * EmptyMessage, HelpPanel, ConfirmDialog, Icon) per plans/usability-guides
 * P4 §6/§8 + P5 §3.10-§3.13. InfoTip follows the corrected interaction
 * contract: Tab never steals focus; popups with links are non-modal dialogs
 * that stay open while focus is inside.
 */
import { useId, useRef, useState, type ReactNode } from 'react';

import { EVIDENCE_LABELS, roleLabel } from './lib/format';
import type { Evidence } from './lib/types';
import type { GuideUnit } from './content/guides';
import type { Article, ArticleBlock } from './content/articles';

export function Notice({
  kind,
  title,
  children,
  role,
}: {
  kind: 'source' | 'incomplete' | 'error' | 'plain';
  title?: string;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  const cls = kind === 'plain' ? 'notice' : `notice notice--${kind}`;
  return (
    <div className={cls} role={role}>
      {title ? (
        <span className="notice__title">
          {kind === 'source' ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ) : kind === 'incomplete' ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : kind === 'error' ? (
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : null}
          {title}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function ErrorPanel({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <Notice kind="error" role="alert" title="Something needs your attention.">
      <p>{message}</p>
      {children}
    </Notice>
  );
}

export function EvidenceQuote({
  evidence,
  role,
}: {
  evidence: Evidence;
  role?: 'offer' | 'contract' | 'document';
}) {
  const documentRole =
    role ??
    (evidence.documentId.includes('offer')
      ? 'offer'
      : evidence.documentId.includes('contract')
        ? 'contract'
        : 'document');
  return (
    <figure className={`evidence evidence--origin-${documentRole}`}>
      <span className="evidence__label">
        {roleLabel(documentRole)} · Page {evidence.page} — {EVIDENCE_LABELS[evidence.verification]}
      </span>
      <blockquote className="evidence__quote">“{evidence.quote}”</blockquote>
    </figure>
  );
}

export function CorrectionQuote({ children }: { children: ReactNode }) {
  return (
    <figure className="evidence evidence--correction">
      <span className="evidence__label">Your correction — used for analysis, not a page quote</span>
      <blockquote className="evidence__quote">{children}</blockquote>
    </figure>
  );
}

export function DocumentIcon({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ── P6 guidance primitives ───────────────────────────────────────────────

/** Minimal stroke icon set (P5 §3.14) — replaces emoji in labels. */
export function Icon({ name, size = 16 }: { name: 'info' | 'close' | 'chevron' | 'external' | 'alert' | 'clock' | 'check' | 'search' | 'doc'; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...common}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case 'external':
      return (
        <svg {...common}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'doc':
      return <DocumentIcon size={size} />;
  }
}

/**
 * Named guide link. Inside an active review, help deep links leave the flow,
 * so they are labelled (P4 §8.3); elsewhere they navigate in-app.
 */
export function GuideLink({ label, href, newTab = false }: { label: string; href: string; newTab?: boolean }) {
  if (newTab) {
    return (
      <a className="guide-link" href={href} target="_blank" rel="noreferrer">
        {label} <span className="guide-link__hint">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <a className="guide-link" href={href}>
      {label}
    </a>
  );
}

/**
 * InfoTip (P5 §3.10). Definitions only at heart; when the unit carries
 * links, the popup becomes a small non-modal dialog: it stays open while
 * focus is inside, links show the standard focus ring, Esc/outside close
 * returns focus to the trigger, and Tab never steals focus.
 */
export function InfoTip({ label, unit: guideUnit, newTabLinks = false }: { label: string; unit: GuideUnit; newTabLinks?: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const popupId = useId();
  const hasLinks = (guideUnit.links?.length ?? 0) > 0;

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  return (
    <span className="infotip" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="infotip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open && !hasLinks ? popupId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.stopPropagation();
            close(true);
          }
        }}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <Icon name="info" size={16} />
      </button>
      {open ? (
        <span
          id={popupId}
          role={hasLinks ? 'dialog' : undefined}
          aria-label={hasLinks ? guideUnit.title : undefined}
          className="infotip__popup"
          onKeyDown={(event) => {
            if (event.key === 'Escape') close(true);
          }}
        >
          <span className="infotip__title">{guideUnit.title}</span>
          {guideUnit.body.map((paragraph) => (
            <span className="infotip__body" key={paragraph.slice(0, 24)}>
              {paragraph}
            </span>
          ))}
          {guideUnit.links?.map(([linkLabel, href]) => (
            <GuideLink key={href} label={linkLabel} href={href} newTab={newTabLinks} />
          ))}
        </span>
      ) : null}
    </span>
  );
}

/** Collapsible section orientation block (P4 StepIntro). */
export function StepIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="step-intro">
      <summary className="step-intro__summary">
        <Icon name="chevron" size={14} />
        <span>{title}</span>
      </summary>
      <div className="step-intro__content">{children}</div>
    </details>
  );
}

/** Empty/absent state panel (P5 §3.12): message + optional action. */
export function EmptyMessage({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="empty-message">
      <Icon name="info" size={20} />
      <p>{message}</p>
      {action}
    </div>
  );
}

/**
 * In-review help side/bottom sheet (P4 §8.3): non-modal, page stays usable,
 * Review never unmounts — opening help can never lose work (R17).
 */
export function HelpPanel({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="help-panel" role="dialog" aria-modal={false} aria-labelledby={titleId}>
      <div className="help-panel__head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="button button--ghost" ref={closeRef} autoFocus onClick={onClose}>
          <Icon name="close" size={14} /> Close
        </button>
      </div>
      <div className="help-panel__body">{children}</div>
    </div>
  );
}

export interface DialogAction {
  readonly label: string;
  readonly kind: 'primary' | 'secondary' | 'danger';
  readonly onChoose: () => void;
}

function ArticleBlocks({ blocks }: { blocks: readonly ArticleBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === 'p') return <p key={index}>{block.text}</p>;
        if (block.type === 'bullets') {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item.slice(0, 32)}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.type === 'figure') {
          return (
            <figure key={index} className="article-figure">
              <img src={block.src} alt={block.alt} className="article-figure__img" loading="lazy" />
              <figcaption className="article-figure__caption">{block.caption}</figcaption>
            </figure>
          );
        }
        return (
          <table key={index} className="article-table">
            <thead>
              <tr>
                {block.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]?.slice(0, 24)}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </>
  );
}

/** Renders a served pilot article (P4 §8.2); optional section to scroll to. */
export function ArticleBody({ article, focusSection }: { article: Article; focusSection?: string }) {
  return (
    <article className="article">
      {article.intro.map((paragraph) => (
        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
      ))}
      {article.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-h`}
          ref={(node) => {
            if (node && focusSection === section.id) {
              node.scrollIntoView({ block: 'start' });
            }
          }}
        >
          <h3 id={`${section.id}-h`}>{section.heading}</h3>
          <ArticleBlocks blocks={section.blocks} />
        </section>
      ))}
    </article>
  );
}

/**
 * Modal confirm (P5 §3.13). Focus starts on the safe action; focus is
 * trapped; Esc chooses the safe action; consequence text differs per dialog
 * (R18) — callers pass their own copy.
 */
export function ConfirmDialog({
  title,
  body,
  actions,
  safeIndex = 0,
}: {
  title: string;
  body: string;
  actions: readonly DialogAction[];
  /** Index of the safe action (Esc + initial focus). */
  safeIndex?: number;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      actions[safeIndex]?.onChoose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="dialog-overlay">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onKeyDown={handleKeyDown}
      >
        <h2 id={titleId}>{title}</h2>
        <p>{body}</p>
        <div className="dialog__actions">
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              autoFocus={index === safeIndex}
              className={`button ${action.kind === 'primary' ? '' : action.kind === 'danger' ? 'button--danger' : 'button--secondary'}`}
              onClick={action.onChoose}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
