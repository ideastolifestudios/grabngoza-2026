/**
 * api/orders.ts — Admin Orders API (GET /api/orders)
 *
 * Returns all orders from Redis, newest first.
 * No frontend required — pure JSON API.
 *
 * Query params:
 *   ?limit=50       — max orders to return (default 50, max 200)
 *   ?status=pending — filter by status
 *   ?id=ORD-1001    — get single order
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './_cors';
import * as orderService from './_services/order.service';
import { createLogger } from './_logger';

const log = createLogger('admin-orders');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  if (setCors(req, res)) return; // OPTIONS handled

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'GET only' });
  }

  try {
    const id = req.query.id as string | undefined;

    // Single order lookup
    if (id) {
      const order = await orderService.getOrder(id);
      if (!order) {
        return res.status(404).json({ ok: false, error: `Order '${id}' not found` });
      }
      return res.status(200).json({ ok: true, order });
    }

    // List orders
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = req.query.status as string | undefined;

    const orders = await orderService.listOrders(limit, status);
    const stats = await orderService.getStats();

    log.info('list', `Returned ${orders.length} orders`, { limit, status, total: stats.total });

    return res.status(200).json({
      ok: true,
      count: orders.length,
      stats,
      orders,
    });

  } catch (err: any) {
    log.error('handler', `Orders API error: ${err.message}`);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}