/**
 * Upload view (P4 §4 rework; R19): essential processing consequences, both
 * notice links, and the acknowledgment stay visible beside the start action —
 * never collapsed. Requirements render from capabilities (incl. combined
 * total — issue 14). Fictional-only boundary in one plain line (issue 26).
 */
import { useRef, useState, type DragEvent, type ChangeEvent, type RefObject } from 'react';

import { Notice } from '../ui';

interface UploadProps {
  onUpload: (files: { offer?: File | null; contract?: File | null }) => void;
  onTrySample: () => void;
  busy: boolean;
  maxBytesPerFile?: number;
  maxTotalBytes?: number;
  maxPagesPerPdf?: number;
  customUploadEnabled?: boolean | null;
  privacyNoticeVersion?: string | null;
  onOpenHelp?: (slug: string) => void;
}

const mb = (bytes: number): string => `${Math.round(bytes / (1024 * 1024))} MB`;

export function Upload({
  onUpload,
  onTrySample,
  busy,
  maxBytesPerFile = 8 * 1024 * 1024,
  maxTotalBytes,
  maxPagesPerPdf = 15,
  customUploadEnabled,
  privacyNoticeVersion,
  onOpenHelp,
}: UploadProps) {
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const offerInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return `"${file.name}" is not a PDF. Only PDF documents are supported at this time.`;
    }
    if (file.size > maxBytesPerFile) {
      return `"${file.name}" exceeds the ${mb(maxBytesPerFile)} file size limit.`;
    }
    return null;
  }

  function handleFileSelected(role: 'offer' | 'contract', file: File | undefined) {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    if (role === 'offer') setOfferFile(file);
    if (role === 'contract') setContractFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, role: 'offer' | 'contract') {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    handleFileSelected(role, file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const hasAtLeastOneFile = offerFile !== null || contractFile !== null;
  const exactlyOne = hasAtLeastOneFile && !(offerFile !== null && contractFile !== null);

  function handleSubmit() {
    if (!hasAtLeastOneFile || !acknowledged || busy) return;
    onUpload({ offer: offerFile, contract: contractFile });
  }

  const slot = (
    role: 'offer' | 'contract',
    number: string,
    title: string,
    purpose: string,
    file: File | null,
    inputRef: RefObject<HTMLInputElement | null>,
    onRemove: () => void,
    ariaLabel: string,
  ) => (
    <div className={`upload-slot ${file ? 'upload-slot--filled' : ''}`}>
      <div className="upload-slot__header">
        <div>
          <span className={`chip ${role === 'offer' ? 'chip--offer' : 'chip--contract'}`} style={{ marginBottom: '0.4rem' }}>
            {number}
          </span>
          <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>{title}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>{purpose}</p>
        </div>
      </div>

      {file ? (
        <div className="file-preview-card">
          <div className="file-preview-card__info">
            <strong className="file-preview-card__name">{file.name}</strong>
            <span className="file-preview-card__size">{formatBytes(file.size)} · PDF</span>
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={onRemove}
            title={`Remove ${role} file`}
            aria-label={`Remove ${role} file`}
            style={{ padding: '0.3rem 0.6rem', minHeight: '36px' }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <div
          className="dropzone"
          onDrop={(e) => handleDrop(e, role)}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-label={ariaLabel}
        >
          <input
            ref={inputRef}
            type="file"
            data-role={role}
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              handleFileSelected(role, e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <p style={{ margin: '0.4rem 0', fontWeight: 600, color: 'var(--ink)' }}>
            Drop a fictional {role} PDF here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="view">
      <div className="view__inner">
        <div className="section-head" style={{ marginBottom: '1.25rem' }}>
          <span className="eyebrow">Fictional documents only — a demo, not for real offers or contracts</span>
          <h1 tabIndex={-1} style={{ fontSize: '2.2rem', margin: '0.5rem 0' }}>
            Start a document review
          </h1>
          <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-secondary)', fontSize: '1.02rem' }}>
            See how WazehTerms reads a job offer, an employment contract, or both — using a fictional PDF that
            contains no personal or confidential information.
          </p>
        </div>

        {error ? (
          <Notice kind="error" role="alert" title="Upload Notice">
            <p>{error}</p>
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
        ) : null}

        {customUploadEnabled === false ? (
          <Notice kind="incomplete" role="status" title="Document upload is not available right now">
            <p>This deployment is running the fictional-samples demo only.</p>
            <button type="button" className="button button--secondary" onClick={onTrySample} style={{ marginTop: '0.5rem' }}>
              Explore fictional samples
            </button>
          </Notice>
        ) : null}

        <div className="upload-slots-grid">
          {slot(
            'offer',
            'Document 1 · Job offer',
            'Job Offer Letter',
            'A fictional offer, pre-contract, or term sheet',
            offerFile,
            offerInputRef,
            () => setOfferFile(null),
            'Choose a fictional job offer PDF',
          )}
          {slot(
            'contract',
            'Document 2 · Contract',
            'Employment Contract',
            'A fictional employment agreement',
            contractFile,
            contractInputRef,
            () => setContractFile(null),
            'Choose a fictional employment contract PDF',
          )}
        </div>

        <p className="upload-requirements">
          PDF only · up to {mb(maxBytesPerFile)} per file
          {maxTotalBytes ? ` · up to ${mb(maxTotalBytes)} combined` : ''} · up to {maxPagesPerPdf} pages · English ·
          digital PDF with readable text (scans not reliably supported){' '}
          <button
            type="button"
            className="guide-link"
            onClick={() => onOpenHelp?.('uploading-documents')}
          >
            Requirements guide →
          </button>
        </p>

        {exactlyOne ? (
          <p className="upload-one-doc" role="status">
            One document selected — its terms can be checked on their own, but two documents allow comparison.
          </p>
        ) : null}

        {/* Processing notice + acknowledgment — ALWAYS visible beside the action (R19). */}
        <div className="notice notice--source upload-notice">
          <span className="notice__title">How this demo handles what you upload</span>
          <p style={{ margin: '0.35rem 0' }}>
            Your document content is sent to Google's Gemini API (Free tier), which may use it to improve its
            products; human reviewers may examine it. WazehTerms processes files in memory only and stores nothing.
          </p>
          <details className="step-intro" style={{ margin: '0.5rem 0' }}>
            <summary className="step-intro__summary">What this means in detail</summary>
            <div className="step-intro__content">
              <p>
                The acknowledgment below records that you understand both sides: WazehTerms keeps no copy of your
                review, and the provider's handling is governed by its own terms — which WazehTerms cannot promise
                anything about. This demonstration is not ready to process real employment documents, and documents
                based on a real offer stay excluded even with names changed.
              </p>
            </div>
          </details>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
            Full notice:{' '}
            <button
              type="button"
              className="guide-link"
              onClick={() => onOpenHelp?.('scope-and-privacy')}
            >
              WazehTerms processing and privacy
            </button>{' '}
            ·{' '}
            <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
              Gemini API terms (opens elsewhere)
            </a>
            {privacyNoticeVersion ? (
              <span style={{ color: 'var(--ink-muted)' }}> · notice version {privacyNoticeVersion}</span>
            ) : null}
          </p>
          <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              style={{ marginTop: '0.25rem', width: '1.1rem', height: '1.1rem', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>
              I understand and agree — I am uploading only a fictional document that contains no personal, sensitive,
              or confidential information.
            </span>
          </label>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="button"
            disabled={!hasAtLeastOneFile || !acknowledged || busy}
            onClick={handleSubmit}
            style={{ minWidth: '240px', fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
          >
            {busy ? 'Reading the documents…' : 'Start reading →'}
          </button>
          {!hasAtLeastOneFile || !acknowledged ? (
            <p role="status" style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
              {hasAtLeastOneFile
                ? 'Tick the acknowledgment above to continue.'
                : 'Choose a fictional PDF and tick the acknowledgment to continue.'}
            </p>
          ) : null}

          <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--ink-secondary)' }}>
            Prefer ready-made documents?{' '}
            <button type="button" className="link-button" onClick={onTrySample}>
              Open the fictional samples
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
