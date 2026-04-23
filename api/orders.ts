/**
 * api/orders.ts — Admin Orders API (GET /api/orders)
 *
 * Standalone — dynamic Redis import, zero top-level side effects.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

let _redis: any = null;
async function getRedis(): Promise<any> {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL / TOKEN not set');
    const { Redis } = await import('@upstash/redis');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

function parseOrder(raw: unknown): any | null {
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  try {
    const redis = await getRedis();
    const id = req.query.id as string | undefined;

    if (id) {
      const raw = await redis.get(`order:${id}`);
      const order = parseOrder(raw);
      if (!order) return res.status(404).json({ ok: false, error: `Order '${id}' not found` });
      return res.status(200).json({ ok: true, order });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const statusFilter = req.query.status as string | undefined;

    const ids: string[] = await redis.zrange('orders:list', 0, -1, { rev: true });
    if (!ids || ids.length === 0) {
      return res.status(200).json({ ok: true, count: 0, orders: [], stats: { total: 0 } });
    }

    const pipeline = redis.pipeline();
    for (const orderId of ids) { pipeline.get(`order:${orderId}`); }
    const results = await pipeline.exec();

    let orders: any[] = results.map((r: any) => parseOrder(r)).filter((o: any) => o !== null);
    const allOrders = [...orders];

    if (statusFilter) orders = orders.filter((o: any) => o.status === statusFilter);
    orders = orders.slice(0, limit);

    const byStatus: Record<string, number> = {};
    let revenue = 0;
    for (const o of allOrders) {
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      if (o.paymentStatus === 'paid') revenue += o.total || 0;
    }

    return res.status(200).json({ ok: true, count: orders.length, stats: { total: allOrders.length, byStatus, revenue }, orders });
  } catch (err: any) {
    console.error('[orders] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'Internal server error', details: err.message });
  }
}