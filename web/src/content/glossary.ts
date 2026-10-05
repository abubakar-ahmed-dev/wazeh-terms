/**
 * Glossary (P3 drafts/glossary.md): one meaning per term, app-wide.
 * Rendered on /help/glossary and linkable from first meaningful use.
 * Sources: plans/usability-guides/drafts/glossary.md (review-hardened).
 */

export interface GlossaryTerm {
  readonly term: string;
  readonly slug: string;
  readonly definition: string;
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    term: 'Offer',
    slug: 'offer',
    definition:
      'A document stating what an employer proposes before signing: an offer letter or term sheet.',
  },
  {
    term: 'Contract',
    slug: 'contract',
    definition: 'The employment agreement to be signed, setting the actual terms of the job.',
  },
  {
    term: 'Written terms',
    slug: 'written-terms',
    definition:
      'The concrete facts in those documents: pay, dates, hours, benefits, charges. What WazehTerms reads and compares.',
  },
  {
    term: 'Reading (a document)',
    slug: 'reading',
    definition:
      'The extraction step: locating the written terms on the pages and typing out their values with evidence.',
  },
  {
    term: 'Verify terms',
    slug: 'verify-terms',
    definition:
      'The step where you check each read value against the original page and correct what is wrong.',
  },
  {
    term: 'Findings report',
    slug: 'findings-report',
    definition:
      'The final output: differences, missing terms, questions, source-backed concerns, and coverage.',
  },
  {
    term: 'Document difference',
    slug: 'document-difference',
    definition:
      'The offer and the contract state the same term differently. Shown with both passages, side by side.',
  },
  {
    term: 'Missing information',
    slug: 'missing-information',
    definition: 'A term was not found on the readable pages. Not a claim that it does not exist.',
  },
  {
    term: 'Unclear',
    slug: 'unclear',
    definition: 'Wording was found, but its meaning or value could not be pinned down.',
  },
  {
    term: 'Could not read',
    slug: 'could-not-read',
    definition:
      'The text was physically unreadable (poor scan quality, damage). Different from unclear: the words themselves are unreadable.',
  },
  {
    term: 'Evidence',
    slug: 'evidence',
    definition: 'The quoted passage and page behind a value or finding.',
  },
  {
    term: 'Matched text',
    slug: 'matched-text',
    definition: "A quote matched exactly to the PDF's own text layer.",
  },
  {
    term: 'Model transcription',
    slug: 'model-transcription',
    definition:
      "The model's typed reading of a page when exact matching failed; labelled check the page. Less certain than matched text.",
  },
  {
    term: 'Your correction',
    slug: 'your-correction',
    definition:
      'A value you entered because you could see the truth on the page. Always labelled as yours; never treated as confirmed document wording.',
  },
  {
    term: 'Source-backed concern',
    slug: 'source-backed-concern',
    definition:
      'A finding supported by an approved official source, quoted at its exact location, with a link. The only finding type that ever cites a rule.',
  },
  {
    term: 'Official rule',
    slug: 'official-rule',
    definition: 'Written law: a decree-law, its article, its clause.',
  },
  {
    term: 'Official guidance',
    slug: 'official-guidance',
    definition:
      "An authority's explanation page. Not the law itself; always labelled as guidance.",
  },
  {
    term: 'Pinpoint',
    slug: 'pinpoint',
    definition:
      'The exact location of a quotation in a source: article, clause, and the quoted passage.',
  },
  {
    term: 'Applicability',
    slug: 'applicability',
    definition:
      'Whether a rule truly applies: right jurisdiction, employment category, responsible party, and dates.',
  },
  {
    term: 'Coverage',
    slug: 'coverage',
    definition: 'What the checks actually covered, and what they could not. Shown in What we checked.',
  },
  {
    term: 'Partial review',
    slug: 'partial-review',
    definition:
      'A report with unfinished or unverifiable checks. The banner names what was withheld and what remains usable.',
  },
  {
    term: 'Priority',
    slug: 'priority',
    definition:
      'A reading-order hint on findings (high, medium, low). Not a risk score or legal weight.',
  },
  {
    term: 'Worker charge',
    slug: 'worker-charge',
    definition: 'Any amount the worker must pay: deductions from salary or other stated charges.',
  },
  {
    term: 'Recruitment cost',
    slug: 'recruitment-cost',
    definition:
      'A charge for getting the job: recruitment, visa, residency, medical, or travel costs. Who pays is recorded exactly as written.',
  },
  {
    term: 'Allowance',
    slug: 'allowance',
    definition:
      'Money paid on top of basic salary for a specific purpose (housing, transport). Given in kind (housing provided, not cash), it is a benefit, not an allowance.',
  },
  {
    term: 'Basic pay vs stated total pay',
    slug: 'basic-vs-total-pay',
    definition:
      'Basic salary is the core component; total pay is what the document claims all components add up to. Parts and total can disagree — compare them yourself when a total is stated; WazehTerms compares each stated value across the two documents.',
  },
  {
    term: 'Benefit states',
    slug: 'benefit-states',
    definition:
      'Provided (stated), not provided (explicitly denied), conditional (under stated conditions), allowance (cash instead), silent (the document says nothing). Silence is not denial.',
  },
  {
    term: 'Notice period',
    slug: 'notice-period',
    definition: 'How much warning either side must give before ending the employment.',
  },
  {
    term: 'Probation',
    slug: 'probation',
    definition: 'A stated initial period with its own conditions.',
  },
  {
    term: 'Expiry',
    slug: 'expiry',
    definition:
      "The 30-minute window in which a review can continue. After it, start again. WazehTerms keeps no copy of the review; the processing provider's separate handling is described in the privacy notice.",
  },
  {
    term: 'Capabilities',
    slug: 'capabilities',
    definition:
      'What this deployment currently offers (upload on/off, limits, notice version). The UI always shows the real values.',
  },
];

export const GLOSSARY_BY_SLUG: ReadonlyMap<string, GlossaryTerm> = new Map(
  GLOSSARY.map((entry) => [entry.slug, entry]),
);
