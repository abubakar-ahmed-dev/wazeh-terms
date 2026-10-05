/**
 * Pilot article content (R31 rule): every /help link shipped in the guide
 * registry must resolve to a served section at full-section depth. Source of
 * truth: plans/usability-guides/drafts/u4/u5/u6/u8 (review-hardened through
 * R1–R16). Short variants stay contextual-only; they are never link targets.
 * The help hub full build (U1–U3, U7 + hub pages) is P7.
 */

export type ArticleBlock =
  | { readonly type: 'p'; readonly text: string }
  | { readonly type: 'bullets'; readonly items: readonly string[] }
  | {
      readonly type: 'table';
      readonly headers: readonly string[];
      readonly rows: readonly (readonly string[])[];
    };

export interface ArticleSection {
  readonly id: string;
  readonly heading: string;
  readonly blocks: readonly ArticleBlock[];
}

export interface Article {
  readonly slug: string;
  readonly title: string;
  readonly intro: readonly string[];
  readonly sections: readonly ArticleSection[];
}

const p = (text: string): ArticleBlock => ({ type: 'p', text });
const bullets = (items: string[]): ArticleBlock => ({ type: 'bullets', items });

const CHECKING_TERMS: Article = {
  slug: 'checking-terms',
  title: 'Checking and correcting extracted terms',
  intro: [
    'WazehTerms has read your documents and listed what it found. Before anything is analyzed, you check that list against the original pages. This guide explains every part of that check.',
  ],
  sections: [
    {
      id: 'why-this-step',
      heading: 'Why this step exists',
      blocks: [
        p(
          'Extraction is done by an AI model. It reads quickly, but it can misread a number, miss a clause on a crowded page, or write down something ambiguous. You are the checker. Nothing you see here has been analyzed yet — the findings report is built from the values that survive your check.',
        ),
        p('Corrections stay labelled as yours. The original wording and page evidence are never changed.'),
      ],
    },
    {
      id: 'the-workspace',
      heading: 'The workspace',
      blocks: [
        p('The screen has two areas:'),
        bullets([
          'The group list — the terms WazehTerms read, sorted into 12 groups such as Pay, Term, and Benefits. Each group heading shows how many values it holds, and a "need your check" marker when something is unclear or could not be read. The counts are per-document values, not problem counts.',
          'The document viewer — opens the original PDF pages, per document, with a page selector. Fields with located evidence have a "View page" link that opens the page their quote came from; values with no located evidence have no page to open.',
        ]),
        p('At the top you can see how long the review stays open (see Review expiry below).'),
      ],
    },
    {
      id: 'field-states',
      heading: 'Field states',
      blocks: [
        {
          type: 'table',
          headers: ['Chip', 'Meaning'],
          rows: [
            ['Found in document', 'A value was read and typed from located wording.'],
            [
              'Not found on readable pages',
              'No wording for this term was located. This is not proof that the term does not exist — it may sit on a page that could not be read, or be phrased unusually.',
            ],
            ['Unclear', 'Wording was found, but its meaning or value could not be pinned down.'],
            [
              'Could not read',
              'The text was physically unreadable (for example, a damaged or low-quality scan area).',
            ],
          ],
        },
        p(
          '"Not found" and "Could not read" are different situations, and the report treats them differently. When a field shows "Not found", it is worth a quick look at the document yourself before continuing — you know your documents; WazehTerms knows only what it could read.',
        ),
      ],
    },
    {
      id: 'evidence-quality',
      heading: 'Evidence quality',
      blocks: [
        p('Every quoted passage carries a label:'),
        bullets([
          'Text matched to PDF — the quoted words were matched to the PDF\'s own text layer. The quote is exact.',
          'Model transcription — check the page — the model typed out what it saw but could not match it to the text layer. The wording may not be character-perfect. Use "View page" and compare with your own eyes.',
        ]),
        p(
          'A matched quote is exact wording, not a correct interpretation — a value can be quoted perfectly and still need your correction.',
        ),
      ],
    },
    {
      id: 'needs-attention',
      heading: '"Need your check"',
      blocks: [
        p(
          'The counter counts fields in the Unclear and Could not read states. Fields marked "Not found" are not counted — but as above, they deserve a look. "Clean extraction" means nothing was unclear or unreadable; it is not a statement that every value is correct.',
        ),
      ],
    },
    {
      id: 'group-employer',
      heading: 'Employer',
      blocks: [
        p(
          "Check the employer's name in each document. Abbreviations and trading names can differ without being wrong, but they should clearly point to the same company. Two substantially different names are worth a closer look — and remember: corrections fix extraction errors. If the documents genuinely name different entities, leave both values as extracted so the report can surface the difference, and ask the employer instead.",
        ),
        p('When nothing usable shows: no employer name was located on the readable pages — check the letterhead yourself.'),
      ],
    },
    {
      id: 'group-occupation',
      heading: 'Occupation',
      blocks: [
        p(
          'Check the job title or occupation in each document. A vague title ("Staff", "Worker") is recorded as written; vagueness is not an extraction error. Check both documents name the same role.',
        ),
        p('When nothing usable shows: no title was located; look at the offer\'s subject line or the contract\'s position clause.'),
      ],
    },
    {
      id: 'group-location',
      heading: 'Work location',
      blocks: [
        p(
          'Check the stated workplace (city, emirate). Where you will work matters, but an address or a company logo alone does not decide which rules apply to the contract — the findings report checks that separately.',
        ),
        p('When nothing usable shows: no location wording was found; check the place-of-work clause yourself.'),
      ],
    },
    {
      id: 'group-pay',
      heading: 'Pay',
      blocks: [
        p('This group holds basic salary, allowance items, the stated total pay, and the payment frequency. Check:'),
        bullets([
          'basic salary and each allowance against the page (amounts, currency);',
          'whether the parts and the stated total agree, when a total is given;',
          'the payment frequency (monthly, yearly…) in each document;',
          'conditional amounts — keep conditions as written ("subject to performance");',
          'repeated allowances appear as separate cards, one per item.',
        ]),
        p(
          'A common trap: housing or food given in kind ("shared housing provided") is a benefit, not a salary component — it belongs in Benefits, not Pay.',
        ),
        p('When nothing usable shows: no pay wording was located on the readable pages — verify the salary clause yourself before continuing.'),
      ],
    },
    {
      id: 'group-term',
      heading: 'Term',
      blocks: [
        p(
          'Check the start date, the contract duration (fixed term or open-ended), and any renewal wording. Dates should agree across documents. Do not assume a missing date — if you can see it on the page, correct the value; if you are not sure, leave it and let the report flag it.',
        ),
        p('When nothing usable shows: no term wording was located.'),
      ],
    },
    {
      id: 'group-probation',
      heading: 'Probation',
      blocks: [
        p(
          'Check the probation length stated in each document and any wording about extension. Whether a stated probation period is allowed is a legal question — WazehTerms does not check it today, so raise it with the employer or a qualified source before signing. Here, only check what is written.',
        ),
        p('When nothing usable shows: no probation clause was located — some contracts genuinely have none.'),
      ],
    },
    {
      id: 'group-working-time',
      heading: 'Working time',
      blocks: [
        p('Check ordinary daily or weekly hours and any overtime wording. Keep the units as written (hours per day vs per week).'),
        p('When nothing usable shows: no hours wording was located; check the working-hours clause.'),
      ],
    },
    {
      id: 'group-ending-terms',
      heading: 'Ending terms',
      blocks: [
        p(
          'Check the notice period and termination conditions in each document. Wording that defers to "company policy" or an annex is recorded as written — the report may raise it as a question to clarify.',
        ),
        p('When nothing usable shows: no notice or termination wording was located; this is common in short offer letters and is worth confirming yourself.'),
      ],
    },
    {
      id: 'group-deductions',
      heading: 'Deductions and worker charges',
      blocks: [
        p(
          'Check anything the worker pays to the employer: salary deductions and other stated charges. Note what is charged, to whom, and when. Not every deduction is a recruitment fee — keep the document\'s own wording and let the categories stay separate.',
        ),
        p('When nothing usable shows: no deduction or worker-charge wording was located.'),
      ],
    },
    {
      id: 'group-recruitment-travel',
      heading: 'Recruitment and travel costs',
      blocks: [
        p(
          'Check recruitment cost, visa, residency, medical, and travel charges. For each: the amount and the stated payer — who pays whom, as the document words it. A charge paid to a recruiter in Pakistan and a charge paid to the UAE employer are read differently by the report; the stated payer is what makes the difference, so keep it exactly as written.',
        ),
        p('When nothing usable shows: no cost wording was located — verify the cost clauses yourself; these are easy to miss on crowded pages.'),
      ],
    },
    {
      id: 'group-benefits',
      heading: 'Benefits',
      blocks: [
        p(
          'Check accommodation, food, transport, medical coverage, and travel or return tickets. Each benefit has a state: provided, not provided, given as a cash allowance, or conditional ("after probation"). A benefit the document never mentions is silent — that is a different situation from "not provided", and the report treats it that way.',
        ),
        p(
          'When nothing usable shows: check the state chips before concluding anything — no located wording (silence), an unreadable page, and an unclear clause are different situations, and the report treats them differently. Silence about a benefit is worth noticing before you sign.',
        ),
      ],
    },
    {
      id: 'group-document-details',
      heading: 'Document details',
      blocks: [
        p(
          'Check the document language, signature presence, document date, document and verification references, and annex references. These are recorded facts, not checks: recording that a signature line exists does not authenticate the signature.',
        ),
        p('When nothing usable shows: the detail was not located on the readable pages.'),
      ],
    },
    {
      id: 'corrections',
      heading: 'Corrections',
      blocks: [
        p(
          'Corrections fix extraction errors — cases where the reading got your document wrong. If the documents genuinely differ, leave the values as extracted: a real difference should reach the report, not be edited away.',
        ),
        p('If a value was misread and you can see the truth on the page, correct it:'),
        bullets([
          'Open Correct value on the field card.',
          'Choose the corrected state: Present (I know the correct value) — enter the value the document actually shows; Not in the document — you checked the pages and this term is not there; Unclear to me too — you are not sure either; the report will treat the uncertainty honestly.',
          'Save correction. The card now shows your value labelled as your correction, next to the untouched original wording.',
        ]),
        p(
          'Fields in the Could not read state offer no correction control: there is no trustworthy reading to correct against. If you can read the value on the page yourself, note it for your own decision-making and treat that term as an open question in the report.',
        ),
        p('Removing a correction restores the extracted value. Nothing is deleted — the original extraction and page evidence stay exactly as read.'),
        p('What a correction does and does not do:'),
        bullets([
          'Your correction is used in the analysis and labelled as yours in the findings report.',
          'A correction on its own can never become a confirmed document difference — the report says clearly when part of a difference comes from you.',
          'The original evidence stays on the card, so the analysis and the report can always show both versions.',
        ]),
      ],
    },
    {
      id: 'expiry',
      heading: 'Review expiry',
      blocks: [
        p(
          'A review stays open for about 30 minutes after the documents were read. The timer at the top shows the remaining time. If it expires, the review can no longer be continued — start again to read the documents afresh. Nothing needs saving beyond the review itself: your corrections live inside the review and end with it. WazehTerms keeps no copy of your review; the provider\'s separate handling is described in the privacy notice.',
        ),
        p('Opening this guide does not pause the timer.'),
      ],
    },
    {
      id: 'continue',
      heading: 'Continuing',
      blocks: [
        p(
          'Continue to findings sends your checked values — plus any corrections — to the analysis step, where the written terms are compared and approved official sources are checked where they apply. See Reading your findings report.',
        ),
      ],
    },
  ],
};

