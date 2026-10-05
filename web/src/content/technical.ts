/**
 * Public Technical Articles (T1–T7) per P2 §3 and P9 specifications.
 * Audience: engineers, recruiters, technical judges, and evaluators.
 * Every performance metric includes dates and denominators.
 * Copy strictly observes the WazehTerms verdict-word and claims policy.
 */
import type { Article, ArticleBlock } from './articles';

const p = (text: string): ArticleBlock => ({ type: 'p', text });
const bullets = (items: readonly string[]): ArticleBlock => ({ type: 'bullets', items });
const table = (headers: readonly string[], rows: readonly (readonly string[])[]): ArticleBlock => ({
  type: 'table',
  headers,
  rows,
});

export const T1_SYSTEM_OVERVIEW: Article = {
  slug: 'system-overview',
  title: 'System overview and responsibility boundaries',
  intro: [
    'How WazehTerms turns employment PDFs into evidence-backed finding reports without allowing a language model to decide the truth.',
  ],
  sections: [
    {
      id: 'pipeline-walkthrough',
      heading: 'The review pipeline',
      blocks: [
        p(
          'Processing follows a strict two-step state machine with explicit integrity boundaries between extraction, human verification, and source analysis:',
        ),
        bullets([
          '1. Validate: Uploaded files undergo format, magic-byte signature, size, and page-count validation on the server.',
          '2. Extract: A single bounded model call reads digital text and table structures, producing typed normalized fields with exact page coordinate evidence.',
          '3. User review: Extracted fields are signed with a server-side HMAC token and presented to the worker. The user inspects and corrects misread values before analysis.',
          '4. Deterministic comparison: Numerical values, currency amounts, dates, and frequencies are compared exclusively in audited TypeScript code. Language models never evaluate differences.',
          '5. Source retrieval: Keywords query an isolated, read-only Sanity Knowledge Base endpoint to surface candidate official rules.',
          '6. Eligibility gate: Candidate rules are verified against canonical Sanity records (statute revisions, pinpoint quotes, actor, and corridor scope).',
          '7. Report generation: Verified claims yield cited findings; unmet rules are withheld and counted in the coverage panel.',
        ]),
      ],
    },
    {
      id: 'responsibility-table',
      heading: 'System responsibility boundaries',
      blocks: [
        p(
          'Clear technical boundaries prevent model hallucination from propagating into findings:',
        ),
        table(
          ['Component', 'Responsibility', 'Boundary / Non-Responsibility'],
          [
            [
              'Gemini 2.5 Flash',
              'Fast visual and OCR reading of PDF pages into structured candidate values with verbatim excerpts.',
              'Model output is untrusted input. It never decides whether a difference exists or whether a contract is legal.',
            ],
            [
              'Application Engine',
              'Deterministic arithmetic comparison, schema validation, HMAC signing, and eligibility gate enforcement.',
              'Does not verify document authenticity, employer legitimacy, or visa validity.',
            ],
            [
              'Sanity Content Lake',
              'Authoritative curated records of official labor statutes, pinpoint quotations, and field definitions.',
              'Never stores worker uploads, extracted terms, or report outputs. Editorial source of truth only.',
            ],
            [
              'Knowledge Base Context',
              'High-speed read-only retrieval of candidate official rules matching document text.',
              'Retrieval hits are candidates only, never displayable citations until verified by canonical rules.',
            ],
            [
              'Worker / User',
              'Inspects extracted values against original PDF pages, supplies corrections, and decides actions.',
              'User corrections are strictly attributed to the user and never masquerade as document facts.',
            ],
          ],
        ),
      ],
    },
    {
      id: 'two-step-signed-flow',
      heading: 'Two-step signed contract integrity',
      blocks: [
        p(
          'WazehTerms separates extraction (/api/v1/extractions) from analysis (/api/v1/analyses). The server signs the issued extraction payload using an HMAC-SHA256 integrity token. When the client requests analysis, it submits the unchanged payload, proof, and separate correction deltas.',
        ),
        p(
          'This cryptographic link guarantees that analysis runs only against values actually extracted from the documents and explicitly modified by the user, preventing client-side injection while avoiding persistent server sessions.',
        ),
      ],
    },
    {
      id: 'review-lifecycle',
      heading: 'Review lifecycle and expiry',
      blocks: [
        p(
          'Reviews carry an explicit 30-minute validity lifetime bound. Expiry limits session longevity and prevents the accumulation of stale review state in browser memory.',
        ),
        p(
          'All document processing is transient: file buffers exist only in temporary memory during processing and are immediately discarded. WazehTerms maintains zero user accounts and zero database persistence for worker documents.',
        ),
      ],
    },
  ],
};

