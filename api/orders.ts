/**
 * api/orders.ts — Orders API Controller (Vercel Serverless)
 *
 * Endpoints (via ?action= query param):
 *   GET   ?action=list              — List orders (optional: ?status=paid&limit=50)
 *   GET   ?action=get&id=ORD-1001   — Get single order
 *   GET   ?action=stats             — Order stats summary
 *   POST  ?action=create            — Create order (validated)
 *   POST  ?action=update&id=xxx     — Update order fields
 *   POST  ?action=delete&id=xxx     — Delete order
 *
 * All responses follow: { success: boolean, ...data } or { success: false, error: string }
 *
 * NO Zoho / payment integration — pure order CRUD with in-memory mock.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors.ts';
import { success, error } from './lib/response.ts';
import * as orderService from './services/order.service.ts';

// ─── Simple logger ──────────────────────────────────────────────
function log(action: string, msg: string, data?: any) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [orders/${action}] ${msg}`, data !== undefined ? JSON.stringify(data) : '');
}

function logError(action: string, msg: string, err?: any) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [orders/${action}] ERROR: ${msg}`, err?.message || err || '');
}

// ─── Handler ────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;
  const startTime = Date.now();

  log(action || 'unknown', `${req.method} /api/orders?action=${action}${id ? `&id=${id}` : ''}`);

  try {
    switch (action) {

      // ── LIST ─────────────────────────────────────────────────
      case 'list': {
        const status = req.query.status as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 50, 200);

        const orders = await orderService.listOrders(limit, status);
        log('list', `Returned ${orders.length} orders`, { status, limit });

        return success(res, { orders, count: orders.length });
      }

      // ── GET ──────────────────────────────────────────────────
      case 'get': {
        if (!id) return error(res, 400, 'Missing id parameter. Use ?action=get&id=ORD-1001');

        const order = await orderService.getOrder(id);
        if (!order) {
          log('get', `Order not found: ${id}`);
          return error(res, 404, `Order '${id}' not found`);
        }

        log('get', `Found order ${id}`);
        return success(res, { order });
      }

      // ── STATS ────────────────────────────────────────────────
      case 'stats': {
        const stats = await orderService.getStats();
        log('stats', 'Stats retrieved', stats);
        return success(res, { stats });
      }

      // ── CREATE ───────────────────────────────────────────────
      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'POST required for create');

        const body = req.body || {};

        // Validate
        const validationErrors = orderService.validateCreateOrder(body);
        if (validationErrors.length > 0) {
          log('create', `Validation failed: ${validationErrors.length} errors`, validationErrors);
          return res.status(422).json({
            success: false,
            error: 'Validation failed',
            validationErrors,
          });
        }

        const order = await orderService.createOrder(body);
        log('create', `Order created: ${order.id}`, {
          email: order.email,
          items: order.items.length,
          total: order.total,
        });

        return success(res, { order }, 201);
      }

      // ── UPDATE ───────────────────────────────────────────────
      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'POST required for update');
        if (!id) return error(res, 400, 'Missing id parameter. Use ?action=update&id=ORD-1001');

        const updateBody = req.body || {};
        if (Object.keys(updateBody).length === 0) {
          return error(res, 400, 'Request body cannot be empty');
        }

        // Validate update fields
        const updateErrors = orderService.validateUpdateOrder(updateBody);
        if (updateErrors.length > 0) {
          log('update', `Validation failed for ${id}`, updateErrors);
          return res.status(422).json({
            success: false,
            error: 'Validation failed',
            validationErrors: updateErrors,
          });
        }

        // Prevent overwriting protected fields
        delete updateBody.id;
        delete updateBody.createdAt;

        const updated = await orderService.updateOrder(id, updateBody);
        if (!updated) {
          log('update', `Order not found: ${id}`);
          return error(res, 404, `Order '${id}' not found`);
        }

        log('update', `Order updated: ${id}`, { fields: Object.keys(updateBody) });
        return success(res, { order: updated });
      }

      // ── DELETE ───────────────────────────────────────────────
      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'POST required for delete');
        if (!id) return error(res, 400, 'Missing id parameter');

        const deleted = await orderService.deleteOrder(id);
        if (!deleted) {
          log('delete', `Order not found: ${id}`);
          return error(res, 404, `Order '${id}' not found`);
        }

        log('delete', `Order deleted: ${id}`);
        return success(res, { message: `Order '${id}' deleted` });
      }

      // ── UNKNOWN ACTION ──────────────────────────────────────
      default:
        return error(res, 400, `Unknown action: '${action}'. Use ?action=list|get|stats|create|update|delete`);
    }
  } catch (err: any) {
    logError(action, 'Unhandled exception', err);
    return error(res, 500, 'Internal server error', err.message);
  } finally {
    log(action || 'unknown', `Completed in ${Date.now() - startTime}ms`);
  }
}
