/**
 * Review (spec §4.5): 12 groups / all active components, three provenance
 * layers, per-kind correction editor, expiry warning, fields-first mobile with
 * a full-screen page panel and focus restoration.
 * Phase 12: Modern dark mode dual-pane workspace with refined visual hierarchy.
 */
import { useEffect, useRef, useState } from 'react';

import { expiryLabel, formatValue, roleLabel, STATE_CHIP_CLASS, STATE_LABELS } from '../lib/format';
import {
  FIELD_GROUP_OF,
  FIELD_GROUPS,
  FIELD_LABELS,
  type CorrectionDelta,
  type ExtractedField,
  type IssuedDocument,
  type IssuedExtraction,
  type NormalizedValue,
} from '../lib/types';
import { CorrectionQuote, EvidenceQuote, Notice } from '../ui';

interface ReviewProps {
  issued: IssuedExtraction;
  previewUrls: ReadonlyArray<{ role: 'offer' | 'contract'; url: string }>;
  corrections: ReadonlyArray<CorrectionDelta>;
  onCorrect: (delta: CorrectionDelta) => void;
  onUndoCorrection: (key: string) => void;
  onContinue: () => void;
  onReset: () => void;
}

const needsCheck = (field: ExtractedField): boolean => field.state === 'unclear' || field.state === 'unreadable';