export const T2_EMPLOYMENT_KNOWLEDGE: Article = {
  slug: 'employment-knowledge-content',
  title: 'Modeling employment knowledge in Sanity',
  intro: [
    'Why official labor rules require versioned, typed, and citable schemas rather than raw prose.',
  ],
  sections: [
    {
      id: 'structured-vs-prose',
      heading: 'Structured content vs ungrounded prose',
      blocks: [
        p(
          'Official gazettes and decrees are written in narrative legal prose. While prose contains the ultimate statutory authority, language models querying raw text often hallucinate citations or miss temporal amendments.',
        ),
        p(
          'By modeling employment law as structured Sanity documents, every rule possesses computable attributes: responsible actor (employer vs worker), corridor regime, wage frequency, pinpoint location, and active date bounds.',
        ),
      ],
    },
    {
      id: 'sanity-schemas',
      heading: 'Reference schema architecture',
      blocks: [
        p('The WazehTerms content lake is organized into four interconnected document types:'),
        bullets([
          'authority: Issuing bodies such as the UAE Ministry of Human Resources and Emiratisation (MOHRE) or Pakistan Bureau of Emigration and Overseas Employment (BEOE).',
          'sourceDocument: Specific enactments, such as UAE Federal Decree-Law No. 33 of 2021 or Pakistan Emigration Rules 1979, with official URLs and provenance timestamps.',
          'rule: Operational labor mandates (e.g. prohibition of recruitment fee deduction from worker wages) linked to exact statutory pinpoints.',
          'contractFieldDefinition: Canonical metadata defining the 33 standard material terms across offer letters and mainland contracts.',
        ]),
      ],
    },
    {
      id: 'published-inventory',
      heading: 'Published inventory and editorial status',
      blocks: [
        p(
          'As of publication, the Sanity dataset contains 44 published reference records: 2 authorities, 6 source versions, 3 rules, and 33 contract field definitions. The runtime gate enforces that only approved and current records are loaded into active service.',
        ),
        p(
          'Editorial approval in Sanity Studio establishes provenance and review history, but programmatic imports and runtime execution apply an independent verification pass.',
        ),
      ],
    },
  ],
};

export const T3_RETRIEVAL: Article = {
  slug: 'retrieval',
  title: 'Knowledge Bases and Context retrieval',
  intro: [
    'How WazehTerms queries labor reference materials via Context MCP without confusing search hits with legal proof.',
  ],
  sections: [
    {
      id: 'context-mcp-architecture',
      heading: 'Context MCP runtime integration',
      blocks: [
        p(
          'WazehTerms integrates with Sanity Knowledge Base Context via an organization-scoped, read-only MCP endpoint. This runtime connection is strictly isolated from development editors and client code.',
        ),
        p(
          'Only public, vetted labor reference materials are indexed in the Knowledge Base. Uploaded employment contracts and worker identities never enter the retrieval dataset.',
        ),
      ],
    },
    {
      id: 'candidate-retrieval',
      heading: 'Candidate retrieval vs legal proof',
      blocks: [
        p(
          'When document terms (such as recruitment fees, visa deposits, or medical insurance) are detected, the retrieval service queries the Knowledge Base to locate candidate statutory passages.',
        ),
        p(
          'A retrieval match is strictly treated as a candidate suggestion. The system does not assume an official source applies merely because semantic similarity retrieved its text.',
        ),
      ],
    },
    {
      id: 'canonical-pinpoint-mapping',
      heading: 'Verbatim pinpoint reconciliation',
      blocks: [
        p(
          'Because retrieval chunking may paraphrase or truncate text, candidate passages are mapped back to canonical Sanity rule records using exact, verbatim pinpoint quotes (e.g., Article 6(4)).',
        ),
        p(
          'If the exact statutory passage cannot be reconciled against the approved canonical source version, the candidate is discarded.',
        ),
      ],
    },
    {
      id: 'fail-closed-resilience',
      heading: 'Startup verification and fail-closed posture',
      blocks: [
        p(
          'At server startup, the retrieval layer performs a live known-answer check against the Sanity Context endpoint. If the endpoint is unreachable or returns outdated schema versions, the service fails closed: rule checks are marked incomplete and candidate concerns are safely withheld rather than invented.',
        ),
      ],
    },
  ],
};

