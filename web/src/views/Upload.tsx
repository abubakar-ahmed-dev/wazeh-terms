/**
 * Upload view — demo-only document intake (MT-10, notice version
 * gemini-free-demo-v1): fictional, non-sensitive documents only. Real
 * offers/contracts are excluded until a paid provider path passes its own
 * release decision. The full notice must be acknowledged (unticked by
 * default) before submission is possible.
 */
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

import { Notice } from '../ui';

interface UploadProps {
  onUpload: (files: { offer?: File | null; contract?: File | null }) => void;
  onTrySample: () => void;
  busy: boolean;
  maxBytesPerFile?: number;
  maxPagesPerPdf?: number;
  customUploadEnabled?: boolean | null;
  privacyNoticeVersion?: string | null;
}

export function Upload({
  onUpload,
  onTrySample,
  busy,
  maxBytesPerFile = 8 * 1024 * 1024,
  maxPagesPerPdf = 15,
  customUploadEnabled,
  privacyNoticeVersion,
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
    if (!hasAtLeastOneFile || !acknowledged || busy) return;
    onUpload({ offer: offerFile, contract: contractFile });
  }

  return (
    <div className="view__inner">
      <div className="section-head" style={{ marginBottom: '1.5rem' }}>
        <span className="hero__eyebrow">DEMO — FICTIONAL DOCUMENTS ONLY</span>
        <h1 tabIndex={-1} style={{ fontSize: '2.4rem', margin: '0.5rem 0' }}>
          Try a document review
        </h1>
        <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--ink-secondary)', fontSize: '1.05rem' }}>
          See how WazehTerms reads a job offer, an employment contract, or both — using a{' '}
          <strong>fictional PDF that contains no personal or confidential information</strong>. This demo is not
          ready to process real employment documents.
        </p>
      </div>

      {error ? (
        <Notice kind="error" role="alert" title="Upload Notice">
          <p>{error}</p>
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

      <div className="notice notice--incomplete" role="status" style={{ marginTop: '0.5rem' }}>
        <span className="notice__title">Demo uploads only</span>
        <p style={{ margin: '0.35rem 0' }}>
          Upload fictional documents that contain no personal, sensitive, or confidential information. Do not
          upload a real job offer or employment contract, even if you are testing the app.
        </p>
      </div>

      <div className="upload-slots-grid">
        {/* Slot 1: fictional offer */}
        <div className={`upload-slot ${offerFile ? 'upload-slot--filled' : ''}`}>
          <div className="upload-slot__header">
            <div>
              <span className="chip chip--offer" style={{ marginBottom: '0.4rem' }}>
                DOCUMENT 1
              </span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>Job Offer Letter</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>
                A fictional offer, pre-contract, or term sheet
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
              aria-label="Choose a fictional job offer PDF"
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
                Drop a fictional offer PDF here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                PDF up to {maxPagesPerPdf} pages (max {Math.round(maxBytesPerFile / (1024 * 1024))}MB)
              </p>
            </div>
          )}
        </div>

        {/* Slot 2: fictional contract */}
        <div className={`upload-slot ${contractFile ? 'upload-slot--filled' : ''}`}>
          <div className="upload-slot__header">
            <div>
              <span className="chip chip--contract" style={{ marginBottom: '0.4rem' }}>
                DOCUMENT 2
              </span>
              <h2 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>Employment Contract</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', margin: 0 }}>
                A fictional employment agreement
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
              aria-label="Choose a fictional employment contract PDF"
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
                Drop a fictional contract PDF here, or <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>browse</span>
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
              Jurisdiction &amp; Route Scope
            </strong>
            <span style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              Official rules and recruitment protections are checked against UAE &amp; Pakistan statutory baselines.
            </span>
          </div>
          <span className="chip chip--scenario">Pakistan → UAE Mainland Private</span>
        </div>
      </div>

      {/* Full privacy notice — must be acknowledged before submission */}
      <div className="notice notice--source" style={{ marginTop: '1.25rem' }}>
        <span className="notice__title">How this demo handles what you upload</span>
        <p style={{ margin: '0.35rem 0' }}>
          Document content is sent to Google's Gemini API for extraction. On the Free tier, Google may use
          submitted content and responses to improve its products, and human reviewers may examine them. WazehTerms
          processes files in memory only and stores nothing, but it <strong>cannot promise zero retention by the
          provider</strong>.
        </p>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
          WazehTerms is currently a demonstration and is not ready to process real employment documents. Notice
          version {privacyNoticeVersion ?? 'gemini-free-demo-v1'}.
        </p>
        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '0.75rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            style={{ marginTop: '0.25rem', width: '1.1rem', height: '1.1rem', flexShrink: 0 }}
          />
          <span style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>
            I understand and agree — I am uploading only a fictional document that contains no personal,
            sensitive, or confidential information.
          </span>
        </label>
      </div>

      {/* Action CTA Bar */}
      <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="button"
          disabled={!hasAtLeastOneFile || !acknowledged || busy}
          onClick={handleSubmit}
          style={{ minWidth: '240px', fontSize: '1.05rem', padding: '0.8rem 1.75rem' }}
        >
          {busy ? 'Extracting terms...' : 'Try with a fictional PDF →'}
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
            Explore our fictional samples instead
          </button>
        </p>
      </div>
    </div>
  );
}
