/**
 * POST /api/v1/extractions — the first step of the documented flow
 * (docs/API.md §4): admit, extract through Gemini, validate, sign. While
 * `customUploadEnabled` is false, every arbitrary upload is rejected with
 * `403 CUSTOM_UPLOAD_DISABLED` before anything is read or buffered.
 */
import { Router, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { signIssuedExtraction, verifyIssuedExtraction } from '../contracts/index.js';
import { isWellFormedSampleCaseId, findSampleEntry, type SampleManifest } from '../content/samples-manifest.js';
import { HttpError } from '../errors.js';
import type { AppConfig } from '../config.js';
import type { GeminiExtractionService } from '../services/gemini/types.js';
import { NothingUsableError, mapModelExtraction, type MapperDocumentInput } from '../services/extraction/mapper.js';
import { PdfStructureError, inspectPdf } from '../services/pdf-structure.js';

const SampleRequestBodySchema = z.strictObject({
  sampleCaseId: z.string().min(1).max(32),
});

const MAGIC_PDF = Buffer.from('%PDF-');

interface RouteDeps {
  readonly config: AppConfig;
  readonly gemini: GeminiExtractionService;
  readonly manifest: SampleManifest;
}

export function extractionsRouter(deps: RouteDeps): Router {
  const router = Router();

  router.post('/api/v1/extractions', (req: Request, res: Response, next) => {
    void handleExtraction(req, res).catch(next);
  });

  async function handleExtraction(req: Request, res: Response): Promise<void> {
    const { config, gemini, manifest } = deps;
    const startedAt = Date.now();

    // Custom-upload gate: closed means every arbitrary file is rejected
    // before any parsing or buffering (docs/API.md §3).
    const contentType = String(req.headers['content-type'] ?? '');
    if (!config.customUploadEnabled && contentType.includes('multipart/form-data')) {
      throw new HttpError(403, 'CUSTOM_UPLOAD_DISABLED', 'Personal document upload is not available right now.');
    }

    if (!config.sampleModeEnabled) {
      throw new HttpError(503, 'EXTRACTION_UNAVAILABLE', 'Sample review is not available on this deployment.', {
        retryable: true,
      });
    }

    const body = SampleRequestBodySchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'BAD_REQUEST', 'The extraction request must carry a sampleCaseId.');
    }
    if (!isWellFormedSampleCaseId(body.data.sampleCaseId)) {
      throw new HttpError(400, 'BAD_REQUEST', 'Unknown sample.');
    }
    const entry = findSampleEntry(manifest, body.data.sampleCaseId);
    if (!entry) {
      throw new HttpError(400, 'BAD_REQUEST', 'Unknown sample.');
    }

    // Missing server-side credentials fail closed before any provider call.
    if (!config.gemini.apiKey || !config.hmac.secret) {
      throw new HttpError(503, 'EXTRACTION_UNAVAILABLE', 'Extraction is temporarily unavailable.', {
        retryable: true,
      });
    }

    // Load and admit the fixture bytes.
    const inputs: Array<MapperDocumentInput & { bytes: Buffer }> = [];
    let totalBytes = 0;
    for (const document of entry.documents) {
      const filePath = path.join(manifest.rootDir, entry.sampleCaseId, document.file);
      const bytes = await readFile(filePath).catch(() => {
        throw new HttpError(503, 'EXTRACTION_UNAVAILABLE', 'The sample is temporarily unavailable.', {
          retryable: true,
        });
      });
      totalBytes += bytes.byteLength;
      if (bytes.byteLength > config.limits.maxBytesPerFile) {
        throw new HttpError(413, 'FILE_TOO_LARGE', 'The sample exceeds the configured size limit.');
      }
      if (totalBytes > config.limits.maxTotalBytes) {
        throw new HttpError(413, 'REQUEST_TOO_LARGE', 'The request exceeds the configured total size limit.');
      }
      if (bytes.byteLength < MAGIC_PDF.byteLength || !bytes.subarray(0, MAGIC_PDF.byteLength).equals(MAGIC_PDF)) {
        throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'The sample file is not a readable PDF.');
      }
      let structure;
      try {
        structure = await inspectPdf(bytes);
      } catch (error) {
        if (error instanceof PdfStructureError) {
          if (error.kind === 'encrypted') {
            throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'The sample file is not a readable PDF.');
          }
          throw new HttpError(422, 'UNREADABLE_DOCUMENT', 'The sample file could not be read.');
        }
        throw error;
      }
      if (structure.pageCount > config.limits.maxPagesPerPdf) {
        throw new HttpError(413, 'TOO_MANY_PAGES', 'The sample exceeds the configured page limit.');
      }
      inputs.push({ role: document.role, pdfBytes: bytes, pageCount: structure.pageCount, bytes });
    }

    // One bounded provider call for the pair (ADR-003).
    const remainingDeadline = config.limits.applicationDeadlineMs - (Date.now() - startedAt);
    const outcome = await gemini.extract({
      documents: inputs.map((input) => ({
        role: input.role,
        pdfBase64: input.bytes.toString('base64'),
      })),
      deadlineMs: Math.max(1_000, remainingDeadline),
    });
    if (!outcome.ok) {
      throw new HttpError(503, 'EXTRACTION_UNAVAILABLE', 'Extraction is temporarily unavailable.', {
        retryable: true,
        stage: 'extraction',
      });
    }

    const notices = [
      'These are fictional synthetic sample documents; all names and figures are invented.',
      'Documents are sent to the configured model provider for extraction.',
    ];

    let mapped;
    try {
      mapped = mapModelExtraction(outcome.modelJson.documents, inputs, notices);
    } catch (error) {
      if (error instanceof NothingUsableError) {
        // Nothing usable ⇒ 422 with no issued payload and no proof.
        throw new HttpError(422, 'UNREADABLE_DOCUMENT', 'No usable extraction could be produced.', {
          stage: 'extraction',
        });
      }
      throw error;
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + config.hmac.ttlMs);
    const issuedExtraction = {
      schemaVersion: 1 as const,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      scope: entry.scope,
      sourceMode: 'sample' as const,
      documents: mapped.documents.map((entry2) => entry2.document),
    };

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret,
    });

    // Self-check: the proof must verify against the exact returned payload.
    const selfCheck = verifyIssuedExtraction(
      issuedExtraction,
      proof,
      [{ keyId: config.hmac.keyId, secret: config.hmac.secret }],
      Date.now(),
    );
    if (!selfCheck.ok) {
      throw new HttpError(503, 'EXTRACTION_UNAVAILABLE', 'Extraction is temporarily unavailable.', {
        retryable: true,
      });
    }

    res.status(200).json({
      requestId: res.locals.requestId as string,
      status: mapped.status,
      issuedExtraction,
      proof,
      stages: {
        extraction: mapped.status === 'complete' ? 'completed' : 'partial',
      },
      notices,
    });
  }

  return router;
}
