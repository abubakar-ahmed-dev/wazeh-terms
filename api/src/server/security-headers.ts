/**
 * Security headers middleware (docs/SECURITY.md §4, plans/security-hardening/plan.md item 4).
 * Enforces defensive headers on API and SPA responses while preserving zero-CORS same-origin posture.
 */
import type { Request, Response, NextFunction } from 'express';

const CSP_POLICY = [
  "default-src 'self'",
  "frame-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

export function securityHeadersMiddleware() {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.set({
      'Content-Security-Policy': CSP_POLICY,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });

    // Ensure no permissive CORS headers are attached (ADR-008 same-origin topology)
    res.removeHeader('Access-Control-Allow-Origin');
    res.removeHeader('Access-Control-Allow-Methods');
    res.removeHeader('Access-Control-Allow-Headers');

    next();
  };
}
