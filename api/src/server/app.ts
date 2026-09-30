/**
 * Express app factory. Dependency-injected so offline tests run with fakes
 * (no provider, no real keys). Every `/api/*` and `/health` response carries
 * `Cache-Control: no-store` (docs/API.md §1); errors answer with the
 * documented envelope.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { ErrorCode, StageName } from '../contracts/index.js';
import type { AppConfig } from '../config.js';
import { HttpError } from '../errors.js';
import { logRequest } from '../logging.js';
import { analysesRouter } from '../routes/analyses.js';
import { extractionsRouter } from '../routes/extractions.js';
import { findSampleFile, readOnlyRouter } from '../routes/read-only.js';
import type { GeminiExtractionService } from '../services/gemini/types.js';
import type { RetrievalService } from '../services/analysis/retrieval.js';
import type { SampleManifest } from '../content/samples-manifest.js';
import { InMemoryRateLimiter, InMemoryConcurrencyLimiter } from './admission.js';
import { securityHeadersMiddleware } from './security-headers.js';

export interface AppDeps {
  readonly config: AppConfig;
  readonly gemini: GeminiExtractionService;
  readonly manifest: SampleManifest;
  /** Phase 10: injected when the retrieval chain is configured. */
  readonly retrieval?: RetrievalService;
  readonly rateLimiter?: InMemoryRateLimiter;
  readonly concurrencyLimiter?: InMemoryConcurrencyLimiter;
}

export function buildApp(deps: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware());

  const rateLimiter = deps.rateLimiter ?? new InMemoryRateLimiter({
    max: deps.config.security.rateLimitMax,
    windowMs: deps.config.security.rateLimitWindowMs,
  });
  const concurrencyLimiter = deps.concurrencyLimiter ?? new InMemoryConcurrencyLimiter({
    maxConcurrent: deps.config.security.maxConcurrentExtractions,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.requestId = `req_${randomUUID()}`;
    res.locals.startedAt = Date.now();
    if (req.path.startsWith('/api/') || req.path === '/health') {
      res.set('Cache-Control', 'no-store');
    }
    res.on('finish', () => {
      const errorClass = res.locals.errorClass as string | undefined;
      logRequest({
        requestId: res.locals.requestId as string,
        route: req.path,
        method: req.method,
        outcome: res.statusCode < 400 ? 'ok' : 'error',
        status: res.statusCode,
        durationMs: Date.now() - (res.locals.startedAt as number),
        ...(errorClass ? { errorClass } : {}),
      });
    });
    next();
  });

  // Admission control: rate limiter on sensitive endpoints; concurrency cap on extractions
  app.use('/api/v1/extractions', rateLimiter.middleware());
  app.use('/api/v1/extractions', concurrencyLimiter.middleware());
  app.use('/api/v1/analyses', rateLimiter.middleware());

  // Analyses requests carry the full signed extraction; the bound is a
  // coarse ceiling until measured limits replace it (Phase 13/14).
  app.use(express.json({ limit: '512kb' }));

  app.use(readOnlyRouter(deps));
  app.use(extractionsRouter(deps));
  app.use(analysesRouter({ config: deps.config, ...(deps.retrieval ? { retrieval: deps.retrieval } : {}) }));

  app.get('/samples/:caseId/:file', (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      const { caseId, file } = req.params as { caseId?: string; file?: string };
      if (!caseId || !file || caseId.includes('..') || file.includes('..') || file.includes('/')) {
        res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
        return;
      }
      const found = findSampleFile(deps.manifest, caseId, file);
      if (!found) {
        res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
        return;
      }
      const bytes = await readFile(found.absolutePath).catch(() => undefined);
      if (!bytes) {
        res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
        return;
      }
      res.type('application/pdf').status(200).send(bytes);
    })().catch(next);
  });

  // Built React assets + SPA fallback (ADR-008): /api/*, /health, and
  // /samples/* are reserved above; everything else falls back to index.html
  // when the web build exists (API-only deployments keep the JSON 404).
  const webDistCandidates = [
    path.resolve(process.cwd(), 'web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../web/dist'),
  ];
  const webDist = webDistCandidates.find((candidate) => existsSync(candidate));
  if (webDist) {
    const serveIndex = (res: Response) => {
      void readFile(path.join(webDist, 'index.html'))
        .then((html) => {
          res.set('Content-Type', 'text/html; charset=utf-8').status(200).send(html);
        })
        .catch(() => {
          res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
        });
    };
    app.use(express.static(webDist, { index: false, maxAge: '1h' }));
    app.get('/', (_req: Request, res: Response) => {
      serveIndex(res);
    });
    app.get('/*splat', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/') || req.path === '/health' || req.path.startsWith('/samples')) {
        res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
        return;
      }
      serveIndex(res);
    });
  }

  app.use((_req: Request, res: Response) => {
    res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      if (error.retryAfterSeconds) {
        res.set('Retry-After', String(error.retryAfterSeconds));
      }
      res.status(error.status).json(
        envelope(res, error.code, error.message, {
          retryable: error.retryable,
          stage: error.stage,
        }),
      );
      return;
    }

    // Body parser payload too large (API.md §7 413 REQUEST_TOO_LARGE)
    const errObj = error as { type?: string; status?: number } | null | undefined;
    if (errObj?.status === 413 || errObj?.type === 'entity.too.large') {
      res.status(413).json(envelope(res, 'REQUEST_TOO_LARGE', 'The request payload is too large.', { retryable: false }));
      return;
    }

    // Unexpected failure: safe envelope, no internals echoed.
    res.locals.errorClass = (error as Error)?.name ?? 'UnknownError';
    res.status(500).json(envelope(res, 'INTERNAL_ERROR', 'Something went wrong.', { retryable: false }));
  });

  function envelope(
    res: Response,
    code: ErrorCode,
    message: string,
    options: { retryable?: boolean; stage?: StageName } = {},
  ) {
    return {
      error: {
        code,
        message,
        ...(options.stage ? { stage: options.stage } : {}),
        retryable: options.retryable ?? false,
      },
      requestId: res.locals.requestId as string,
    };
  }

  return app;
}
