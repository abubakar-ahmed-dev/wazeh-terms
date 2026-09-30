/** Shared presentational components (design foundation; spec §3 + §7). */
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
      {title ? <span className="notice__title">{title}</span> : null}
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
