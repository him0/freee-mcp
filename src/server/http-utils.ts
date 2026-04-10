import type { Request } from 'express';

/**
 * Extract the client's originating IP address from a request.
 *
 * Honors the first value in an `X-Forwarded-For` header (set by the envoy
 * gateway / ALB in front of freee-mcp); falls back to `req.ip` otherwise.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') {
    return xff.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}
