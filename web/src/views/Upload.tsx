/** Upload view: admit custom job offer and/or employment contract PDFs for review. */
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

import { Notice } from '../ui';

interface UploadProps {
  onUpload: (files: { offer?: File | null; contract?: File | null }) => void;
  onTrySample: () => void;
  busy: boolean;
  maxBytesPerFile?: number;
  maxPagesPerPdf?: number;
  customUploadEnabled?: boolean | null;
}

export function Upload({
  onUpload,
  onTrySample,
  busy,
  maxBytesPerFile = 8 * 1024 * 1024,
  maxPagesPerPdf = 15,
  customUploadEnabled,
}: UploadProps) {
  const [offerFile, setOfferFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offerInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return `"${file.name}" is not a PDF. Only PDF documents are supported at this time.`;
    }
    if (file.size > maxBytesPerFile) {
      const maxMb = Math.round(maxBytesPerFile / (1024 * 1024));
      return `"${file.name}" exceeds the ${maxMb}MB file size limit.`;
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

  function handleSubmit() {
    if (!hasAtLeastOneFile || busy) return;
    onUpload({ offer: offerFile, contract: contractFile });
  }

  return (
    <div className="view__inner">
      <div className="section-head" style={{ marginBottom: '2rem' }}>
        <span className="hero__eyebrow">CUSTOM DOCUMENT UPLOAD</span>
        <h1 tabIndex={-1} style={{ fontSize: '2.4rem', margin: '0.5rem 0' }}>
          Upload your employment documents
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-secondary)', fontSize: '1.05rem' }}>
          Upload your job offer letter, official employment contract, or both. We will extract all terms, highlight any differences, and check them against official rules.
        </p>
      </div>

      {error ? (
        <Notice kind="error" role="alert" title="Upload Notice">
          <p>{error}</p>
        </Notice>
      ) : null}

      {customUploadEnabled === false ? (
        <Notice kind="incomplete" role="status" title="Personal document upload is currently closed on this deployment">
          <p>
            The backend server is currently configured with <code>CUSTOM_UPLOAD_ENABLED=false</code>.
            To enable document analysis, set <code>CUSTOM_UPLOAD_ENABLED=true</code> in <code>api/.env</code>.
            In the meantime, you can explore the complete verification flow using our fictional samples.
          </p>
          <button type="button" className="button button--secondary" onClick={onTrySample} style={{ marginTop: '0.5rem' }}>
            Explore fictional samples
          </button>
        </Notice>
      ) : null}

      <div className="upload-slots-grid">
        {/* Slot 1: Job Offer */}
        <div className={`upload-slot ${offerFile ? 'upload-slot--filled' : ''}`}>
          <div className="upload-slot__header">
            <div>
              <span className="chip chip--offer" style={{ marginBottom: '0.4rem' }}>
                DOCUMENT 1
              </span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>Job Offer Letter</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>
                Initial offer, pre-contract, or term sheet
              </p>
            </div>
          </div>

          {offerFile ? (
            <div className="file-preview-card">
              <div className="file-preview-card__info">
                <span className="file-preview-card__icon" aria-hidden="true">📄</span>
                <div>
                  <strong className="file-preview-card__name">{offerFile.name}</strong>
                  <span className="file-preview-card__size">{formatBytes(offerFile.size)} · PDF</span>
                </div>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setOfferFile(null)}
                title="Remove offer file"
                aria-label="Remove offer file"
                style={{ padding: '0.3rem 0.6rem', minHeight: '36px' }}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div
              className="dropzone"
              onDrop={(e) => handleDrop(e, 'offer')}
              onDragOver={handleDragOver}
              onClick={() => offerInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  offerInputRef.current?.click();
                }
              }}
              aria-label="Upload job offer PDF"
            >
              <input
                ref={offerInputRef}
                type="file"
                data-role="offer"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  handleFileSelected('offer', e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <span className="dropzone__icon" aria-hidden="true">📥</span>
              <p style={{ margin: '0.4rem 0', fontWeight: 600, color: 'var(--ink)' }}>
                Drop offer PDF here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                PDF up to {maxPagesPerPdf} pages (max {Math.round(maxBytesPerFile / (1024 * 1024))}MB)
              </p>
            </div>
          )}
        </div>

        {/* Slot 2: Employment Contract */}
        <div className={`upload-slot ${contractFile ? 'upload-slot--filled' : ''}`}>
          <div className="upload-slot__header">
            <div>
              <span className="chip chip--contract" style={{ marginBottom: '0.4rem' }}>
                DOCUMENT 2
              </span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>Employment Contract</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>
                Standard MOHRE or company employment agreement
              </p>
            </div>
          </div>

          {contractFile ? (
            <div className="file-preview-card">
              <div className="file-preview-card__info">
                <span className="file-preview-card__icon" aria-hidden="true">📄</span>
                <div>
                  <strong className="file-preview-card__name">{contractFile.name}</strong>
                  <span className="file-preview-card__size">{formatBytes(contractFile.size)} · PDF</span>
                </div>
              </div>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setContractFile(null)}
                title="Remove contract file"
                aria-label="Remove contract file"
                style={{ padding: '0.3rem 0.6rem', minHeight: '36px' }}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div
              className="dropzone"
              onDrop={(e) => handleDrop(e, 'contract')}
              onDragOver={handleDragOver}
              onClick={() => contractInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  contractInputRef.current?.click();
                }
              }}
              aria-label="Upload employment contract PDF"
            >
              <input
                ref={contractInputRef}
                type="file"
                data-role="contract"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  handleFileSelected('contract', e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <span className="dropzone__icon" aria-hidden="true">📥</span>
              <p style={{ margin: '0.4rem 0', fontWeight: 600, color: 'var(--ink)' }}>
                Drop contract PDF here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                PDF up to {maxPagesPerPdf} pages (max {Math.round(maxBytesPerFile / (1024 * 1024))}MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scope Confirmation */}
      <div className="card" style={{ marginTop: '1.5rem', background: 'var(--surface-elevated)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong style={{ fontSize: '0.98rem', display: 'block', color: 'var(--ink)' }}>
              Jurisdiction & Route Scope
            </strong>
            <span style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              Official rules and recruitment protections are checked against UAE & Pakistan statutory baselines.
            </span>
          </div>
          <span className="chip chip--scenario">Pakistan → UAE Mainland Private</span>
        </div>
      </div>

      {/* Zero-retention Privacy Notice */}
      <div className="notice notice--source" style={{ marginTop: '1.25rem' }}>
        <span className="notice__title">🔒 In-memory processing & privacy advisory</span>
        <p style={{ margin: '0.35rem 0' }}>
          Your files are processed in server memory only and are <strong>never stored on disk or in a database</strong>.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
          Tip: For maximum privacy, we recommend blacking out or redacting personal identity numbers (such as your CNIC, passport number, personal phone, or bank details) before uploading.
        </p>
      </div>

      {/* Action CTA Bar */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="button"
          disabled={!hasAtLeastOneFile || busy}
          onClick={handleSubmit}
          style={{ minWidth: '240px', fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
        >
          {busy ? 'Extracting terms...' : 'Extract & Review Terms →'}
        </button>

        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--ink-secondary)' }}>
          Don't have your documents ready?{' '}
          <button type="button" className="link-button" onClick={onTrySample}>
            Explore our fictional samples instead
          </button>
        </p>
      </div>
    </div>
  );
}