const READING_FINDINGS: Article = {
  slug: 'reading-findings',
  title: 'Reading your findings report',
  intro: [
    'The report lists what the checks found, shows the evidence behind every item, and says plainly what could not be checked. It never grades your documents and never tells you a contract is safe or unsafe — that is a design rule, not a missing feature.',
  ],
  sections: [
    {
      id: 'report-anatomy',
      heading: 'Report anatomy',
      blocks: [
        p('Top to bottom:'),
        bullets([
          'Status line — Complete review (all relevant checks finished) or Partial review (some checks did not finish, or finished without a verifiable result), with the review time and the documents reviewed.',
          'Partial review banner — when the review is partial: what did not finish, and what remains usable.',
          'What needs your attention — the findings, important items first, with search and filters.',
          'Finding cards — grouped by priority, each showing its category.',
          'What we checked — coverage: stages, fields checked, fields that could not be read, omitted checks.',
          'Official next steps — general official resources.',
        ]),
      ],
    },
    {
      id: 'attention-first',
      heading: 'Attention first',
      blocks: [
        p(
          'Items are ordered so the important ones surface first, using a priority marker on each card. Priority means reading order, nothing more — it is not a risk score, a danger rating, or a legal weight. A "Low priority" item is not a safe item, and "High priority" does not mean illegal.',
        ),
      ],
    },
    {
      id: 'document-differences',
      heading: 'Different wording in the two documents',
      blocks: [
        p(
          'The offer and the contract state the same term differently — for example, two different salary figures. Each card shows the two passages side by side, with the document, page, and exact wording for both. Read both quotes yourself; the comparison is mechanical (same term, different values), so the meaning of the difference is yours to judge.',
        ),
        p(
          'If part of a difference comes from your correction, the card says so — a correction is never presented as confirmed document wording.',
        ),
      ],
    },
    {
      id: 'source-backed-concerns',
      heading: 'Concern to check against an official source',
      blocks: [
        p(
          'A document fact lines up with a concern supported by an approved official source — written law or an authority\'s guidance — and the card shows the full chain: what your document says, what the official source says (with the exact article or clause quoted), who the responsible party is, and a link to the official source. Two labels matter:',
        ),
        bullets([
          'Official rule — written law: a decree-law, its article, its clause.',
          "Official guidance — an authority's explanatory page. Helpful, but not the law itself. The card always says which one supports the concern.",
        ]),
        p(
          'Read the "what remains unknown" wording carefully. When the documents show a charge but cannot show who ultimately collected it, the concern says exactly that — it will not stretch the rule further than the evidence goes.',
        ),
      ],
    },
    {
      id: 'missing-information',
      heading: 'Information we could not find',
      blocks: [
        p(
          'A term was not located on the readable pages. This is not a claim that the term does not exist — check the field states in the checking guide for why. Check the What we checked section: if pages could not be read, a "missing" term may be hiding there. This is often the most actionable category: ask for the term in writing before you sign.',
        ),
      ],
    },
    {
      id: 'questions-to-clarify',
      heading: 'Question to clarify',
      blocks: [
        p(
          'The documents contain something conditional or ambiguous — a term that depends on a policy annex, or wording that needs the employer\'s clarification. Each card carries a suggested question. Use it as a starting point and adjust it to your situation.',
        ),
      ],
    },
    {
      id: 'could-not-determine',
      heading: 'Could not determine',
      blocks: [
        p(
          'A check could not reach a result — an unreadable page, or a scope or evidence gap. The card names the blocker. Treat these as open items, not as passed checks.',
        ),
      ],
    },
    {
      id: 'corrections-in-report',
      heading: 'Corrections in the report',
      blocks: [
        p(
          'When your correction shaped a finding, the card is explicit about it. The rule behind the product: your word is evidence about what you see, and it is labelled as yours everywhere it appears.',
        ),
      ],
    },
    {
      id: 'citations',
      heading: 'Citations',
      blocks: [
        p(
          'A citation is only shown when the full chain held: the rule record is approved and current, the exact source version is verified, the pinpoint (article, clause, quoted passage) matches, and the scope and dates apply. The card shows the issuing authority, the pinpoint quote, the in-force date, and when the source was last checked — plus a link that leaves WazehTerms.',
        ),
        p(
          "If a source link does not open, the citation's details stay on the card. A broken link neither proves nor disproves anything — keep the reference and try the authority's site.",
        ),
      ],
    },
    {
      id: 'partial-reports',
      heading: 'Partial reports',
      blocks: [
        p('A partial review is honest bookkeeping, not a failure hidden in a footnote. The banner names the reason. Common ones:'),
        bullets([
          'some checks did not complete (a stage failed or timed out);',
          'possible official-source concerns were withheld because the rule could not be fully verified against its approved source — the document findings below still stand;',
          'source checking is unavailable in this deployment.',
        ]),
        p(
          'Withheld means the conclusion was not established — the check could not demonstrate it to the standard this product requires. A withheld candidate concern is neither confirmed nor disproven, and it is not displayed. When candidates are withheld, the report says how many were withheld and why, and the rest of the report remains usable.',
        ),
      ],
    },
    {
      id: 'coverage',
      heading: 'What we checked (coverage)',
      blocks: [
        p('The coverage section answers three questions: what was checked, what could not be checked, and why.'),
        bullets([
          'Processing stages — each stage shows finished / partial / failed / not applicable. With one document, comparison shows Not applicable — only one document supplied: nothing failed, there was simply nothing to compare.',
          'Fields checked — the terms the checks covered.',
          'Could not read — terms on unreadable text.',
          'Omitted checks — checks not performed, with the reason.',
        ]),
      ],
    },
    {
      id: 'zero-findings',
      heading: 'Zero findings',
      blocks: [
        p('Two different zeros, and the report does not confuse them:'),
        bullets([
          'Everything relevant finished, nothing flagged: the report says "No concern detected in the fields checked." Read the sentence carefully — it is scoped on purpose. It does not mean the documents are good, safe, or compliant. It means: within the fields checked, nothing was flagged.',
          'Nothing displayed because checks did not finish (failed stages, withheld candidates): the report says so directly — an unfinished review is never presented as a clean one.',
        ]),
        p(
          'A filtered view with no matches says "no findings match the current filters" with a reset — distinct wording, never the zero-findings sentence.',
        ),
      ],
    },
    {
      id: 'official-next-steps',
      heading: 'Official next steps',
      blocks: [
        p(
          'These are general official resources — worker protection pages from Pakistan and UAE authorities. They have not seen your case and cannot advise on it. Opening them leaves WazehTerms.',
        ),
      ],
    },
  ],
};

