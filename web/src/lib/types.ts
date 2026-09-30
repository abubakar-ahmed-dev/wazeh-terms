/**
 * Client-side mirrors of the documented API response shapes
 * (docs/API.md §3–§7). Render-only types: the API validates its own output;
 * the client never invents fields.
 */

export interface Capabilities {
  apiVersion: string;
  sampleModeEnabled: boolean;
  customUploadEnabled: boolean;
  acceptedCustomMimeTypes: string[];
  supportedAnalysisLanguages: string[];
  maxDocuments: number;
  maxBytesPerFile: number;
  maxTotalBytes: number;
  maxPagesPerPdf: number;
  maxCorrections: number;
  sourceBackedChecks: 'available' | 'unconfigured';
  privacyNoticeVersion: string;
}

export interface SampleDocument {
  role: 'offer' | 'contract';
  previewUrl: string;
}

export interface SampleEntry {
  sampleCaseId: string;
  title: string;
  description: string;
  documents: SampleDocument[];
}

export type FieldState = 'present' | 'absent' | 'unclear' | 'unreadable';
export type EvidenceVerification = 'matched_text' | 'model_transcription';

export interface Evidence {
  documentId: string;
  page: number;
  quote: string;
  verification: EvidenceVerification;
}

export type NormalizedValue =
  | { kind: 'text' | 'reference_text'; text: string }
  | {
      kind: 'money';
      amount: string;
      currency: string | null;
      frequency: string | null;
      component: string;
      payer: string | null;
    }
  | { kind: 'date'; date: string }
  | { kind: 'duration'; amount: string; unit: string }
  | { kind: 'benefit_state'; status: string; conditions: string | null }
  | { kind: 'boolean'; value: boolean };

export interface ExtractedField {
  fieldKey: string;
  instanceId: string;
  state: FieldState;
  rawText: string | null;
  value: NormalizedValue | null;
  evidence: Evidence[];
  qualityNotes: string[];
}

export interface IssuedDocument {
  documentId: string;
  role: 'offer' | 'contract';
  mimeType: string;
  pageCount: number;
  sha256: string;
  extractionStatus: 'completed' | 'partial' | 'failed';
  fields: ExtractedField[];
  unreadablePages: number[];
}

export interface IssuedExtraction {
  schemaVersion: number;
  issuedAt: string;
  expiresAt: string;
  scope: {
    origin: string;
    destination: string;
    declaredRegime: string;
    declaredWorkerCategory: string;
  };
  sourceMode: string;
  documents: IssuedDocument[];
}

export interface Proof {
  keyId: string;
  signature: string;
}

export interface ExtractionResponse {
  requestId: string;
  status: 'complete' | 'partial';
  issuedExtraction: IssuedExtraction;
  proof: Proof;
  stages: { extraction: string };
  notices: string[];
}

export interface CorrectionDelta {
  documentId: string;
  fieldKey: string;
  instanceId: string;
  state: FieldState;
  value: NormalizedValue | null;
  note?: string;
}

export interface SourceCitation {
  ruleKey: string;
  ruleRevision: number;
  sourceKey: string;
  versionKey: string;
  issuingAuthority: string;
  officialUrl: string;
  pinpoint: { label: string; quote: string };
  jurisdiction: 'PK' | 'AE';
  responsibleParty: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  sourceCheckedAt: string;
  evidenceClass: 'binding_official_rule' | 'official_guidance';
}

export type FindingCategory =
  | 'document_mismatch'
  | 'source_backed_concern'
  | 'missing_information'
  | 'needs_clarification'
  | 'unable_to_determine';

export interface Finding {
  id: string;
  category: FindingCategory;
  fieldKeys: string[];
  importance: 'high' | 'medium' | 'low' | 'unknown';
  explanation: string;
  documentEvidence: Evidence[];
  valueOrigins: Array<'document' | 'user'>;
  comparisonRuleKey?: string;
  source?: SourceCitation;
  uncertaintyReasons: string[];
  suggestedQuestionOrStep: string;
}

