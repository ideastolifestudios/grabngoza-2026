/**
 * api/_lib/redis.ts — Upstash Redis client + idempotency helpers
 *
 * Provides:
 *   - Shared Redis client (Upstash REST)
 *   - Idempotency guard for webhook dedup
 *   - Order persistence helpers
 *
 * Env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis';

// ─── Singleton client ───────────────────────────────────────────
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ─── Idempotency ────────────────────────────────────────────────

const IDEMPOTENCY_PREFIX = 'idem:';
const IDEMPOTENCY_TTL = 60 * 60 * 24 * 7; // 7 days

/**
 * Attempt to claim an idempotency key.
 * Returns true if this is the FIRST time (proceed), false if duplicate.
 */
export async function claimIdempotencyKey(key: string): Promise<boolean> {
  const redis = getRedis();
  // SET NX = only set if not exists. Returns 'OK' on success, null if already exists.
  const result = await redis.set(`${IDEMPOTENCY_PREFIX}${key}`, Date.now(), {
    nx: true,
    ex: IDEMPOTENCY_TTL,
  });
  return result === 'OK';
}

/**
 * Check if an idempotency key was already processed.
 */
export async function isAlreadyProcessed(key: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`${IDEMPOTENCY_PREFIX}${key}`);
  return exists === 1;
}