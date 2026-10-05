/**
 * Review (P4 §6 rework): navigator rail + single-group workspace + overlay
 * document viewer. Drafts are hoisted to this component (R17/R18): opening
 * help or switching groups never prompts and never loses an edit; Continue
 * with a draft offers three explicit choices. Attention counts describe the
 * ORIGINAL extraction (P4 §6.1; R22): a corrected field leaves the count and
 * shows the ✎ chip. All contextual copy comes from content/guides; deep
 * links open the in-panel detailed guide (R31).
 */
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { unit, groupTipId } from '../content/guides';
import { ARTICLES } from '../content/articles';
import {
  ConfirmDialog,
  EvidenceQuote,
  HelpPanel,
  ArticleBody,
  Icon,
  InfoTip,
  EmptyMessage,
  StepIntro,
} from '../ui';

interface ReviewProps {
  issued: IssuedExtraction;
  previewUrls: ReadonlyArray<{ role: 'offer' | 'contract'; url: string }>;
  corrections: ReadonlyArray<CorrectionDelta>;
  onCorrect: (delta: CorrectionDelta) => void;
  onUndoCorrection: (key: string) => void;
  onContinue: () => void;
  onReset: () => void;
}

interface FieldEntry {
  document: IssuedDocument;
  field: ExtractedField;
}

type DraftState = ExtractedField['state'];

interface Draft {
  state: DraftState;
  value: NormalizedValue | null;
}

const needsCheckOriginal = (field: ExtractedField): boolean =>
  field.state === 'unclear' || field.state === 'unreadable';

const draftKey = (documentId: string, fieldKey: string, instanceId: string): string =>
  `${documentId}:${fieldKey}:${instanceId}`;

