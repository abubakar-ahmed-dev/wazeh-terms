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

/** Repository-bundled manifest: the fictional TC-002 salary-change pair. */
export function loadBundledSampleManifest(): SampleManifest {
  const rootDir = fileURLToPath(new URL('../../../fixtures/samples', import.meta.url));
  return {
    rootDir,
    entries: [
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
    ],
  };
}
