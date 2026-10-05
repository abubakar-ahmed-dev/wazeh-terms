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
    }
  | {
      readonly type: 'figure';
      readonly src: string;
      readonly alt: string;
      readonly caption: string;
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


const GETTING_STARTED: Article = {
  slug: 'getting-started',
  title: 'Getting started with WazehTerms',
  intro: [
    'WazehTerms reads the written terms in a Pakistan-to-UAE job offer, employment contract, or both — and shows you what it found, with the original wording and page for every value, before you sign.',
  ],
  sections: [
    {
      id: 'what-wazehterms-does',
      heading: 'What WazehTerms does',
      blocks: [
        p(
          'You give it documents. It reads them, lists every term it found (salary, dates, benefits, charges, and more), and lets you check each one against the original page. Then it compares the two documents, checks approved official sources where they apply, and produces a findings report: differences, missing terms, questions to ask, and — only when a checked official source supports it, whether written law or an authority\'s guidance — a source-backed concern.',
        ),
        p(
          'What you never get: a verdict. No "this contract is safe" or "this employer is genuine". WazehTerms shows evidence and questions; the judgment is yours, and real help may still be needed.',
        ),
      ],
    },
    {
      id: 'who-its-for',
      heading: 'Who it is for',
      blocks: [
        p(
          'People in Pakistan considering private-sector employment in the UAE (mainland, non-domestic work — office, retail, construction, hospitality, and similar). If your situation is different — domestic work, another country — the document reading can still help, but rule checks may be withheld.',
        ),
      ],
    },
    {
      id: 'fictional-only',
      heading: 'Fictional documents only, for now',
      blocks: [
        p(
          'This is a demonstration. Upload only fictional documents that contain no personal, sensitive, or confidential information. Documents based on a real offer or contract are excluded even if you rename them or remove the names — anonymized real documents are still real documents, and this demo is not the place for them. A guide to preparing fictional documents: Uploading documents.',
        ),
      ],
    },
    {
      id: 'the-four-steps',
      heading: 'The four steps',
      blocks: [
        bullets([
          'Choose documents — pick a fictional sample, or upload your own fictional PDFs (offer, contract, or both).',
          'Read documents — WazehTerms reads the pages and extracts the written terms. One step, one wait.',
          'Verify terms — you check what was read, value by value, against the original pages, and correct anything wrong.',
          'Findings report — differences, missing terms, questions, and source-backed concerns, each with evidence.',
        ]),
        p('At every step, links marked "guide" open the relevant section.'),
      ],
    },
    {
      id: 'one-or-two-documents',
      heading: 'One document or two',
      blocks: [
        p(
          'One document can be read and checked, and the report can flag missing or unclear terms — but two documents (offer + contract) allow the comparison that finds differences between them. With one document, the report says comparison is not applicable rather than pretending it ran.',
        ),
      ],
    },
    {
      id: 'accounts-and-data',
      heading: 'Accounts and your data',
      blocks: [
        p(
          "No account. No sign-up. Your review lives in the browser's memory only: a page refresh or a closed tab ends it, by design. Nothing you upload is stored by WazehTerms. Details and limits: Scope, limitations, and privacy.",
        ),
      ],
    },
    {
      id: 'where-to-go-next',
      heading: 'Where to go next',
      blocks: [
        bullets([
          'Start with a sample: open the fictional samples — or read how samples work first.',
          'Use your own fictional documents: go to upload — or read how to prepare them.',
          'Something failed? See Troubleshooting.',
          'Curious how it works inside? The technical section explains the engineering.',
        ]),
        p('During an active review, links that leave the working pages warn you first — an in-progress review cannot be restored.'),
      ],
    },
  ],
};

const TRYING_SAMPLES: Article = {
  slug: 'trying-samples',
  title: 'Trying fictional samples',
  intro: [
    'Samples are complete fictional document pairs (one is a single contract) that let you watch a full review in minutes. Every employer, person, and amount in them is invented.',
  ],
  sections: [
    {
      id: 'what-samples-are',
      heading: 'What happens when you start',
      blocks: [
        p(
          'Choosing Review this sample sends that sample\'s fictional PDFs to be read — this is live processing, the same path your own documents would take. It usually takes well under a minute. Then the review opens: you check what was read, continue, and read the findings report.',
        ),
        p('If processing is unavailable, the page says so. Trying again later is fine — repeated rapid retries only add load.'),
      ],
    },
    {
      id: 'choosing-a-scenario',
      heading: 'The scenarios',
      blocks: [
        p('Each sample demonstrates a situation people actually face. What to look for in each:'),
        bullets([
          'Consistent terms — an offer and contract that agree. Look for: a clean check, and what the report does with terms that are missing from both documents — a consistent pair can still lack things worth asking about.',
          'Changed salary — the contract states different pay than the offer. Look for: the difference shown with both passages side by side, pages included.',
          'Worker recruitment charge — the documents state charges the worker pays for recruitment. Look for: how each document words the charge and who pays, and — if the official-source check completes and the rule verifies — a concern citing the official passage on who bears recruitment costs. Source checks can withhold; a withheld check is explained in the report, not hidden.',
          'Missing notice clause — notice and termination wording absent. Look for: how "not found" is reported — as missing information, not as a denial.',
          'Single contract (abstention) — one document only. Look for: the report marking comparison not applicable instead of inventing one, and how absence is handled when there is no second document.',
          'Adversarial instructions — a document containing text that tries to instruct automated readers ("ignore previous rules…"). Look for: whether the embedded instructions appear as document content rather than being acted on — the review is designed to treat them as text, and the evaluation includes a case that checks exactly this.',
        ]),
        p('These are illustrative: what the report shows is produced by reading the actual documents, so treat the samples as demonstrations, not guaranteed outputs.'),
      ],
    },
    {
      id: 'previewing',
      heading: 'Preview files',
      blocks: [
        p(
          'Preview files opens the sample\'s actual PDFs in a new tab — the same bytes that will be read. Preview problems (a blocked pop-up, a PDF viewer issue) have nothing to do with processing; the review itself does not depend on the preview opening.',
        ),
      ],
    },
    {
      id: 'evaluators-path',
      heading: "Evaluators' path",
      blocks: [
        p(
          'If you are assessing this project: start with Changed salary (clear difference with paired evidence), then Worker recruitment charge (the official-source citation path), then Single contract (abstention behavior). The technical section describes how quality is measured.',
        ),
      ],
    },
  ],
};

const UPLOADING_DOCUMENTS: Article = {
  slug: 'uploading-documents',
  title: 'Preparing and uploading fictional documents',
  intro: [
    'The upload page takes up to two fictional PDFs: a job offer and an employment contract. This guide explains which file goes where, what "fictional" means here, and what happens after you click.',
  ],
  sections: [
    {
      id: 'offer-vs-contract',
      heading: 'Offer vs contract',
      blocks: [
        bullets([
          'Job Offer Letter — the pre-contract document: an offer letter, term sheet, or similar that states what the employer proposes.',
          'Employment Contract — the agreement to be signed: the contract that sets the actual terms.',
        ]),
        p(
          'Decide by what the document is, not by its filename. A file named "offer.pdf" that is actually a signed contract belongs in the contract slot.',
        ),
      ],
    },
    {
      id: 'one-or-both',
      heading: 'One document or both',
      blocks: [
        p(
          'Both is best: with a pair, the findings report can compare them term by term and flag differences. One document alone still works — it can be read and checked, and missing or unclear terms can be reported — but there is nothing to compare against, and the report says so.',
        ),
      ],
    },
    {
      id: 'requirements',
      heading: 'Requirements',
      blocks: [
        bullets([
          'Format: PDF only. Other types, including images of pages, are rejected.',
          'Size: up to 8 MB per file, and no more than 16 MB combined.',
          'Pages: up to 15 pages per PDF.',
          'Language: English. The written terms are extracted in English.',
          'Readable text: WazehTerms is built and tested around digital PDFs with a text layer — the kind produced by word processors and most export tools. Encrypted or password-protected files are rejected outright. Scanned pages (pages that are photographs) have no assured support: such a file may fail to produce a review, and any values that are read from pages without a text layer are labelled as needing your check. When in doubt, use a digital PDF.',
        ]),
        p('The values above come from the live capabilities of this deployment; the upload page always shows the current ones.'),
      ],
    },
    {
      id: 'fictional-only',
      heading: 'What "fictional" means here',
      blocks: [
        p(
          'Upload documents that contain no real personal, sensitive, or confidential information — invented employers, invented people, invented amounts. Documents based on a real offer with the names changed still count as real documents for this purpose: do not upload them. This is a demonstration boundary, not advice about anonymizing your paperwork.',
        ),
      ],
    },
    {
      id: 'before-you-upload',
      heading: 'Before you upload',
      blocks: [
        p('A 30-second checklist:'),
        bullets([
          'the file is the right role (offer vs contract);',
          'the text is legible and selectable, not a scan;',
          'pages it references (annexes, policy documents) are either included or knowingly absent — WazehTerms reads only what you give it;',
          'the file opens in a PDF reader without a password.',
        ]),
      ],
    },
    {
      id: 'scope',
      heading: 'Scope and how it is decided',
      blocks: [
        p(
          'WazehTerms checks official rules for one route: Pakistan to UAE mainland, non-domestic private-sector employment. You do not declare a category — the service infers applicability from the documents themselves. When the documents conflict or the category cannot be established, rule-based conclusions are withheld and the report says so; document reading and comparison still work.',
        ),
      ],
    },
    {
      id: 'processing-and-privacy',
      heading: 'Processing and privacy',
      blocks: [
        p(
          "When you submit, the document content is sent to Google's Gemini API for extraction. On the Free tier, Google may use submitted content and responses to improve its products, and human reviewers may examine them. WazehTerms itself processes files in memory only and stores nothing — but it cannot promise zero retention by the provider.",
        ),
        p(
          'The acknowledgment checkbox records that you understand this and are uploading only a fictional document. The full notice is linked beside the checkbox; the version shown on the page is the authoritative one.',
        ),
      ],
    },
    {
      id: 'after-upload',
      heading: 'After you upload',
      blocks: [
        bullets([
          'Reading takes a moment. The screen says what is happening — no fake progress bars; the client cannot see inside the extraction.',
          'Partial reading: if some pages could not be read, the review still opens, with a notice naming the affected pages.',
          'Failure: if no usable review could be produced, you get a clear message and return to the upload page. The message distinguishes what it can: a rejected file type or protected file names the problem; a general "nothing usable" result means reading did not produce a workable extraction — the specific cause cannot be diagnosed from the message alone. Your other selections stay where possible.',
        ]),
      ],
    },
    {
      id: 'why-no-replacement',
      heading: 'Why a file cannot be replaced mid-review',
      blocks: [
        p(
          'Once documents are read, the review is sealed against that exact reading. Swapping one file for another inside the same review would let the report mix values from different documents. To use a different file, start the review again — reading is quick.',
        ),
      ],
    },
  ],
};

const TROUBLESHOOTING: Article = {
  slug: 'troubleshooting',
  title: 'Troubleshooting and starting again',
  intro: ['Find your problem below. Each section says what happened, what you still have, and what to do.'],
  sections: [
    {
      id: 'file-rejected',
      heading: 'My file was rejected',
      blocks: [
        p(
          'The upload page rejects files at selection time with a message naming the problem: not a PDF, or over the 8 MB per-file limit. Fix the file (export as PDF, compress it) and choose it again. The other slot keeps its selection.',
        ),
      ],
    },
    {
      id: 'cannot-read-document',
      heading: 'My document cannot be read',
      blocks: [
        p(
          '"No usable text could be read…" means reading did not produce a usable result. The distinct messages first: a password-protected file is rejected with its own message, and a structurally broken PDF is named as unreadable. The general "nothing usable" result means the extraction produced nothing workable — which can happen with image-only scans. WazehTerms is built and tested around digital PDFs with a text layer; scanned pages have no assured support, and anything read from them is labelled for checking. Use a digital PDF with selectable text, or pick a sample instead.',
        ),
      ],
    },
    {
      id: 'busy-or-rate-limited',
      heading: 'The service is busy',
      blocks: [
        p(
          'A busy or rate-limited response means the service cannot take the operation right now — not that your document is wrong. Wait a little and try again. Avoid rapid repeated clicks; each attempt is a real request. When the page shows "try again available in N seconds", it is counting down the server\'s requested wait.',
        ),
      ],
    },
    {
      id: 'processing-failed',
      heading: 'Processing failed',
      blocks: [
        p(
          'Reading or analyzing can fail for service-side reasons. The message says which step failed. From a failed read: return to the upload page or samples and start again. Your document never left your browser except for the processing request, and nothing is stored.',
        ),
        p(
          "When an analysis fails while the review is still valid, the page offers to retry the same review — trying again resends exactly what you checked. Cancelling stops the request in your browser; processing on the provider's side may still complete.",
        ),
      ],
    },
    {
      id: 'review-expired',
      heading: 'My review expired',
      blocks: [
        p(
          'Reviews stay open for about 30 minutes; the timer in the review header shows the remaining time. After expiry the review cannot continue — reading is quick, so start again. There is nothing to recover: WazehTerms keeps no copy of the review. Expiry ends the ability to continue this review; it is not a statement about the processing provider\'s separate handling (see the privacy notice).',
        ),
      ],
    },
    {
      id: 'page-refreshed',
      heading: 'I refreshed or closed the page',
      blocks: [
        p(
          'The review lives in the browser\'s memory only, so a refresh, a closed tab, or a crashed browser ends it. This is deliberate: WazehTerms keeps no copy of your review to restore. What the processing provider handles under its own terms is a separate matter, described in the privacy notice. Start again from the samples or the upload page.',
        ),
        p(
          'If the browser warns you before leaving the page, that warning is protecting an in-progress review — stay and finish, or leave and start over.',
        ),
      ],
    },
    {
      id: 'opened-a-step-directly',
      heading: 'I opened a review or report link directly',
      blocks: [
        p(
          '/review and /result need the review your browser was holding. Opening them fresh shows "Nothing to review yet" or "No report to show" — honest endpoints, not errors. Pick a sample or upload to begin.',
        ),
      ],
    },
    {
      id: 'correction-not-saved',
      heading: 'My correction did not save',
      blocks: [
        p(
          'The correction editor takes plain values: text, a decimal amount with currency, or a YYYY-MM-DD date. Invalid values show an inline message beside the input. If the analysis step later cannot use a correction, the review is kept and the page asks you to fix or remove that correction — nothing else is lost.',
        ),
      ],
    },
    {
      id: 'preview-wont-open',
      heading: 'The preview will not open',
      blocks: [
        p(
          'Sample previews and uploaded-document views open PDFs in the browser or in a new tab. If nothing opens, your browser may be blocking pop-ups or the PDF viewer — a preview problem only, never a processing problem. The review itself does not depend on the preview opening.',
        ),
      ],
    },
    {
      id: 'source-check-incomplete',
      heading: 'The source check did not complete',
      blocks: [
        p(
          'When the official-source check cannot finish — or finishes without a verifiable result — the report is marked partial, the banner explains what was withheld, and the document findings remain usable. A withheld concern is not displayed: the conclusion was not established to the required standard. It is neither confirmed nor disproven.',
        ),
      ],
    },
    {
      id: 'search-no-matches',
      heading: 'Search found no matches',
      blocks: [
        p(
          'A filtered view with no matches means your filters excluded everything, not that the report is clean. Use Reset to see all findings again — the report itself never changes.',
        ),
      ],
    },
  ],
};

const SCOPE_AND_PRIVACY: Article = {
  slug: 'scope-and-privacy',
  title: 'Scope, limitations, and privacy',
  intro: ['What WazehTerms can and cannot do, and what happens to your data. Plainly.'],
  sections: [
    {
      id: 'supported-scope',
      heading: 'Supported scope',
      blocks: [
        p(
          'Rule checks target one route: Pakistan to UAE mainland, non-domestic, private-sector employment, and only when applicability can be established from the documents. Outside that route, reading and comparison still work, but rule-based conclusions are withheld and the report says why.',
        ),
      ],
    },
    {
      id: 'what-it-does-not-do',
      heading: 'What WazehTerms does not do',
      blocks: [
        bullets([
          'It does not verify employers, visas, or documents, or detect fraud.',
          'It does not give legal advice, and it never issues an overall verdict — no "safe", "compliant", or "clean" judgment exists in the product.',
          'It does not read minds: a term it could not read is not a term that does not exist, and silence in a document is not an answer.',
          'It does not check everything. Coverage is listed term by term in the report\'s What we checked section.',
        ]),
      ],
    },
    {
      id: 'document-limits',
      heading: 'Document limits',
      blocks: [
        bullets([
          'One document cannot produce a comparison; the report marks it not applicable rather than pretending.',
          'Unreadable pages hide their terms from every check; the report names unreadable fields.',
          'Annexes, schedules, and referenced policies are only seen if you supply them.',
        ]),
      ],
    },
    {
      id: 'when-things-are-withheld',
      heading: 'When conclusions are withheld',
      blocks: [
        p(
          'When a check fails, times out, or cannot verify a rule against its approved source, WazehTerms withholds the conclusion and marks the review partial — naming how many candidate concerns were withheld and why. Withheld is not the same as untrue; it means not demonstrated to the standard this product requires.',
        ),
      ],
    },
    {
      id: 'evaluation-limits',
      heading: 'How good is it, really?',
      blocks: [
        p(
          'Measured on a 15-case synthetic corpus under frozen conditions; the numbers, dates, and denominators are published in the technical section. That corpus is small and fictional: it demonstrates the machinery; it is not proof of accuracy on real-world documents, and no accuracy badge is shown in the product for that reason.',
        ),
      ],
    },
    {
      id: 'fictional-only-policy',
      heading: 'Fictional-only policy',
      blocks: [
        p(
          'This deployment accepts fictional documents only. Documents based on real offers — even with names changed — do not belong here. The boundary exists because real documents deserve the stronger protections of a reviewed production pathway, which this demo does not claim to be.',
        ),
      ],
    },
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
    {
      id: 'getting-real-help',
      heading: 'Getting real help',
      blocks: [
        p(
          'When a finding matters — before signing anything — pair the report with real channels: the employer or recruiter, in writing; official resources such as the protection pages linked in the report; and, where stakes are high, qualified advice. WazehTerms organizes evidence and questions; it does not replace any of those.',
        ),
      ],
    },
  ],
};

export const ARTICLES: Readonly<Record<string, Article>> = {
  'getting-started': GETTING_STARTED,
  'trying-samples': TRYING_SAMPLES,
  'uploading-documents': UPLOADING_DOCUMENTS,
  'checking-terms': CHECKING_TERMS,
  'reading-findings': READING_FINDINGS,
  'evidence-and-sources': EVIDENCE_AND_SOURCES,
  'troubleshooting': TROUBLESHOOTING,
  'scope-and-privacy': SCOPE_AND_PRIVACY,
};

/** Help-hub grouping (P4 8.1): task-first index of the practical guides. */
export const HELP_HUB_GROUPS: ReadonlyArray<{ label: string; slugs: readonly string[] }> = [
  { label: 'Start', slugs: ['getting-started', 'trying-samples', 'uploading-documents'] },
  { label: 'Check', slugs: ['checking-terms'] },
  { label: 'Understand', slugs: ['reading-findings', 'evidence-and-sources'] },
  { label: 'Recover', slugs: ['troubleshooting'] },
  { label: 'Boundaries', slugs: ['scope-and-privacy'] },
];

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