const EVIDENCE_AND_SOURCES: Article = {
  slug: 'evidence-and-sources',
  title: 'Understanding evidence and official sources',
  intro: [
    'Every claim in WazehTerms sits on one of three kinds of text. Knowing which kind you are looking at is most of what you need to judge the report.',
  ],
  sections: [
    {
      id: 'three-kinds-of-text',
      heading: 'Three kinds of text',
      blocks: [
        bullets([
          'Document evidence — an exact passage from your PDF, with its page. Shown as a quote with the label Text matched to PDF.',
          'Model transcription — what the AI model typed out after looking at a page, when it could not match the words to the PDF\'s text layer. Labelled Model transcription — check the page. Treat it as a pointer to the page, not as an exact quote.',
          'Your correction — a value you entered. Always labelled as yours, always shown next to the original, never merged into it.',
        ]),
      ],
    },
    {
      id: 'pages-and-quotes',
      heading: 'Pages and quotes',
      blocks: [
        p(
          'Each quote carries a page reference, and fields with located evidence have a View page link that opens that page in the document viewer. The viewer shows the real PDF — you are always one click from the original. When the viewer cannot highlight the exact sentence, the page still opens and the quoted text stays on the card. Values with no located evidence have no page to open; their state chip explains why.',
        ),
      ],
    },
    {
      id: 'official-law-vs-guidance',
      heading: 'Official law vs official guidance',
      blocks: [
        p('Source-backed concerns cite two kinds of official material, and the card says which:'),
        bullets([
          'Official rule — written law: a decree-law, its article, its clause. The card quotes the exact passage and names the pinpoint.',
          "Official guidance — an authority's explanation page. It can help you understand a rule, but it is not the law itself, and it never carries the same weight. The label is always visible.",
        ]),
        p(
          "A famous authority's homepage supports nothing by itself. Support means: the specific passage, at the specific pinpoint, in the version that is in force — which is exactly what the citation card shows.",
        ),
      ],
    },
    {
      id: 'pinpoints-and-dates',
      heading: 'Pinpoints, dates, and dead links',
      blocks: [
        p(
          'A citation pinpoints its source: the article or clause, the quoted passage, the date the rule came into force, and the date WazehTerms last verified the source text.',
        ),
        p(
          "If an official link does not open — sites go down, addresses move — keep the reference: authority, pinpoint, and quote stay on the card. A dead link neither proves nor disproves the concern; try the authority's site search with the article number.",
        ),
      ],
    },
    {
      id: 'applicability',
      heading: 'Applicability',
      blocks: [
        p(
          'A rule supports a concern only when it applies to the situation: the right jurisdiction (Pakistan or UAE), the right employment category (mainland private sector), the right responsible party, and the dates. When any of those cannot be established, WazehTerms withholds the rule conclusion instead of guessing — you will see the uncertainty on the card or in the partial banner rather than a confident claim.',
        ),
        p('That restraint is deliberate: an official citation that overreaches is worse than no citation.'),
      ],
    },
  ],
};

