/**
 * api/orders.ts — Admin Orders API (GET /api/orders)
 *
 * Standalone endpoint — reads directly from Redis.
 * No Zoho or heavy service imports. Crash-proof.
 *
 * Query params:
 *   ?limit=50       — max orders (default 50, max 200)
 *   ?status=pending — filter by status
 *   ?id=ORD-1001    — get single order
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// ─── Lazy Redis (no crash at import) ────────────────────────────
let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL / TOKEN not set');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ─── Helper ─────────────────────────────────────────────────────
function parseOrder(raw: unknown): any | null {
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
}

// ─── Handler ────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'GET only' });
  }

  try {
    const redis = getRedis();
    const id = req.query.id as string | undefined;

    // ── Single order lookup ─────────────────────────────────────
    if (id) {
      const raw = await redis.get(`order:${id}`);
      const order = parseOrder(raw);
      if (!order) return res.status(404).json({ ok: false, error: `Order '${id}' not found` });
      return res.status(200).json({ ok: true, order });
    }

    // ── List orders (newest first) ──────────────────────────────
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const statusFilter = req.query.status as string | undefined;

    // Get order IDs from sorted set (newest first)
    const ids: string[] = await redis.zrange('orders:list', 0, -1, { rev: true });

    if (!ids || ids.length === 0) {
      return res.status(200).json({ ok: true, count: 0, orders: [], stats: { total: 0 } });
    }

    // Fetch order data in batch
    const pipeline = redis.pipeline();
    for (const orderId of ids) {
      pipeline.get(`order:${orderId}`);
    }
    const results = await pipeline.exec();

    let orders: any[] = results
      .map((r: any) => parseOrder(r))
      .filter((o: any) => o !== null);

    // Apply status filter
    if (statusFilter) {
      orders = orders.filter((o: any) => o.status === statusFilter);
    }

    // Apply limit
    orders = orders.slice(0, limit);

    // Stats
    const allOrders = results.map((r: any) => parseOrder(r)).filter((o: any) => o !== null);
    const byStatus: Record<string, number> = {};
    let revenue = 0;
    for (const o of allOrders) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.paymentStatus === 'paid') revenue += o.total || 0;
    }

    return res.status(200).json({
      ok: true,
      count: orders.length,
      stats: { total: allOrders.length, byStatus, revenue },
      orders,
    });

  } catch (err: any) {
    console.error('[orders] Error:', err.message, err.stack?.slice(0, 300));
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}