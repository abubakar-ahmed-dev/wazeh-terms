/**
 * Server-side sample allowlist (docs/API.md §3–§4): a `sampleCaseId` is a key
 * into this manifest, never a filesystem path. Entries map to bundled
 * fictional fixtures under `fixtures/samples/` and carry the declared scope
 * sent to Gemini with the sample bytes.
 */
import { fileURLToPath } from 'node:url';

export type SampleScope = {
  origin: 'PK';
  destination: 'AE';
  declaredRegime: 'uae_mainland_private' | 'unknown' | 'other';
  declaredWorkerCategory: 'non_domestic' | 'domestic' | 'unknown';
};

export interface SampleDocumentEntry {
  readonly role: 'offer' | 'contract';
  /** Fixture file name inside the case directory. */
  readonly file: string;
  /** Fixed same-origin preview path served by the static route. */
  readonly previewUrl: string;
}

export interface SampleManifestEntry {
  readonly sampleCaseId: string;
  readonly title: string;
  readonly description: string;
  readonly scope: SampleScope;
  readonly documents: readonly SampleDocumentEntry[];
}

export interface SampleManifest {
  /** Directory containing one subdirectory per sample case. */
  readonly rootDir: string;
  readonly entries: readonly SampleManifestEntry[];
}

const CASE_ID_REGEX = /^[A-Z0-9-]{1,32}$/;

export function isWellFormedSampleCaseId(sampleCaseId: string): boolean {
  return CASE_ID_REGEX.test(sampleCaseId);
}

export function findSampleEntry(
  manifest: SampleManifest,
  sampleCaseId: string,
): SampleManifestEntry | undefined {
  return manifest.entries.find((entry) => entry.sampleCaseId === sampleCaseId);
}

/** Repository-bundled manifest: the six production demo samples (Phase 07/11, release-polish WI-8). */
export function loadBundledSampleManifest(): SampleManifest {
  const rootDir = fileURLToPath(new URL('../../../fixtures/samples', import.meta.url));
  const entry = (
    sampleCaseId: string,
    title: string,
    description: string,
    documents: ReadonlyArray<{ role: 'offer' | 'contract'; file: string }>,
  ): SampleManifestEntry => ({
    sampleCaseId,
    title,
    description,
    scope: {
      origin: 'PK',
      destination: 'AE',
      declaredRegime: 'uae_mainland_private',
      declaredWorkerCategory: 'non_domestic',
    },
    documents: documents.map((document) => ({
      role: document.role,
      file: document.file,
      previewUrl: `/samples/${sampleCaseId}/${document.file}`,
    })),
  });

  return {
    rootDir,
    entries: [
      entry(
        'TC-001',
        'Fictional consistent pair',
        'An offer and contract that agree on salary, hours, and benefits — fictional employer Desert Bloom Contracting LLC. A check with no flagged difference.',
        [
          { role: 'offer', file: 'offer.pdf' },
          { role: 'contract', file: 'contract.pdf' },
        ],
      ),
      {
        sampleCaseId: 'TC-002',
        title: 'Fictional salary change',
        description:
          'An offer and a contract from the fictional employer Gulf Horizon Facilities Services LLC. The basic salary and stated total differ between the two documents.',
        scope: {
          origin: 'PK',
          destination: 'AE',
          declaredRegime: 'uae_mainland_private',
          declaredWorkerCategory: 'non_domestic',
        },
        documents: [
          { role: 'offer', file: 'sample-offer.pdf', previewUrl: '/samples/TC-002/sample-offer.pdf' },
          { role: 'contract', file: 'sample-contract.pdf', previewUrl: '/samples/TC-002/sample-contract.pdf' },
        ],
      },
      entry(
        'TC-012',
        'Fictional worker-charge question',
        'Fictional employer Al Noor Technical Services LLC states recruitment and visa costs, and the two documents disagree about who pays them. When source checks are configured, this can also raise an official-source question.',
        [
          { role: 'offer', file: 'offer.pdf' },
          { role: 'contract', file: 'contract.pdf' },
        ],
      ),
      entry(
        'TC-013',
        'Fictional missing notice terms',
        'A fictional pair from Meridian Gulf Catering LLC where the notice period is missing from both documents. Shows how a missing term is reported — absence is not a denial.',
        [
          { role: 'offer', file: 'offer.pdf' },
          { role: 'contract', file: 'contract.pdf' },
        ],
      ),
      entry(
        'TC-014',
        'Fictional single contract (abstention)',
        'Only a fictional contract from Coastal Star General Trading LLC. With a single document there is nothing to compare: the review shows the terms found and flags what a one-document check cannot determine, without guessing.',
        [{ role: 'contract', file: 'contract.pdf' }],
      ),
      entry(
        'TC-015',
        'Fictional adversarial instructions',
        'A fictional pair from Sandstorm Marine Equipment LLC with sentences embedded in the documents that try to instruct automated systems. Shows instructions being treated as data: no injected content, no seeded-value effect, and an honest partial report.',
        [
          { role: 'offer', file: 'offer.pdf' },
          { role: 'contract', file: 'contract.pdf' },
        ],
      ),
    ],
  };
}
