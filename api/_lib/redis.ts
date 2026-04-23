/**
 * api/_lib/redis.ts — Upstash Redis client + idempotency
 * Dynamic import — safe to import from any module.
 */

let _redis: any = null;

export async function getRedis(): Promise<any> {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL / TOKEN not set');
    const { Redis } = await import('@upstash/redis');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

export async function claimIdempotencyKey(key: string): Promise<boolean> {
  const redis = await getRedis();
  const result = await redis.set(`idem:${key}`, Date.now(), { nx: true, ex: 604800 });
  return result === 'OK';
}

export async function isAlreadyProcessed(key: string): Promise<boolean> {
  const redis = await getRedis();
  return (await redis.exists(`idem:${key}`)) === 1;
}