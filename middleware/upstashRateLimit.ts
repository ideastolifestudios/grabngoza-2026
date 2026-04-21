/**
 * middleware/upstashRateLimit.ts
 * Production-grade rate limiting using Upstash Redis.
 * Works in Vercel serverless — state persists across cold starts.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Install: npm install @upstash/ratelimit @upstash/redis
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy-init Redis (avoids errors when env vars not set in dev)
let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting disabled');
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

// ─── Pre-configured limiters ────────────────────────────────────

/** Payment endpoint: 10 requests per 60 seconds per IP */
export const paymentLimiter = createLimiter('payment', {
  requests: 10,
  window: '60 s',
});

/** General API: 100 requests per 60 seconds per IP */
export const apiLimiter = createLimiter('api', {
  requests: 100,
  window: '60 s',
});

/** Webhook: 50 requests per 10 seconds per IP (generous for retries) */
export const webhookLimiter = createLimiter('webhook', {
  requests: 50,
  window: '10 s',
});

// ─── Factory ─────────────────────────────────────────────────────

interface LimiterConfig {
  requests: number;
  window: string; // e.g. "60 s", "1 m", "1 h"
}

function createLimiter(prefix: string, config: LimiterConfig) {
  return {
    /**
     * Check rate limit for a request.
     * Returns { limited: false } if allowed, or sends 429 and returns { limited: true }.
     */
    async check(req: VercelRequest, res: VercelResponse): Promise<{ limited: boolean }> {
      const r = getRedis();
      if (!r) return { limited: false }; // No Redis = no limiting (dev mode)

      const ratelimit = new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(config.requests, config.window as any),
        prefix: `ratelimit:${prefix}`,
      });

      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown';

      const { success, limit, remaining, reset } = await ratelimit.limit(ip);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', reset);

      if (!success) {
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.',
        });
        return { limited: true };
      }

      return { limited: false };
    },
  };
}
