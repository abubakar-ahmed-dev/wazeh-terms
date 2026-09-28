/**
 * Express app factory. Dependency-injected so offline tests run with fakes
 * (no provider, no real keys). Every `/api/*` and `/health` response carries
 * `Cache-Control: no-store` (docs/API.md §1); errors answer with the
 * documented envelope.
 */
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import type { ErrorCode, StageName } from '../contracts/index.js';
import type { AppConfig } from '../config.js';
import { HttpError } from '../errors.js';
import { logRequest } from '../logging.js';
import { extractionsRouter } from '../routes/extractions.js';
import { findSampleFile, readOnlyRouter } from '../routes/read-only.js';
import type { GeminiExtractionService } from '../services/gemini/types.js';
import type { SampleManifest } from '../content/samples-manifest.js';

export interface AppDeps {
  readonly config: AppConfig;
  readonly gemini: GeminiExtractionService;
  readonly manifest: SampleManifest;
}

export function buildApp(deps: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');

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

  app.use(express.json({ limit: '64kb' }));

  app.use(readOnlyRouter(deps));
  app.use(extractionsRouter(deps));

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

  app.use((_req: Request, res: Response) => {
    res.status(404).json(envelope(res, 'BAD_REQUEST', 'Not found.'));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json(
        envelope(res, error.code, error.message, {
          retryable: error.retryable,
          stage: error.stage,
        }),
      );
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
