/**
 * POST /api/v1/analyses — second step of the documented flow (docs/API.md
 * §5–§6): verify the signed handoff, reconcile corrections, compare
 * deterministically, assemble the structured report. No case is stored; the
 * signed payload is accepted, used, and dropped.
 */
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import {
  CorrectionsSchema,
  IssuedExtractionV1Schema,
  verifyIssuedExtraction,
  type IssuedExtractionV1,
} from '../contracts/index.js';
import type { AppConfig } from '../config.js';
import { HttpError } from '../errors.js';
import { compareDocuments } from '../compare/index.js';
import { InvalidCorrectionError, reconcileCorrections } from '../services/analysis/reconcile.js';
import { assembleReport } from '../services/analysis/report.js';
import type { RetrievalService } from '../services/analysis/retrieval.js';
import { scopeApplicability } from '../services/analysis/scope.js';

const ReviewRequestBodySchema = z.strictObject({
  issuedExtraction: z.record(z.string(), z.unknown()),
  proof: z.unknown(),
  // Shape/count enforced by CorrectionsSchema below so overflows answer
  // 422 INVALID_CORRECTION (docs/API.md §7), not a generic 400.
  corrections: z.array(z.unknown()).default([]),
});

interface RouteDeps {
  readonly config: AppConfig;
  /** Absent (or unconfigured) = honest partial without retrieval (D8). */
  readonly retrieval?: RetrievalService;
}

export function analysesRouter(deps: RouteDeps): Router {
  const router = Router();

  router.post('/api/v1/analyses', (req: Request, res: Response, next) => {
    void handleAnalyses(req, res).catch(next);
  });

  async function handleAnalyses(req: Request, res: Response): Promise<void> {
    const body = ReviewRequestBodySchema.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'BAD_REQUEST', 'The analysis request must carry an issued extraction, its proof, and corrections.');
    }

    // Proof first, on the raw object: tampered payloads must fail before any
    // schema inference. Size bounds were applied by the body parser.
    const verification = verifyIssuedExtraction(
      body.data.issuedExtraction,
      body.data.proof,
      [{ keyId: deps.config.hmac.keyId, secret: deps.config.hmac.secret ?? '' }],
      Date.now(),
    );
    switch (verification.ok ? 'valid' : verification.reason) {
      case 'valid':
        break;
      case 'unsupported_schema_version':
        throw new HttpError(409, 'REVIEW_VERSION_UNSUPPORTED', 'This review is no longer supported. Extract the documents again.');
      case 'expired':
        throw new HttpError(410, 'REVIEW_EXPIRED', 'This review expired. Extract the documents again to continue.');
      case 'unknown_key':
      case 'signature_mismatch':
      case 'malformed':
        throw new HttpError(422, 'REVIEW_INVALID', 'This review can no longer be continued. Extract the documents again.');
    }

    // The signed payload passed integrity; its shape must still be the
    // documented one before anything consumes it.
    const issued: IssuedExtractionV1 = IssuedExtractionV1Schema.parse(body.data.issuedExtraction);

    if (!deps.config.hmac.secret) {
      // Unreachable while extraction enforces the same precondition; kept
      // fail-closed for defense in depth.
      throw new HttpError(503, 'REFERENCE_UNAVAILABLE', 'The analysis service is temporarily unavailable.', { retryable: true });
    }

    const corrections = CorrectionsSchema.safeParse(body.data.corrections);
    if (!corrections.success) {
      throw new HttpError(422, 'INVALID_CORRECTION', 'One of the corrections is not valid.');
    }

    let reconciliation;
    try {
      reconciliation = reconcileCorrections(issued.documents, corrections.data);
    } catch (error) {
      if (error instanceof InvalidCorrectionError) {
        throw new HttpError(422, 'INVALID_CORRECTION', 'One of the corrections does not match the extracted terms.');
      }
      throw error;
    }

    const comparison = compareDocuments({
      offer: reconciliation.offer
        ? { role: reconciliation.offer.document.role, fields: reconciliation.offer.fields }
        : undefined,
      contract: reconciliation.contract
        ? { role: reconciliation.contract.document.role, fields: reconciliation.contract.fields }
        : undefined,
    });

    const applicability = scopeApplicability(issued.scope, issued.documents);
    const retrievalConfigured =
      !!deps.retrieval &&
      !!(deps.config.sanity.contextMcpUrl && deps.config.sanity.projectId && deps.config.sanity.dataset);
    // Retrieval runs inside the same request deadline envelope; it never
    // blocks or degrades the document findings below (docs/ADR-010).
    const retrieval = deps.retrieval
      ? await deps.retrieval.run({
          reconciliation,
          scopeApplicability: applicability,
          analysisDate: new Date(),
          deadlineMs: deps.config.retrieval.timeoutMs,
        })
      : undefined;

    const report = assembleReport({
      issued,
      reconciliation,
      drafts: comparison.findings,
      comparisonApplicable: comparison.comparisonApplicable,
      checkedFieldKeys: comparison.checkedFieldKeys,
      requestId: res.locals.requestId as string,
      reviewedAsOf: new Date(),
      ...(retrieval ? { retrieval } : {}),
      retrievalConfigured,
    });

    res.status(200).json(report);
  }

  return router;
}