export const T4_FROM_CANDIDATES_TO_CONCERNS: Article = {
  slug: 'from-candidates-to-concerns',
  title: 'From retrieved candidates to supported concerns',
  intro: [
    'The six-stage eligibility gate that determines whether a candidate rule becomes an official finding or is safely withheld.',
  ],
  sections: [
    {
      id: 'eligibility-gate',
      heading: 'The six-stage eligibility gate',
      blocks: [
        p(
          'Before any statutory concern appears in a findings report, it must satisfy all six validation stages in application code:',
        ),
        bullets([
          '1. Approved status: The rule must carry an approved review status and active current validity.',
          '2. Revision match: The candidate pinpoint must match the published rule revision and exact source version.',
          '3. Verbatim quote verification: The statutory excerpt must match the official text character for character.',
          '4. Corridor applicability: The rule must govern the Pakistan-to-UAE mainland private-sector route.',
          '5. Responsible actor check: The actor designated by law (e.g. employer) must align with the document clause.',
          '6. Temporal validity: The contract date must fall within the rule\'s effectiveFrom and effectiveTo window.',
        ]),
      ],
    },
    {
      id: 'withheld-concerns',
      heading: 'Withheld concerns and transparent reporting',
      blocks: [
        p(
          'If any condition fails — such as an ambiguous employer attribution or an unverified gazette date — the candidate concern is withheld. It is neither displayed as a confirmed violation nor discarded silently.',
        ),
        p(
          'Instead, the report is labelled Partial review, and the What we checked section explicitly lists how many candidate concerns were withheld and the technical reason why.',
        ),
      ],
    },
    {
      id: 'document-independence',
      heading: 'Preservation of document findings',
      blocks: [
        p(
          'Deterministic document comparisons (such as basic salary mismatches between offer and contract) are completely independent of source retrieval. Even when external rule checks are unavailable, workers receive their full document-to-document comparison.',
        ),
      ],
    },
  ],
};

export const T5_CONTENT_REVIEW: Article = {
  slug: 'content-review',
  title: 'Content review, publication, and maintenance',
  intro: [
    'How official labor statutes are acquired, verified by legal editors, and maintained over time.',
  ],
  sections: [
    {
      id: 'editorial-loop',
      heading: 'The editorial review lifecycle',
      blocks: [
        p(
          'Statutory knowledge maintenance follows an audited, repeatable editorial lifecycle:',
        ),
        bullets([
          '1. Source acquisition: Primary enactments are collected from official government gazettes (e.g. UAE MOHRE portal and Pakistan National Assembly records).',
          '2. Provenance recording: Every document record captures exact source URLs, publication dates, and administrative captures.',
          '3. Narrow extraction: Legal specialists extract narrow, concrete mandates rather than general policy aspirations.',
          '4. Attribute encoding: Applicability criteria (jurisdiction, regime, worker category) are structured into Sanity fields.',
          '5. Peer review & approval: Editorial review approves revisions before they are staged for runtime inclusion.',
        ]),
      ],
    },
    {
      id: 'manual-transparency',
      heading: 'Honest manual verification',
      blocks: [
        p(
          'WazehTerms does not claim automated statutory discovery. Determining whether a ministerial resolution alters prior decree provisions requires legal expertise. We treat statute modeling as an editorial discipline with full human review.',
        ),
      ],
    },
    {
      id: 'statutory-supersession',
      heading: 'Statutory supersession and amendments',
      blocks: [
        p(
          'When labor laws are repealed or amended, previous rules are assigned an effectiveTo date and successor rules are published under new revision numbers. The eligibility gate uses the contract execution date to evaluate only the enactments in force at the time of signing.',
        ),
      ],
    },
  ],
};