const SCOPE_AND_PRIVACY: Article = {
  slug: 'scope-and-privacy',
  title: 'Scope, limitations, and privacy',
  intro: [
    'What WazehTerms can and cannot do, and what happens to your data. Plainly. (The full scope guide arrives with the help hub; this page carries the section the application links to.)',
  ],
  sections: [
    {
      id: 'your-data',
      heading: 'Your data',
      blocks: [
        bullets([
          'WazehTerms keeps nothing. The review lives in your browser\'s memory; a refresh or closed tab ends it. There are no accounts and no stored cases.',
          "The provider is a separate matter. Document content is sent to Google's Gemini API (Free tier) for extraction. On the Free tier, Google may use submitted content and responses to improve its products, and human reviewers may examine them. WazehTerms cannot promise zero retention by the provider — no honest product can promise that about another company's infrastructure.",
          'The acknowledgment on the upload page records that you understand both points before anything is sent.',
          'The full privacy notice is linked beside the checkbox; the version shown there is the authoritative one.',
        ]),
      ],
    },
  ],
};

export const ARTICLES: Readonly<Record<string, Article>> = {
  'checking-terms': CHECKING_TERMS,
  'reading-findings': READING_FINDINGS,
  'evidence-and-sources': EVIDENCE_AND_SOURCES,
  'scope-and-privacy': SCOPE_AND_PRIVACY,
};

/** Anchor set served by the pilot doc router: "slug" and "slug#section". */
export function servedAnchorSet(): Set<string> {
  const anchors = new Set<string>();
  for (const article of Object.values(ARTICLES)) {
    anchors.add(`/help/${article.slug}`);
    for (const section of article.sections) {
      anchors.add(`/help/${article.slug}#${section.id}`);
    }
  }
  return anchors;
}