const MONEY_RE = /^\d+(\.\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** In-review guide link: opens the detailed guide in the help panel (R31). */
function PanelLink({ label, section, onOpen }: { label: string; section?: string; onOpen: (section?: string) => void }) {
  return (
    <button type="button" className="guide-link" onClick={() => onOpen(section)}>
      {label}
    </button>
  );
}

export function Review({ issued, previewUrls, corrections, onCorrect, onUndoCorrection, onContinue, onReset }: ReviewProps) {
  const [expiry, setExpiry] = useState(() => expiryLabel(issued.expiresAt));
  const expired = expiryLabel(issued.expiresAt).startsWith('This review has expired');
  useEffect(() => {
    const timer = window.setInterval(() => setExpiry(expiryLabel(issued.expiresAt)), 15000);
    return () => window.clearInterval(timer);
  }, [issued.expiresAt]);

  const [activeGroupKey, setActiveGroupKey] = useState<string>(() => {
    const firstWithFields = FIELD_GROUPS.find((group) =>
      issued.documents.some((document) =>
        document.fields.some((field) => FIELD_GROUP_OF[field.fieldKey] === group.key),
      ),
    );
    return firstWithFields?.key ?? FIELD_GROUPS[0]?.key ?? 'employer';
  });
  const [needsOnly, setNeedsOnly] = useState(false);

  // Hoisted correction drafts (R17/R18)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // Overlays
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSection, setHelpSection] = useState<string | undefined>(undefined);
  const [continueDialogOpen, setContinueDialogOpen] = useState(false);
  const [viewer, setViewer] = useState<{ role: 'offer' | 'contract'; page: number } | null>(null);
  const viewerTrigger = useRef<HTMLElement | null>(null);

  const correctionFor = (documentId: string, fieldKey: string, instanceId: string): CorrectionDelta | undefined =>
    corrections.find(
      (delta) =>
        delta.documentId === documentId && delta.fieldKey === fieldKey && delta.instanceId === instanceId,
    );

  const groupEntries = useMemo(
    () =>
      FIELD_GROUPS.map((group, index) => {
        const fields: FieldEntry[] = issued.documents.flatMap((document) =>
          document.fields
            .filter((field) => FIELD_GROUP_OF[field.fieldKey] === group.key)
            .map((field) => ({ document, field })),
        );
        const needs = fields.filter(
          ({ field, document }) =>
            needsCheckOriginal(field) && !correctionFor(document.documentId, field.fieldKey, field.instanceId),
        ).length;
        return { group, number: index + 1, fields, needs };
      }),
    [issued, corrections],
  );

  const totalNeeds = groupEntries.reduce((sum, entry) => sum + entry.needs, 0);
  const visibleGroups = needsOnly ? groupEntries.filter((entry) => entry.needs > 0) : groupEntries;
  const activeEntry = groupEntries.find((entry) => entry.group.key === activeGroupKey) ?? groupEntries[0];

  const draftKeys = Object.keys(drafts);
  const draftGroupLabel = (key: string): string => {
    const fieldKey = key.split(':')[1] ?? '';
    const groupKey = fieldKey ? FIELD_GROUP_OF[fieldKey] : undefined;
    return FIELD_GROUPS.find((group) => group.key === groupKey)?.heading ?? fieldKey;
  };

  const saveDraft = (key: string, draft: Draft) => {
    const [documentId = '', fieldKey = '', instanceId = ''] = key.split(':');
    onCorrect({ documentId, fieldKey, instanceId, state: draft.state, value: draft.state === 'present' ? draft.value : null });
    setDrafts((existing) => {
      const next = { ...existing };
      delete next[key];
      return next;
    });
  };

  const dropDraft = (key: string) => {
    setDrafts((existing) => {
      const next = { ...existing };
      delete next[key];
      return next;
    });
  };

  const openHelp = (sectionId?: string) => {
    setHelpSection(sectionId);
    setHelpOpen(true);
  };

  const openViewer = (role: 'offer' | 'contract', page: number | null, trigger: HTMLElement | null) => {
    viewerTrigger.current = trigger;
    setViewer({ role, page: page ?? 1 });
  };

  const closeViewer = () => {
    setViewer(null);
    window.setTimeout(() => viewerTrigger.current?.focus(), 0);
  };

  const handleContinue = () => {
    if (draftKeys.length > 0) {
      setContinueDialogOpen(true);
      return;
    }
    onContinue();
  };

  return (
    <div className="view">
      <div className="view__inner view__inner--wide">
        <header className="review-header-bar">
          <div>
            <span className="eyebrow">Step 3 of 4 · Verify terms</span>
            <h1 tabIndex={-1}>Check what we read</h1>
            <p style={{ margin: 0 }}>Compare each value with the original page. Your changes stay labelled as yours.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="chip" role="status">
              <Icon name="clock" size={14} /> {expiry}
              <InfoTip label="About the review window" unit={unit('rev.tip.expiry')} />
            </span>
            {totalNeeds > 0 ? (
              <span className="needs-check">
                {totalNeeds} field{totalNeeds === 1 ? '' : 's'}{' '}
                {totalNeeds === 1 ? 'needs' : 'need'} your check
                <InfoTip label="What need your check counts" unit={unit('rev.tip.needsCheck')} />
              </span>
            ) : (
              <span className="chip chip--state-found">
                <Icon name="check" size={14} /> Clean extraction
              </span>
            )}
            {draftKeys.length > 0 ? (
              <button
                type="button"
                className="chip chip--draft"
                title={unit('rev.tip.draft').title}
                onClick={() => {
                  const fieldKey = draftKeys[0]?.split(':')[1] ?? '';
                  const groupKey = fieldKey ? FIELD_GROUP_OF[fieldKey] : undefined;
                  if (groupKey) setActiveGroupKey(groupKey);
                }}
              >
                ✎ {draftKeys.length} unsaved edit{draftKeys.length === 1 ? '' : 's'} ·{' '}
                {draftGroupLabel(draftKeys[0] ?? '')}
              </button>
            ) : null}
          </div>
        </header>

        {expired ? (
          <div className="notice notice--error" role="alert">
            <span className="notice__title">This review can no longer be continued.</span>
            <p>The time window for this extraction ended. Start again to get a fresh review.</p>
            <button type="button" className="button" onClick={onReset}>
              Start over
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {previewUrls.map((entry) => (
                <button
                  key={entry.role}
                  type="button"
                  className="button button--secondary"
                  onClick={(event) => openViewer(entry.role, null, event.currentTarget)}
                >
                  Open {roleLabel(entry.role).toLowerCase()} document
                </button>
              ))}
            </div>

            <StepIntro title={unit('rev.intro').title}>
              {unit('rev.intro').body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
              {unit('rev.intro').links?.map(([label, href]) => (
                <PanelLink
                  key={href}
                  label={label}
                  section={href.includes('#') ? href.split('#')[1] : undefined}
                  onOpen={openHelp}
                />
              ))}
            </StepIntro>

            <details className="step-intro">
              <summary className="step-intro__summary">
                <Icon name="chevron" size={14} />
                <span>What the chips mean</span>
              </summary>
              <div className="step-intro__content">
                <div className="legend">
                  {unit('rev.legend.states').body.map((line) => (
                    <p key={line.slice(0, 24)}>{line}</p>
                  ))}
                  <PanelLink label="Field states in full" section="field-states" onOpen={openHelp} />
                  <p className="legend__sub">{unit('rev.legend.evidence').body.join(' ')}</p>
                  <PanelLink label="Evidence quality in full" section="evidence-quality" onOpen={openHelp} />
                </div>
              </div>
            </details>

            <div className="review-layout">
              <nav className="group-nav" aria-label="Field groups">
                <div className="group-nav__toggle" role="group" aria-label="Group filter">
                  <button
                    type="button"
                    className={`button ${!needsOnly ? 'button--secondary' : 'button--ghost'}`}
                    aria-pressed={!needsOnly}
                    onClick={() => setNeedsOnly(false)}
                  >
                    All groups
                  </button>
                  <button
                    type="button"
                    className={`button ${needsOnly ? 'button--secondary' : 'button--ghost'}`}
                    aria-pressed={needsOnly}
                    onClick={() => setNeedsOnly(true)}
                    disabled={totalNeeds === 0}
                  >
                    Needs attention ({totalNeeds})
                  </button>
                </div>
                <ol className="group-nav__list">
                  {visibleGroups.map((entry) => (
                    <li key={entry.group.key}>
                      <button
                        type="button"
                        className={`group-nav__item ${entry.group.key === activeGroupKey ? 'group-nav__item--active' : ''}`}
                        aria-current={entry.group.key === activeGroupKey || undefined}
                        onClick={() => setActiveGroupKey(entry.group.key)}
                      >
                        <span className="group-nav__num">{entry.number}</span>
                        <span className="group-nav__name">{entry.group.heading}</span>
                        {entry.needs > 0 ? (
                          <span className="needs-check">{entry.needs}</span>
                        ) : (
                          <span className="chip">{entry.fields.length}</span>
                        )}
                      </button>
                    </li>
                  ))}
                  {visibleGroups.length === 0 ? <li className="group-nav__empty">No groups need attention.</li> : null}
                </ol>
              </nav>

              <div className="review-workspace">
                {activeEntry ? (
                  <>
                    <div className="review-workspace__head">
                      <h2>
                        Group {activeEntry.number} of {FIELD_GROUPS.length} — {activeEntry.group.heading}
                      </h2>
                      <InfoTip
                        label={`About ${activeEntry.group.heading}`}
                        unit={unit(groupTipId(activeEntry.group.key))}
                      />
                      <PanelLink
                        label="Detailed guide"
                        section={groupAnchor(activeEntry.group.key)}
                        onOpen={openHelp}
                      />
                    </div>
                    {activeEntry.fields.length === 0 ? (
                      <EmptyMessage message={unit('rev.empty.absent').body[0] ?? ''} />
                    ) : (
                      activeEntry.fields.map(({ document, field }, index) => {
                        const key = draftKey(document.documentId, field.fieldKey, field.instanceId);
                        return (
                          <FieldCard
                            key={`${document.documentId}:${field.instanceId}`}
                            number={`${activeEntry.number}.${index + 1}`}
                            field={field}
                            document={document}
                            corrected={correctionFor(document.documentId, field.fieldKey, field.instanceId)}
                            draft={drafts[key]}
                            onDraft={(draft) =>
                              setDrafts((existing) => ({
                                ...existing,
                                [key]: draft,
                              }))
                            }
                            onDraftCancel={() => dropDraft(key)}
                            onSaveDraft={(draft) => saveDraft(key, draft)}
                            onUndo={() => onUndoCorrection(key)}
                            onOpenPage={(page, trigger) => openViewer(document.role, page, trigger)}
                          />
                        );
                      })
                    )}
                  </>
                ) : null}

                <div
                  style={{
                    marginTop: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    className="button button--full"
                    onClick={handleContinue}
                    style={{ maxWidth: '28rem' }}
                  >
                    <span>Continue to findings</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  <button type="button" className="link-button" onClick={onReset}>
                    Start over with a different document
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {viewer ? (
        <div className="doc-viewer" role="dialog" aria-modal={false} aria-label="Original document">
          <div className="doc-viewer__toolbar">
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {previewUrls.map((entry) => (
                <button
                  key={entry.role}
                  type="button"
                  className={`button ${viewer.role === entry.role ? 'button--secondary' : 'button--ghost'}`}
                  aria-pressed={viewer.role === entry.role}
                  onClick={() => setViewer({ role: entry.role, page: 1 })}
                >
                  {roleLabel(entry.role)}
                </button>
              ))}
            </div>
            <span className="chip" style={{ marginLeft: 'auto' }}>
              Page {viewer.page}
            </span>
            <button type="button" className="link-button" autoFocus onClick={closeViewer} style={{ fontSize: '0.85rem' }}>
              Close viewer
            </button>
          </div>
          <iframe
            title={`${roleLabel(viewer.role)} document, page ${viewer.page}`}
            src={`${previewUrls.find((entry) => entry.role === viewer.role)?.url ?? ''}#page=${viewer.page}`}
          />
        </div>
      ) : null}

      <HelpPanel open={helpOpen} title="Checking terms — detailed guide" onClose={() => setHelpOpen(false)}>
        <ArticleBody article={ARTICLES['checking-terms'] ?? ARTICLES['reading-findings']!} focusSection={helpSection} />
      </HelpPanel>

      {continueDialogOpen ? (
        <ConfirmDialog
          title={unit('dialog.continueDraft').title}
          body={`${unit('dialog.continueDraft').body[0]} (${draftKeys.length} unsaved edit${draftKeys.length === 1 ? '' : 's'})`}
          safeIndex={0}
          actions={[
            { label: 'Keep editing', kind: 'primary', onChoose: () => setContinueDialogOpen(false) },
            {
              label: 'Save correction and continue',
              kind: 'secondary',
              onChoose: () => {
                for (const key of draftKeys) {
                  const draft = drafts[key];
                  if (draft) saveDraft(key, draft);
                }
                setContinueDialogOpen(false);
                onContinue();
              },
            },
            {
              label: 'Continue without saving',
              kind: 'danger',
              onChoose: () => {
                for (const key of draftKeys) dropDraft(key);
                setContinueDialogOpen(false);
                onContinue();
              },
            },
          ]}
        />
      ) : null}
    </div>
  );
}

/** U4 anchor id for a group key (articles.ts section ids). */
function groupAnchor(groupKey: string): string {
  const map: Record<string, string> = {
    employer: 'group-employer',
    occupation: 'group-occupation',
    location: 'group-location',
    pay: 'group-pay',
    term: 'group-term',
    probation: 'group-probation',
    working_time: 'group-working-time',
    ending_terms: 'group-ending-terms',
    deductions: 'group-deductions',
    recruitment_and_travel_costs: 'group-recruitment-travel',
    benefits: 'group-benefits',
    document_details: 'group-document-details',
  };
  return map[groupKey] ?? 'the-workspace';
}

interface FieldCardProps {
  number: string;
  field: ExtractedField;
  document: IssuedDocument;
  corrected?: CorrectionDelta;
  draft?: Draft;
  onDraft: (draft: Draft) => void;
  onDraftCancel: () => void;
  onSaveDraft: (draft: Draft) => void;
  onUndo: () => void;
  onOpenPage: (page: number, trigger: HTMLElement | null) => void;
}

function FieldCard({
  number,
  field,
  document,
  corrected,
  draft,
  onDraft,
  onDraftCancel,
  onSaveDraft,
  onUndo,
  onOpenPage,
}: FieldCardProps) {
  const [editing, setEditing] = useState(false);
  const label = FIELD_LABELS[field.fieldKey] ?? field.fieldKey;
  const firstPage = field.evidence[0]?.page;

  if (corrected) {
    return (
      <article className="fieldcard fieldcard--corrected">
        <div className="fieldcard__head">
          <span className="fieldcard__num">{number}</span>
          <span className="fieldcard__name">{label}</span>
          <span className="chip chip--corrected">✎ Corrected by you</span>
          <span className={`chip ${document.role === 'offer' ? 'chip--offer' : 'chip--contract'}`}>
            {roleLabel(document.role)}
          </span>
        </div>
        <p className="typed-value typed-value--effective">
          <strong>Your correction — used for analysis: </strong>
          {corrected.value ? formatValue(corrected.value) : STATE_LABELS[corrected.state]}
        </p>
        <div className="fieldcard__original">
          <p className="typed-value">
            <strong>Read as: </strong>
            {field.value && field.state === 'present' ? formatValue(field.value) : '—'}
          </p>
          {field.rawText ? (
            <p className="typed-value">
              <strong>As written: </strong>
              {field.rawText}
            </p>
          ) : null}
          {field.evidence.map((evidence) => (
            <EvidenceQuote key={`${evidence.page}:${evidence.quote.slice(0, 12)}`} evidence={evidence} />
          ))}
        </div>
        <div className="doc-pane__toolbar">
          <button type="button" className="link-button" onClick={onUndo}>
            Remove correction
          </button>
        </div>
      </article>
    );
  }

  const editorOpen = editing || draft !== undefined;
  const isAbsent = field.state === 'absent' && !editorOpen;

  return (
    <article className={`fieldcard ${isAbsent ? 'fieldcard--absent' : ''}`}>
      <div className="fieldcard__head">
        <span className="fieldcard__num">{number}</span>
        <span className="fieldcard__name">{label}</span>
        <span className={STATE_CHIP_CLASS[field.state]}>{STATE_LABELS[field.state]}</span>
        <span className={`chip ${document.role === 'offer' ? 'chip--offer' : 'chip--contract'}`}>
          {roleLabel(document.role)}
        </span>
      </div>

      {isAbsent ? (
        <>
          <p className="fieldcard__hint">{unit('rev.empty.absentCard').body[0] ?? ''}</p>
          <div className="doc-pane__toolbar">
            {firstPage ? (
              <button
                type="button"
                className="link-button"
                onClick={(event) => onOpenPage(firstPage, event.currentTarget)}
              >
                <Icon name="search" size={14} /> View page {firstPage}
              </button>
            ) : null}
            <button type="button" className="link-button" onClick={() => setEditing(true)}>
              Correct value
            </button>
          </div>
        </>
      ) : (
        <>
          {field.rawText ? (
            <p className="typed-value">
              <strong>As written: </strong>
              {field.rawText}
            </p>
          ) : null}
          {field.value && field.state === 'present' ? (
            <p className="typed-value typed-value--primary">
              <strong>Read as: </strong>
              {formatValue(field.value)}
            </p>
          ) : null}
          {field.state === 'unreadable' ? <p className="fieldcard__hint">{unit('rev.unreadableNote').body[0] ?? ''}</p> : null}
          {field.evidence.map((evidence) => (
            <EvidenceQuote key={`${evidence.page}:${evidence.quote.slice(0, 12)}`} evidence={evidence} />
          ))}
          {field.qualityNotes.length > 0 ? (
            <p className="evidence__label" style={{ color: 'var(--incomplete-ink)' }}>
              Notes: {field.qualityNotes.join(', ')}
            </p>
          ) : null}
          <div className="doc-pane__toolbar">
            {firstPage ? (
              <button type="button" className="link-button" onClick={(event) => onOpenPage(firstPage, event.currentTarget)}>
                <Icon name="search" size={14} /> View page {firstPage}
              </button>
            ) : null}
            {field.state !== 'unreadable' ? (
              <button
                type="button"
                className="link-button"
                aria-expanded={editorOpen}
                onClick={() => {
                  if (draft !== undefined && editing) {
                    onDraftCancel();
                  }
                  setEditing(!editing);
                }}
              >
                {editorOpen ? 'Close editor' : 'Correct value'}
              </button>
            ) : null}
          </div>
          {editorOpen ? (
            <CorrectionEditor
              field={field}
              draft={draft}
              onDraft={onDraft}
              onCancel={() => {
                onDraftCancel();
                setEditing(false);
              }}
              onSave={(saved) => {
                onSaveDraft(saved);
                setEditing(false);
              }}
            />
          ) : null}
        </>
      )}
    </article>
  );
}

interface CorrectionEditorProps {
  field: ExtractedField;
  draft?: Draft;
  onDraft: (draft: Draft) => void;
  onCancel: () => void;
  onSave: (draft: Draft) => void;
}

function CorrectionEditor({ field, draft, onDraft, onCancel, onSave }: CorrectionEditorProps) {
  const [state, setState] = useState<DraftState>(
    draft?.state ?? (field.state === 'absent' ? 'absent' : 'present'),
  );
  const [value, setValue] = useState<NormalizedValue | null>(draft?.value ?? field.value);
  const [error, setError] = useState<string | null>(null);

  const changeState = (nextState: DraftState) => {
    setState(nextState);
    onDraft({ state: nextState, value: nextState === 'present' ? value : null });
  };

  const changeValue = (nextValue: NormalizedValue | null) => {
    setValue(nextValue);
    onDraft({ state, value: nextValue });
  };

  const save = () => {
    if (state === 'present') {
      if (!value) {
        setError('This field had no typed value to edit — choose a different corrected state.');
        return;
      }
      if (value.kind === 'money' && !MONEY_RE.test(value.amount)) {
        setError('Enter the amount as a decimal number, for example 2500.00.');
        return;
      }
      if (value.kind === 'date' && !DATE_RE.test(value.date)) {
        setError('Enter the date as YYYY-MM-DD.');
        return;
      }
    }
    setError(null);
    onSave({ state, value: state === 'present' ? value : null });
  };

  return (
    <form
      className="correction-editor"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label className="field">
        <span className="field__label">Corrected state</span>
        <select className="select" value={state} onChange={(event) => changeState(event.target.value as DraftState)}>
          <option value="present">Present (I know the correct value)</option>
          <option value="absent">Not in the document</option>
          <option value="unclear">Unclear to me too</option>
        </select>
      </label>
      {state === 'present' ? <ValueEditor value={value} onChange={changeValue} /> : null}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="doc-pane__toolbar">
        <button type="submit" className="button" style={{ minHeight: '38px', padding: '0.4rem 1rem' }}>
          Save correction
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          style={{ minHeight: '38px', padding: '0.4rem 1rem' }}
        >
          Cancel
        </button>
      </div>
      <p className="evidence__label" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
        Saved separately from the original. The page evidence above stays as extracted. Your edit stays open while you
        browse other groups or read help.
      </p>
    </form>
  );
}

function ValueEditor({
  value,
  onChange,
}: {
  value: NormalizedValue | null;
  onChange: (value: NormalizedValue | null) => void;
}) {
  if (!value)
    return <p className="evidence__label">This field had no typed value to edit — choose a different corrected state.</p>;
  switch (value.kind) {
    case 'text':
    case 'reference_text':
      return (
        <label className="field">
          <span className="field__label">Corrected text</span>
          <input
            className="input"
            value={value.text}
            onChange={(event) => onChange({ ...value, text: event.target.value })}
          />
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
              onChange={(event) =>
                onChange({ ...value, frequency: (event.target.value || null) as typeof value.frequency })
              }
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
          <input
            className="input"
            value={value.amount}
            onChange={(event) => onChange({ ...value, amount: event.target.value })}
          />
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