export function Review({ issued, previewUrls, corrections, onCorrect, onUndoCorrection, onContinue, onReset }: ReviewProps) {
  const [expiry, setExpiry] = useState(() => expiryLabel(issued.expiresAt));
  const expired = expiryLabel(issued.expiresAt).startsWith('This review has expired');
  useEffect(() => {
    const timer = window.setInterval(() => setExpiry(expiryLabel(issued.expiresAt)), 15000);
    return () => window.clearInterval(timer);
  }, [issued.expiresAt]);

  const needsCount = issued.documents.reduce(
    (count, document) => count + document.fields.filter(needsCheck).length,
    0,
  );
  const unreadablePages = issued.documents.flatMap((document) =>
    document.unreadablePages.map((page) => `${roleLabel(document.role)} page ${page}`),
  );

  return (
    <div className="view">
      <div className="view__inner view__inner--wide">
        <header className="review-header-bar">
          <div>
            <span className="eyebrow">Step 3 of 4: Document Verification</span>
            <h1 tabIndex={-1}>Check what we read</h1>
            <p style={{ margin: 0 }}>
              Compare each value with the original page. Your changes remain labelled as yours.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="chip" role="status">
              <span aria-hidden="true">⏱️</span> {expiry}
            </span>
            {needsCount > 0 ? (
              <span className="needs-check">
                {needsCount} field{needsCount === 1 ? '' : 's'} need your check
              </span>
            ) : (
              <span className="chip chip--state-found">
                <span aria-hidden="true">✓</span> Clean extraction
              </span>
            )}
          </div>
        </header>

        {expired ? (
          <Notice kind="error" role="alert" title="This review can no longer be continued.">
            <p>The time window for this extraction ended. Start again to get a fresh review.</p>
            <button className="button" onClick={onReset}>
              Start over
            </button>
          </Notice>
        ) : (
          <>
            {needsCount > 0 ? (
              <Notice kind="incomplete" role="status" title={`${needsCount} field${needsCount === 1 ? '' : 's'} need your check`}>
                <p>
                  Unclear or unreadable values are marked below; correcting them is optional but helps the comparison engine produce accurate findings.
                </p>
              </Notice>
            ) : null}
            {unreadablePages.length > 0 ? (
              <Notice kind="incomplete" role="status" title="Some pages could not be read.">
                <p>
                  {unreadablePages.join(', ')} — fields on those pages may be incomplete.
                </p>
              </Notice>
            ) : null}

            <ReviewBody
              issued={issued}
              previewUrls={previewUrls}
              corrections={corrections}
              onCorrect={onCorrect}
              onUndoCorrection={onUndoCorrection}
            />

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <button className="button button--full" onClick={onContinue} style={{ maxWidth: '28rem' }}>
                <span>Continue to findings</span>
                <span aria-hidden="true">→</span>
              </button>
              <button className="link-button" onClick={onReset}>
                Start over with a different document
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewBody({
  issued,
  previewUrls,
  corrections,
  onCorrect,
  onUndoCorrection,
}: {
  issued: IssuedExtraction;
  previewUrls: ReadonlyArray<{ role: 'offer' | 'contract'; url: string }>;
  corrections: ReadonlyArray<CorrectionDelta>;
  onCorrect: (delta: CorrectionDelta) => void;
  onUndoCorrection: (key: string) => void;
}) {
  const [activeRole, setActiveRole] = useState<'offer' | 'contract'>(previewUrls[0]?.role ?? 'offer');
  const [pageNumber, setPageNumber] = useState(1);
  const [paneOpen, setPaneOpen] = useState(false);
  const paneTrigger = useRef<HTMLButtonElement | null>(null);
  const paneClose = useRef<HTMLButtonElement | null>(null);

  const openPage = (page: number) => {
    setPageNumber(page);
    setPaneOpen(true);
  };

  const closePane = () => {
    setPaneOpen(false);
    window.setTimeout(() => paneTrigger.current?.focus(), 0);
  };

  useEffect(() => {
    if (paneOpen) paneClose.current?.focus();
  }, [paneOpen]);

  const preview = previewUrls.find((entry) => entry.role === activeRole);
  const urlWithPage = preview ? `${preview.url}#page=${pageNumber}` : '';

  return (
    <div className="review-layout">
      {/* Left Pane: Sticky Document Viewer */}
      <div className="doc-pane" hidden={!paneOpen}>
        <div className="doc-pane__toolbar">
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {previewUrls.map((entry) => (
              <button
                key={entry.role}
                className={`button ${activeRole === entry.role ? 'button--secondary' : 'button--ghost'}`}
                style={{ padding: '0.35rem 0.8rem', minHeight: '38px', fontSize: '0.88rem' }}
                aria-pressed={activeRole === entry.role}
                onClick={() => {
                  setActiveRole(entry.role);
                  setPageNumber(1);
                }}
              >
                {roleLabel(entry.role)}
              </button>
            ))}
          </div>

          <span className="chip" style={{ marginLeft: 'auto' }}>Page {pageNumber}</span>

          <button className="link-button" onClick={closePane} ref={paneClose} style={{ fontSize: '0.85rem' }}>
            Close viewer
          </button>
        </div>
        {urlWithPage ? (
          <iframe
            title={`${roleLabel(activeRole)} document, page ${pageNumber}`}
            src={urlWithPage}
          />
        ) : null}
      </div>

      {!paneOpen ? (
        <div className="doc-pane" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} aria-hidden="true">📄</span>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--ink)' }}>Original Document View</h3>
          <p style={{ fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            Original wording lives one click away: click any field's “View page” control, or open a document below.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {previewUrls.map((entry) => (
              <button
                key={entry.role}
                ref={entry.role === previewUrls[0]?.role ? paneTrigger : undefined}
                className="button button--secondary"
                onClick={() => {
                  setActiveRole(entry.role);
                  setPaneOpen(true);
                }}
              >
                View {roleLabel(entry.role).toLowerCase()} document
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Right Pane: Extracted Fields by Group */}
      <div className="review-layout__fields">
        {FIELD_GROUPS.map((group, index) => {
          const groupFields = issued.documents.flatMap((document) =>
            document.fields
              .filter((field) => FIELD_GROUP_OF[field.fieldKey] === group.key)
              .map((field) => ({ document, field })),
          );
          if (groupFields.length === 0) return null;
          const groupNeeds = groupFields.filter(({ field }) => needsCheck(field)).length;
          return (
            <details key={group.key} className="group" open={index === 0}>
              <summary className="group__summary">
                <span>
                  <strong>{group.heading}</strong>{' '}
                  <span className="sr-only">— {groupFields.length} fields</span>
                </span>
                {groupNeeds > 0 ? (
                  <span className="needs-check">{groupNeeds} need your check</span>
                ) : (
                  <span className="chip">{groupFields.length}</span>
                )}
              </summary>
              {groupFields.map(({ document, field }) => (
                <FieldCard
                  key={`${document.documentId}:${field.instanceId}`}
                  field={field}
                  document={document}
                  correctedKey={corrections.find(
                    (delta) =>
                      delta.documentId === document.documentId &&
                      delta.fieldKey === field.fieldKey &&
                      delta.instanceId === field.instanceId,
                  )}
                  onViewPage={openPage}
                  onCorrect={onCorrect}
                  onUndoCorrection={onUndoCorrection}
                />
              ))}
            </details>
          );
        })}
      </div>
    </div>
  );
}

function FieldCard({
  field,
  document,
  correctedKey,
  onViewPage,
  onCorrect,
  onUndoCorrection,
}: {
  field: ExtractedField;
  document: IssuedDocument;
  correctedKey?: CorrectionDelta;
  onViewPage: (page: number) => void;
  onCorrect: (delta: CorrectionDelta) => void;
  onUndoCorrection: (key: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const firstPage = field.evidence[0]?.page;
  const label = FIELD_LABELS[field.fieldKey] ?? field.fieldKey;

  return (
    <div className="fieldcard">
      <div className="fieldcard__head">
        <span className="fieldcard__name">
          {label}
          {field.instanceId !== `${field.fieldKey}:0` ? ` (${field.instanceId.split(':')[1] ?? ''})` : ''}
        </span>
        <span className={STATE_CHIP_CLASS[field.state]}>{STATE_LABELS[field.state]}</span>
      </div>

      <div style={{ marginBottom: '0.4rem' }}>
        <span className={`chip ${document.role === 'offer' ? 'chip--offer' : 'chip--contract'}`}>
          {roleLabel(document.role)}
        </span>
      </div>

      {field.rawText ? (
        <p className="typed-value">
          <strong>Original wording: </strong> {field.rawText}
        </p>
      ) : null}

      {field.value && field.state === 'present' ? (
        <p className="typed-value">
          <strong>What we read: </strong> {formatValue(field.value)}
        </p>
      ) : null}

      {correctedKey ? (
        <CorrectionQuote>
          {correctedKey.value ? formatValue(correctedKey.value) : STATE_LABELS[correctedKey.state]}{' '}
          <button
            className="link-button"
            onClick={() => onUndoCorrection(`${correctedKey.documentId}:${correctedKey.fieldKey}:${correctedKey.instanceId}`)}
          >
            Remove correction
          </button>
        </CorrectionQuote>
      ) : null}

      {field.evidence.map((evidence) => (
        <EvidenceQuote key={`${evidence.documentId}:${evidence.page}:${evidence.quote.slice(0, 12)}`} evidence={evidence} />
      ))}

      {field.qualityNotes.length > 0 ? (
        <p className="evidence__label" style={{ color: 'var(--incomplete-ink)' }}>
          Notes: {field.qualityNotes.join(', ')}
        </p>
      ) : null}

      <div className="doc-pane__toolbar" style={{ marginTop: '0.75rem' }}>
        {firstPage ? (
          <button className="link-button" onClick={() => onViewPage(firstPage)}>
            <span aria-hidden="true">🔍</span> View page {firstPage}
          </button>
        ) : null}
        {!correctedKey && field.state !== 'unreadable' ? (
          <button className="link-button" aria-expanded={editing} onClick={() => setEditing(!editing)}>
            {editing ? 'Close editor' : 'Correct value'}
          </button>
        ) : null}
      </div>

      {editing ? (
        <CorrectionEditor
          field={field}
          documentId={document.documentId}
          onCancel={() => setEditing(false)}
          onSave={(delta) => {
            onCorrect(delta);
            setEditing(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CorrectionEditor({
  field,
  documentId,
  onSave,
  onCancel,
}: {
  field: ExtractedField;
  documentId: string;
  onSave: (delta: CorrectionDelta) => void;
  onCancel: () => void;
}) {
  const [state, setState] = useState<ExtractedField['state']>(field.state === 'present' ? 'present' : 'present');
  const [value, setValue] = useState<NormalizedValue | null>(field.value);

  const save = () => {
    onSave({
      documentId,
      fieldKey: field.fieldKey,
      instanceId: field.instanceId,
      state,
      value: state === 'present' ? value : null,
    });
  };

  return (
    <form
      style={{
        marginTop: '0.85rem',
        padding: '1rem',
        background: 'var(--surface-elevated)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--rule)',
      }}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label className="field">
        <span className="field__label">Corrected state</span>
        <select className="select" value={state} onChange={(event) => setState(event.target.value as ExtractedField['state'])}>
          <option value="present">Present (I know the correct value)</option>
          <option value="absent">Not in the document</option>
          <option value="unclear">Unclear to me too</option>
        </select>
      </label>
      {state === 'present' ? <ValueEditor value={value} onChange={setValue} /> : null}
      <div className="doc-pane__toolbar" style={{ marginTop: '0.75rem' }}>
        <button className="button" type="submit" style={{ minHeight: '38px', padding: '0.4rem 1rem' }}>
          Save correction
        </button>
        <button className="button button--secondary" type="button" onClick={onCancel} style={{ minHeight: '38px', padding: '0.4rem 1rem' }}>
          Cancel
        </button>
      </div>
      <p className="evidence__label" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
        Saved separately from the original. The page evidence above stays as extracted.
      </p>
    </form>
  );
}

function ValueEditor({ value, onChange }: { value: NormalizedValue | null; onChange: (value: NormalizedValue | null) => void }) {
  if (!value) return <p className="evidence__label">This field had no typed value to edit.</p>;
  switch (value.kind) {
    case 'text':
    case 'reference_text':
      return (
        <label className="field">
          <span className="field__label">Corrected text</span>
          <input className="input" value={value.text} onChange={(event) => onChange({ ...value, text: event.target.value })} />
        </label>
      );
    case 'money':
      return (
        <>
          <label className="field">
            <span className="field__label">Amount (decimal, e.g. 2500.00)</span>
            <input
              className="input"
              inputMode="decimal"
              value={value.amount}
              onChange={(event) => onChange({ ...value, amount: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="field__label">Currency</span>
            <input
              className="input"
              value={value.currency ?? ''}
              onChange={(event) => onChange({ ...value, currency: event.target.value.toUpperCase() || null })}
            />
          </label>
          <label className="field">
            <span className="field__label">Frequency</span>
            <select
              className="select"
              value={value.frequency ?? ''}
              onChange={(event) => onChange({ ...value, frequency: (event.target.value || null) as typeof value.frequency })}
            >
              <option value="">Not stated</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>
        </>
      );
    case 'date':
      return (
        <label className="field">
          <span className="field__label">Corrected date (YYYY-MM-DD)</span>
          <input className="input" value={value.date} onChange={(event) => onChange({ ...value, date: event.target.value })} />
        </label>
      );
    case 'duration':
      return (
        <label className="field">
          <span className="field__label">Amount</span>
          <input className="input" value={value.amount} onChange={(event) => onChange({ ...value, amount: event.target.value })} />
        </label>
      );
    case 'benefit_state':
      return (
        <label className="field">
          <span className="field__label">Status</span>
          <select
            className="select"
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as typeof value.status })}
          >
            <option value="provided">Provided</option>
            <option value="not_provided">Not provided</option>
            <option value="allowance">Cash allowance</option>
            <option value="conditional">Conditional</option>
          </select>
        </label>
      );
    case 'boolean':
      return (
        <label className="field">
          <span className="field__label">Presence</span>
          <select
            className="select"
            value={String(value.value)}
            onChange={(event) => onChange({ ...value, value: event.target.value === 'true' })}
          >
            <option value="true">Present</option>
            <option value="false">Not present</option>
          </select>
        </label>
      );
  }
}
