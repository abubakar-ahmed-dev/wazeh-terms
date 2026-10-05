/**
 * Guide content registry (P2 D-G2): the single source for contextual copy.
 * Tooltips, legends, intros, dialogs, and the help articles render slices of
 * this registry — copy is never written twice.
 * Source text: plans/usability-guides/drafts/short-variants.md (P3,
 * review-hardened through R24). The registry integrity test enforces that
 * every id referenced by the UI exists.
 */

export interface GuideUnit {
  /** Short heading (tip trigger label, dialog title, legend title). */
  readonly title: string;
  /** Body paragraphs. */
  readonly body: readonly string[];
  /** Named deep links: [label, href] — help panel renders them as
   * "opens in a new tab" during a review; in-app navigation elsewhere. */
  readonly links?: ReadonlyArray<readonly [label: string, href: string]>;
}

export const GUIDE_UNITS: Readonly<Record<string, GuideUnit>> = {
  // ── Review step ──────────────────────────────────────────────────────
  'rev.intro': {
    title: 'What is this step?',
    body: [
      'WazehTerms read your documents and listed what it found. Check the values against the original pages — you are the checker before anything is analyzed. Corrections stay labelled as yours.',
    ],
    links: [['Read the checking guide', '/help/checking-terms']],
  },
  'rev.tip.numbering': {
    title: 'How the groups work',
    body: [
      'Groups are numbered 1–12 in a fixed order. A count chip shows how many values the group holds across your documents — not how many problems. The "need your check" marker counts unclear or unreadable values.',
    ],
  },
  'rev.legend.states': {
    title: 'What the chips mean',
    body: [
      'Found in document — read from located wording.',
      'Not found on readable pages — no wording located; not proof of absence.',
      'Unclear — found but not pinned down.',
      'Could not read — text unreadable.',
      'Counts describe what was read; corrected fields show ✎.',
    ],
    links: [['Field states in full', '/help/checking-terms#field-states']],
  },
  'rev.legend.evidence': {
    title: 'What the quote labels mean',
    body: [
      '“Text matched to PDF” = exact quote from the PDF\'s text layer.',
      '“Model transcription — check the page” = the model\'s typed reading; verify it on the page yourself.',
    ],
    links: [['Evidence quality in full', '/help/checking-terms#evidence-quality']],
  },
  'rev.tip.evidence': {
    title: 'About this quote',
    body: [
      '“Text matched to PDF” = exact quote from the PDF\'s text layer. “Model transcription — check the page” = the model\'s typed reading; verify it on the page yourself.',
    ],
  },
  'rev.tip.correction': {
    title: 'What corrections do',
    body: [
      'Choose the corrected state, enter the value the document actually shows, and save. Your value is used in the analysis and labelled as yours; the original wording and page evidence stay untouched.',
    ],
    links: [['Read the correction guide', '/help/checking-terms#corrections']],
  },
  'rev.tip.expiry': {
    title: 'About the review window',
    body: [
      'This review stays open for about 30 minutes after reading. After expiry it cannot continue — start again to read the documents afresh. WazehTerms keeps no copy of the review; the provider\'s handling is a separate matter (privacy notice).',
    ],
  },
  'rev.tip.needsCheck': {
    title: 'What “need your check” counts',
    body: [
      'This counts unclear and unreadable values. Fields marked "Not found" are not counted, but deserve a look — you may spot wording the reader missed.',
    ],
  },
  'rev.tip.draft': {
    title: 'Unsaved correction',
    body: [
      'You have an edit in progress. It stays attached to its field while you browse other groups or read help — nothing is lost.',
    ],
  },
  'rev.unreadableNote': {
    title: 'Could not be read',
    body: [
      'There is no trustworthy reading to correct against. If you can read the value on the page yourself, note it for your own decision-making and treat this term as an open question in the report.',
    ],
    links: [['Field states in full', '/help/checking-terms#field-states']],
  },

  // ── Review groups (short variants of U4 #group-*) ────────────────────
  'rev.group.employer': {
    title: 'Checking Employer',
    body: [
      'Compare the employer\'s name in each document. Abbreviations and trading names can differ, but should clearly point to the same company.',
    ],
    links: [['Detailed guide: Employer', '/help/checking-terms#group-employer']],
  },
  'rev.group.occupation': {
    title: 'Checking Occupation',
    body: [
      'Check the job title in each document. Vague titles are recorded as written; both documents should name the same role.',
    ],
    links: [['Detailed guide: Occupation', '/help/checking-terms#group-occupation']],
  },
  'rev.group.location': {
    title: 'Checking Work location',
    body: [
      'Check the stated workplace. An address or logo does not decide which rules apply — the report checks that separately.',
    ],
    links: [['Detailed guide: Work location', '/help/checking-terms#group-location']],
  },
  'rev.group.pay': {
    title: 'Checking Pay',
    body: [
      'Check basic salary, each allowance, the stated total, currency, and frequency. Parts and total can disagree. In-kind housing or food is a benefit, not pay.',
    ],
    links: [['Detailed guide: Pay', '/help/checking-terms#group-pay']],
  },
  'rev.group.term': {
    title: 'Checking Term',
    body: [
      'Check the start date, duration (fixed or open-ended), and renewal wording. Dates should agree across documents.',
    ],
    links: [['Detailed guide: Term', '/help/checking-terms#group-term']],
  },
  'rev.group.probation': {
    title: 'Checking Probation',
    body: [
      'Check the probation length stated in each document. Whether a length is allowed is a legal question — WazehTerms does not check it today; raise it with the employer.',
    ],
    links: [['Detailed guide: Probation', '/help/checking-terms#group-probation']],
  },
  'rev.group.working_time': {
    title: 'Checking Working time',
    body: [
      'Check ordinary hours and overtime wording, keeping the units as written (per day vs per week).',
    ],
    links: [['Detailed guide: Working time', '/help/checking-terms#group-working-time']],
  },
  'rev.group.ending_terms': {
    title: 'Checking Ending terms',
    body: [
      'Check the notice period and termination conditions. Wording that defers to a policy or annex is recorded as written.',
    ],
    links: [['Detailed guide: Ending terms', '/help/checking-terms#group-ending-terms']],
  },
  'rev.group.deductions': {
    title: 'Checking Deductions and worker charges',
    body: [
      'Check anything the worker pays the employer: deductions and stated charges — what, to whom, when. Not every deduction is a recruitment fee.',
    ],
    links: [['Detailed guide: Deductions', '/help/checking-terms#group-deductions']],
  },
  'rev.group.recruitment_and_travel_costs': {
    title: 'Checking Recruitment and travel costs',
    body: [
      'Check recruitment, visa, residency, medical, and travel charges — amount and stated payer, exactly as written. A Pakistan-side recruiter charge differs from a UAE employer charge.',
    ],
    links: [['Detailed guide: Recruitment and travel costs', '/help/checking-terms#group-recruitment-travel']],
  },
  'rev.group.benefits': {
    title: 'Checking Benefits',
    body: [
      'Check accommodation, food, transport, medical coverage, and tickets. Provided, denied, conditional, or silent — each is different, and silence is not denial.',
    ],
    links: [['Detailed guide: Benefits', '/help/checking-terms#group-benefits']],
  },
  'rev.group.document_details': {
    title: 'Checking Document details',
    body: [
      'Check language, signature presence, dates, and references. Recording a signature is not authenticating it.',
    ],
    links: [['Detailed guide: Document details', '/help/checking-terms#group-document-details']],
  },

  // ── Review empty groups (state-specific, R11) ────────────────────────
  'rev.empty.absent': {
    title: 'Nothing located',
    body: [
      'Nothing was located for this group on the readable pages. This is not proof a term is missing — check the pages yourself if a term here matters to you.',
    ],
  },
  'rev.empty.unresolved': {
    title: 'Could not be fully read',
    body: [
      'The values in this group could not be fully read or resolved. Each card says which — these matter for the findings report.',
    ],
  },
  'rev.empty.mixed': {
    title: 'Partly unreadable',
    body: [
      'Some values in this group could not be read or located. Each card shows its own state.',
    ],
  },
  'rev.empty.absentCard': {
    title: 'Not found',
    body: [
      'No readable wording to show — check the page yourself if this term matters to you.',
    ],
  },

  // ── Findings step ────────────────────────────────────────────────────
  'fnd.intro': {
    title: 'How to read this report',
    body: [
      'Attention items first, evidence under every claim, and no overall verdict — by design. Partial banners name exactly what did not finish.',
    ],
    links: [['Read the findings guide', '/help/reading-findings']],
  },
  'fnd.tip.status': {
    title: 'What the status means',
    body: [
      'Complete review = all relevant checks finished. Partial review = some checks did not finish, or finished without a verifiable result. The banner names which, and what remains usable. Neither status grades your documents.',
    ],
  },
  'fnd.tip.priority': {
    title: 'What priority means',
    body: [
      'Priority orders your reading: the more important items surface first across the report. It is not a risk score, danger rating, or legal weight.',
    ],
  },
  'fnd.tip.care': {
    title: 'Why we are careful here',
    body: [
      'This line marks the difference between what your documents show and what would be guessing. Precision here is a feature, not vagueness.',
    ],
  },
  'fnd.tip.citation': {
    title: 'About this citation',
    body: [
      '“Official rule” quotes written law; “Official guidance” quotes an authority\'s explanation. The label always says which one supports the concern.',
    ],
    links: [['Evidence and official sources', '/help/evidence-and-sources']],
  },
  'fnd.coverage.intro': {
    title: 'About coverage',
    body: [
      'What was checked, what could not be checked, and why. With one document, comparison is marked not applicable — nothing failed.',
    ],
  },
  'fnd.nextSteps.line': {
    title: 'Official next steps',
    body: [
      'General official resources for workers in this route. They have not seen your case, and opening them leaves WazehTerms.',
    ],
  },

  // ── Findings categories (L0 intros under section/filter context) ─────
  'fnd.cat.document_mismatch': {
    title: 'Different wording in the two documents',
    body: [
      'The same term, stated differently. Both passages are quoted with pages — judge the meaning.',
    ],
  },
  'fnd.cat.source_backed_concern': {
    title: 'Concern to check against an official source',
    body: [
      'A document term lines up with a concern supported by an approved official source — written law or official guidance, labelled on the card. The exact passage is quoted, with a link.',
    ],
  },
  'fnd.cat.missing_information': {
    title: 'Information we could not find',
    body: ['Not located on the readable pages — not a claim that it does not exist.'],
  },
  'fnd.cat.needs_clarification': {
    title: 'Question to clarify',
    body: ['Conditional or ambiguous wording worth settling with the employer before signing.'],
  },
  'fnd.cat.unable_to_determine': {
    title: 'Could not determine',
    body: ['A check could not reach a result. The card names the blocker; treat it as open, not passed.'],
  },

  // ── Findings empty states (R20 three-state logic) ────────────────────
  'fnd.empty.category': {
    title: 'Nothing flagged',
    body: ['Nothing was flagged in this category by the checks that finished.'],
  },
  'fnd.zero.clean': {
    title: 'No concern detected in the fields checked',
    body: [
      'Within the fields checked, nothing was flagged. This is not a statement that the documents are good, safe, or compliant — see What we checked for the coverage behind it.',
    ],
  },
  'fnd.zero.partial': {
    title: 'No findings were displayed',
    body: [
      'No findings were displayed because not all checks finished — see the banner above and What we checked. This is not a clean result.',
    ],
  },
  'fnd.zero.filtered': {
    title: 'No findings match the current filters',
    body: [
      'This says nothing about your documents — reset the filters to see every finding again.',
    ],
  },
  'fnd.search.scope': {
    title: 'About search',
    body: [
      'Searches this report\'s finding titles, explanations, term labels, and quoted document text. Runs in your browser — nothing is sent anywhere.',
    ],
  },

  // ── Dialogs (R18 split) ──────────────────────────────────────────────
  'dialog.leave': {
    title: 'Leave this review?',
    body: [
      'Your documents, checked values, and corrections are only in this browser session — leaving ends the review.',
    ],
  },
  'dialog.continueDraft': {
    title: 'You have an unsaved correction',
    body: [
      'Save it and your value is used in the analysis. Continue without saving and the edit is discarded — the analysis uses the extracted value.',
    ],
  },

  // ── Samples (scenario tips; keyed by scenarioTag id, not case id) ────
  'smp.scenario.consistent': {
    title: 'Consistent terms',
    body: [
      'An offer and contract that agree. Look for: a clean check, and what the report does with terms missing from BOTH documents — a consistent pair can still lack things worth asking about.',
    ],
  },
  'smp.scenario.salary': {
    title: 'Changed salary',
    body: [
      'The contract states different pay than the offer. Look for: the difference shown with both passages side by side, pages included.',
    ],
  },
  'smp.scenario.charge': {
    title: 'Worker recruitment charge',
    body: [
      'The documents state charges the worker pays for recruitment. Look for: how each document words the charge and who pays — and, if the official-source check completes and the rule verifies, a concern citing the official passage. Source checks can withhold; a withheld check is explained, not hidden.',
    ],
  },
  'smp.scenario.missing': {
    title: 'Missing notice clause',
    body: [
      'Notice and termination wording absent. Look for: how "not found" is reported — as missing information, not as a denial.',
    ],
  },
  'smp.scenario.single': {
    title: 'Single contract (abstention)',
    body: [
      'One document only. Look for: the report marking comparison not applicable instead of inventing one, and how absence is handled without a second document.',
    ],
  },
  'smp.scenario.adversarial': {
    title: 'Adversarial instructions',
    body: [
      'A document containing text that tries to instruct automated readers. Look for: whether the embedded instructions appear as document content rather than being acted on — the review is designed to treat them as text.',
    ],
  },
  'smp.intro': {
    title: 'About samples',
    body: [
      'Every employer and amount is invented. Starting one runs the real review — reading, checking, and the findings report.',
    ],
  },
  'smp.preview': {
    title: 'About previews',
    body: [
      'Preview files opens the sample\'s actual PDFs in a new tab. Preview problems never affect the review itself.',
    ],
  },

  // ── Pending screens ──────────────────────────────────────────────────
  'pending.extract.next': {
    title: 'Next',
    body: ['You will check what was read, value by value, before anything is analyzed.'],
  },
  'pending.analyze.next': {
    title: 'Next',
    body: ['The report lists what the checks found, with the evidence behind every item.'],
  },
};

/** Required ids — the integrity test fails if any of these go missing. */
export const REQUIRED_UNIT_IDS: readonly string[] = Object.keys(GUIDE_UNITS);

export function unit(id: string): GuideUnit {
  const found = GUIDE_UNITS[id];
  if (!found) throw new Error(`Unknown guide unit: ${id}`);
  return found;
}

/** Group help id for a group key. */
export function groupTipId(groupKey: string): string {
  return `rev.group.${groupKey}`;
}

/** Empty-group message id for a group's field-state mix. */
export function emptyGroupTipId(
  states: readonly ('present' | 'absent' | 'unclear' | 'unreadable')[],
): 'rev.empty.absent' | 'rev.empty.unresolved' | 'rev.empty.mixed' | null {
  if (states.length === 0) return null;
  const allAbsent = states.every((s) => s === 'absent');
  if (allAbsent) return 'rev.empty.absent';
  const anyUsable = states.some((s) => s === 'present');
  return anyUsable ? 'rev.empty.mixed' : 'rev.empty.unresolved';
}

/** Canonical four-step journey labels (P2 §1.3). */
export const JOURNEY_STEPS: readonly string[] = [
  'Choose documents',
  'Read documents',
  'Verify terms',
  'Findings report',
];
