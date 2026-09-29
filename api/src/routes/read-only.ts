/**
 * Read-only endpoints (docs/API.md §2–§3): health probe, capabilities, and
 * the sample manifest metadata. None of them expose credentials, provider
 * details, or document content.
 */
import { Router } from 'express';

import { API_VERSION } from './capabilities-version.js';
import type { AppConfig } from '../config.js';
import { findSampleEntry, type SampleManifest } from '../content/samples-manifest.js';

interface RouteDeps {
  readonly config: AppConfig;
  readonly manifest: SampleManifest;
}

export function readOnlyRouter(deps: RouteDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', version: API_VERSION });
  });

  router.get('/api/v1/capabilities', (_req, res) => {
    const { config } = deps;
    res.status(200).json({
      apiVersion: 'v1',
      sampleModeEnabled: config.sampleModeEnabled,
      customUploadEnabled: config.customUploadEnabled,
      acceptedCustomMimeTypes: ['application/pdf'],
      supportedAnalysisLanguages: ['en'],
      maxDocuments: 2,
      maxBytesPerFile: config.limits.maxBytesPerFile,
      maxTotalBytes: config.limits.maxTotalBytes,
      maxPagesPerPdf: config.limits.maxPagesPerPdf,
      maxCorrections: config.limits.maxCorrections,
      privacyNoticeVersion: config.privacyNoticeVersion,
    });
  });

  router.get('/api/v1/samples', (_req, res) => {
    const { manifest } = deps;
    res.status(200).json({
      samples: manifest.entries.map((entry) => ({
        sampleCaseId: entry.sampleCaseId,
        title: entry.title,
        description: entry.description,
        scope: entry.scope,
        documents: entry.documents.map((document) => ({
          role: document.role,
          previewUrl: document.previewUrl,
        })),
      })),
    });
  });

  return router;
}

/** Static helper used by `server/app.ts` for fixed sample previews. */
export function findSampleFile(
  manifest: SampleManifest,
  caseId: string,
  file: string,
): { absolutePath: string } | undefined {
  const entry = findSampleEntry(manifest, caseId);
  if (!entry) return undefined;
  const document = entry.documents.find((candidate) => candidate.file === file);
  if (!document) return undefined;
  const previewUrl = `/samples/${entry.sampleCaseId}/${document.file}`;
  if (document.previewUrl !== previewUrl) return undefined;
  return { absolutePath: `${manifest.rootDir}/${entry.sampleCaseId}/${document.file}` };
}
