/**
 * Shared presentational components (design foundation; spec §3 + §7).
 * Elevated dark mode styling with crisp contrast and accessible SVG icons.
 */
import type { ReactNode } from 'react';

import { EVIDENCE_LABELS, roleLabel } from './lib/format';
import type { Evidence } from './lib/types';

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

export function EvidenceQuote({ evidence }: { evidence: Evidence }) {
  const documentRole = evidence.documentId.includes('offer')
    ? 'offer'
    : evidence.documentId.includes('contract')
      ? 'contract'
      : 'document';
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

export function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