export interface AnalysisResponse {
  requestId: string;
  status: 'complete' | 'partial';
  reviewedAsOf: string;
  scopeApplicability: 'supported' | 'conflicting' | 'unknown';
  stages: Record<string, string>;
  coverage: {
    documentIds: string[];
    checkedFieldKeys: string[];
    unreadableFieldKeys: string[];
    omittedChecks: string[];
  };
  findings: Finding[];
  summary: string;
  limitations: string[];
  officialNextSteps: Array<{ label: string; url: string }>;
}

export interface ApiErrorBody {
  error: { code: string; message: string; stage?: string; retryable?: boolean };
  requestId: string;
}

/** Group keys + display headings (docs/DATABASE_SCHEMA.md §7; display only). */
export const FIELD_GROUPS: ReadonlyArray<{ key: string; heading: string }> = [
  { key: 'employer', heading: 'Employer' },
  { key: 'occupation', heading: 'Occupation' },
  { key: 'location', heading: 'Work location' },
  { key: 'pay', heading: 'Pay' },
  { key: 'term', heading: 'Term' },
  { key: 'probation', heading: 'Probation' },
  { key: 'working_time', heading: 'Working time' },
  { key: 'ending_terms', heading: 'Ending terms' },
  { key: 'deductions', heading: 'Deductions and worker charges' },
  { key: 'recruitment_and_travel_costs', heading: 'Recruitment and travel costs' },
  { key: 'benefits', heading: 'Benefits' },
  { key: 'document_details', heading: 'Document details' },
];

/** Human labels for the active component keys (display only; code owns semantics). */
export const FIELD_LABELS: Readonly<Record<string, string>> = {
  employer_name: 'Employer name',
  job_title: 'Job title or occupation',
  work_location: 'Work location',
  basic_salary: 'Basic salary',
  allowance_item: 'Allowance item',
  stated_total_pay: 'Stated total pay',
  payment_frequency: 'Payment frequency',
  start_date: 'Start date',
  contract_duration: 'Contract duration',
  renewal_terms: 'Renewal wording',
  probation_period: 'Probation period',
  ordinary_hours: 'Ordinary working hours',
  overtime_terms: 'Overtime wording',
  notice_terms: 'Notice terms',
  termination_terms: 'Termination wording',
  deduction_item: 'Deduction item',
  other_worker_charge: 'Other worker charge',
  recruitment_cost: 'Recruitment cost',
  visa_cost: 'Visa or residency charge',
  residency_cost: 'Residency cost',
  medical_cost: 'Medical cost',
  travel_cost: 'Travel cost',
  accommodation_benefit: 'Accommodation benefit',
  food_benefit: 'Food benefit',
  transport_benefit: 'Transport benefit',
  medical_benefit: 'Medical coverage benefit',
  return_ticket_benefit: 'Travel or return ticket benefit',
  document_language: 'Document language',
  signature_presence: 'Signature presence',
  document_date: 'Document date',
  document_reference: 'Document reference',
  verification_reference: 'Verification reference',
  annex_reference: 'Annex or policy reference',
};

export const FIELD_GROUP_OF: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FIELD_LABELS).map(([fieldKey]) => {
    const group =
      FIELD_GROUPS.find((group) =>
        ({
          employer: ['employer_name'],
          occupation: ['job_title'],
          location: ['work_location'],
          pay: ['basic_salary', 'allowance_item', 'stated_total_pay', 'payment_frequency'],
          term: ['start_date', 'contract_duration', 'renewal_terms'],
          probation: ['probation_period'],
          working_time: ['ordinary_hours', 'overtime_terms'],
          ending_terms: ['notice_terms', 'termination_terms'],
          deductions: ['deduction_item', 'other_worker_charge'],
          recruitment_and_travel_costs: ['recruitment_cost', 'visa_cost', 'residency_cost', 'medical_cost', 'travel_cost'],
          benefits: ['accommodation_benefit', 'food_benefit', 'transport_benefit', 'medical_benefit', 'return_ticket_benefit'],
          document_details: ['document_language', 'signature_presence', 'document_date', 'document_reference', 'verification_reference', 'annex_reference'],
        })[group.key]?.includes(fieldKey),
      )?.key ?? 'document_details';
    return [fieldKey, group];
  }),
);
