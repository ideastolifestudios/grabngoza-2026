/**
 * middleware/rateLimit.ts
 * In-memory sliding-window rate limiter — no Redis needed on Vercel/Express.
 * Usage: app.use('/api/create-yoco-payment', rateLimit({ windowMs: 60_000, max: 10 }))
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // e.g. 60_000 = 1 minute
  max: number;       // max requests per window per IP
  message?: string;
}

interface HitRecord {
  count: number;
  resetAt: number;
}

// Module-level store — survives across requests in a single process instance.
// On Vercel serverless each function is isolated, so limits are per-instance.
// For true global limits add Upstash Redis (see README).
const store = new Map<string, HitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    if (rec.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = opts;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Prefer the real IP forwarded by Vercel/proxies
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const key = `${req.path}::${ip}`;
    const now = Date.now();
    const rec = store.get(key);

    if (!rec || rec.resetAt < now) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    rec.count++;

    const remaining = Math.max(0, max - rec.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rec.resetAt / 1000));

    if (rec.count > max) {
      res.status(429).json({ success: false, error: message });
      return;
    }

    next();
  };
}

// Pre-configured limiters for common endpoints
export const paymentLimiter   = rateLimit({ windowMs: 60_000,  max: 10,  message: 'Payment requests limited. Please wait a minute.' });
export const orderLimiter     = rateLimit({ windowMs: 60_000,  max: 20,  message: 'Too many order requests.' });
export const webhookLimiter   = rateLimit({ windowMs: 10_000,  max: 50,  message: 'Webhook rate exceeded.' });
export const generalApiLimiter = rateLimit({ windowMs: 60_000, max: 100, message: 'API rate limit exceeded.' });
