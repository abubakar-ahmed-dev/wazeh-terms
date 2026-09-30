/**
 * Admission control middleware (docs/SECURITY.md §6, plans/security-hardening/plan.md item 1):
 * - Rate limiter: Fixed/sliding window request cap per client IP on sensitive routes.
 * - Concurrency limiter: In-flight extraction concurrency cap to prevent resource exhaustion.
 * - Both reject with documented envelopes and Retry-After headers.
 * - Fleet-wide limitation: Per-instance in-memory control only.
 */
import type { Request, Response, NextFunction } from 'express';

import { HttpError } from '../errors.js';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  readonly max: number;
  readonly windowMs: number;
}

export interface ConcurrencyLimiterOptions {
  readonly maxConcurrent: number;
}

export class InMemoryRateLimiter {
  private readonly records = new Map<string, RateLimitRecord>();
  private readonly max: number;
  private readonly windowMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.max = options.max;
    this.windowMs = options.windowMs;

    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (record.resetAt <= now) {
          this.records.delete(key);
        }
      }
    }, Math.max(10_000, options.windowMs));
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip = (req.ip || req.socket.remoteAddress || '127.0.0.1').toString();
      const now = Date.now();

      let record = this.records.get(ip);
      if (!record || record.resetAt <= now) {
        record = { count: 1, resetAt: now + this.windowMs };
        this.records.set(ip, record);
        return next();
      }

      if (record.count >= this.max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
        res.set('Retry-After', String(retryAfterSeconds));
        return next(
          new HttpError(429, 'RATE_LIMITED', 'Too many requests. Please retry later.', {
            retryable: true,
            retryAfterSeconds,
          }),
        );
      }

      record.count += 1;
      next();
    };
  }

  reset(): void {
    this.records.clear();
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.records.clear();
  }
}

export class InMemoryConcurrencyLimiter {
  private activeCount = 0;
  private readonly maxConcurrent: number;

  constructor(options: ConcurrencyLimiterOptions) {
    this.maxConcurrent = options.maxConcurrent;
  }

  middleware() {
    return (_req: Request, res: Response, next: NextFunction): void => {
      if (this.activeCount >= this.maxConcurrent) {
        const retryAfterSeconds = 5;
        res.set('Retry-After', String(retryAfterSeconds));
        return next(
          new HttpError(503, 'SERVICE_BUSY', 'Server is currently handling maximum concurrent extractions. Please retry shortly.', {
            retryable: true,
            stage: 'extraction',
            retryAfterSeconds,
          }),
        );
      }

      this.activeCount += 1;
      let released = false;

      const release = () => {
        if (!released) {
          released = true;
          this.activeCount = Math.max(0, this.activeCount - 1);
        }
      };

      res.on('finish', release);
      res.on('close', release);

      next();
    };
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  reset(): void {
    this.activeCount = 0;
  }
}