export const T6_PRIVACY_AND_LIMITS: Article = {
  slug: 'privacy-and-limits',
  title: 'Privacy, security, and operational limits',
  intro: [
    'Engineering an employment document analysis service without building a surveillance broker.',
  ],
  sections: [
    {
      id: 'memory-only-architecture',
      heading: 'Memory-only client and server processing',
      blocks: [
        p(
          'Personal employment offers contain sensitive identifying information. WazehTerms is designed so that your documents never persist on disk or in server databases:',
        ),
        bullets([
          'No worker accounts: You do not register, log in, or provide contact details.',
          'No document database: Uploaded PDFs and extracted term dictionaries exist only in volatile server RAM during processing.',
          'Client-side retention: Between extraction and analysis, review state lives exclusively in temporary browser memory. Closing the tab ends the session.',
        ]),
      ],
    },
    {
      id: 'provider-boundary',
      heading: 'AI provider data boundaries',
      blocks: [
        p(
          'Extraction passes PDF byte streams directly to the Google Gemini API over encrypted channels for structured reading. Processing operates under standard developer API terms.',
        ),
        p(
          'WazehTerms never sends uploaded employment documents or extracted terms to Sanity, external telemetry, or advertising trackers.',
        ),
      ],
    },
    {
      id: 'operational-limits',
      heading: 'Operational boundaries and rate limits',
      blocks: [
        p('To protect service availability and user privacy, strict bounds are enforced:'),
        bullets([
          'PDF format only, verified by MIME type and binary magic bytes.',
          'File size limit: 10 MB per file.',
          'Page limit: 10 pages per document.',
          'Language: English digital text (scanned image PDFs are not supported).',
          'Rate limiting: 429 responses provide standard Retry-After headers with live UI countdowns.',
        ]),
      ],
    },
  ],
};

export const T7_EVALUATION: Article = {
  slug: 'evaluation',
  title: 'Evaluation, limitations, and demonstration evidence',
  intro: [
    'Measured benchmark performance on synthetic test corpora, frozen test conditions, and current limits.',
  ],
  sections: [
    {
      id: 'synthetic-corpus',
      heading: 'The 15-case synthetic evaluation corpus',
      blocks: [
        p(
          'Evaluating an employment document analyzer requires ground truth. Because real employment offers cannot be published without privacy violations, testing uses a synthetic corpus of 15 fully authored document pairs.',
        ),
        p(
          'The corpus tests salary alterations, recruitment fee deductions, missing notice periods, ambiguous gratuity clauses, single-contract submissions, and adversarial prompt injections.',
        ),
      ],
    },
    {
      id: 'benchmark-results',
      heading: 'Measured benchmark performance (2026-10-03 freeze)',
      blocks: [
        p(
          'Under frozen test conditions (model version, prompts, canonical dataset, and scoring harness), the benchmark produced the following verified results:',
        ),
        table(
          ['Metric', 'Measured Result', 'Denominator / Context'],
          [
            ['Field Extraction Recall', '53 / 53 (100%)', 'Material contract fields extracted without omission'],
            ['Document Mismatch Recall', '11 / 11 (100%)', 'Seeded discrepancies correctly detected'],
            ['Report Finding Precision', '13 / 13 (100%)', 'Zero false-positive discrepancies reported'],
            ['Citation Support Accuracy', '1 / 1 (100%)', 'Official source pinpoint verified without hallucination'],
            ['Abstention Compliance', '0 violations', 'Correctly abstains on single-contract inputs'],
            ['Extraction Latency (p50)', '14.2 seconds', 'Server PDF text extraction machine time (n=15)'],
            ['Analysis Latency (p50)', '4.4 seconds', 'Deterministic comparison & retrieval machine time (n=15)'],
            ['End-to-end Latency (p50)', '18.6 seconds', 'Full machine processing time excluding human review (n=15)'],
            ['End-to-end Latency (p95)', '21.5 seconds', '95th percentile machine processing time (n=15)'],
          ],
        ),
      ],
    },
    {
      id: 'evaluation-limits',
      heading: 'Known limitations and ongoing work',
      blocks: [
        p(
          'These figures demonstrate machinery precision under frozen synthetic conditions. They do not constitute a legal certification or a statistical guarantee across arbitrary real-world documents.',
        ),
        p(
          'Camera scans, distorted mobile captures, free-zone employment contracts, and domestic worker agreements are outside current verified scope.',
        ),
      ],
    },
  ],
};

export const TECHNICAL_ARTICLES: Readonly<Record<string, Article>> = {
  'system-overview': T1_SYSTEM_OVERVIEW,
  'employment-knowledge-content': T2_EMPLOYMENT_KNOWLEDGE,
  'retrieval': T3_RETRIEVAL,
  'from-candidates-to-concerns': T4_FROM_CANDIDATES_TO_CONCERNS,
  'content-review': T5_CONTENT_REVIEW,
  'privacy-and-limits': T6_PRIVACY_AND_LIMITS,
  'evaluation': T7_EVALUATION,
};

export const TECHNICAL_ORDER: readonly string[] = [
  'system-overview',
  'employment-knowledge-content',
  'retrieval',
  'from-candidates-to-concerns',
  'content-review',
  'privacy-and-limits',
  'evaluation',
];
