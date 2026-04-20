/**
 * api/orders.ts — Orders API Controller (Vercel Serverless)
 *
 * Actions:
 *   GET  ?action=list          — List orders (optional: ?status=paid)
 *   GET  ?action=get&id=xxx    — Get single order
 *   POST ?action=create        — Create order
 *   POST ?action=update&id=xxx — Update order
 *   POST ?action=delete&id=xxx — Soft-delete order
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors';
import { success, error } from './lib/response';
import * as orderService from './services/order.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;

  try {
    switch (action) {

      case 'list': {
        const status = req.query.status as string | undefined;
        const limit = Number(req.query.limit) || 50;
        const orders = await orderService.listOrders(limit, status);
        return success(res, { orders, count: orders.length });
      }

      case 'get': {
        if (!id) return error(res, 400, 'Missing id parameter');
        const order = await orderService.getOrder(id);
        if (!order) return error(res, 404, 'Order not found');
        return success(res, { order });
      }

      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        const body = req.body || {};
        if (!body.email || !body.items?.length) {
          return error(res, 400, 'Missing required fields: email, items');
        }
        const order = await orderService.createOrder(body);
        return success(res, { order }, 201);
      }

      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const updated = await orderService.updateOrder(id, req.body || {});
        if (!updated) return error(res, 404, 'Order not found');
        return success(res, { order: updated });
      }

      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'Method not allowed');
        if (!id) return error(res, 400, 'Missing id parameter');
        const deleted = await orderService.deleteOrder(id);
        if (!deleted) return error(res, 404, 'Order not found');
        return success(res, { message: 'Order deleted' });
      }

      default:
        return error(res, 400, `Unknown action: ${action}. Use ?action=list|get|create|update|delete`);
    }
  } catch (err: any) {
    console.error(`[orders/${action}]`, err);
    return error(res, 500, 'Internal server error', err.message);
  }
}
