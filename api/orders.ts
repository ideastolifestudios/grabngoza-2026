/**
 * api/orders.ts — Orders API Controller (Vercel Serverless)
 *
 * Endpoints:
 *   GET   ?action=list              — List orders
 *   GET   ?action=get&id=ORD-1001   — Get single order
 *   GET   ?action=stats             — Stats summary
 *   GET   ?action=zoho-items        — List Zoho Inventory items (for mapping)
 *   POST  ?action=create            — Create order → sync to Zoho Inventory
 *   POST  ?action=update&id=xxx     — Update order
 *   POST  ?action=delete&id=xxx     — Delete order
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors.ts';
import { success, error } from './lib/response.ts';
import * as orderService from './services/order.service.ts';
import { listZohoItems, getMappings } from './services/zohoInventoryService.ts';

// ─── Logger ─────────────────────────────────────────────────────
function log(action: string, msg: string, data?: any) {
  console.log(`[${new Date().toISOString()}] [orders/${action}] ${msg}`, data !== undefined ? JSON.stringify(data) : '');
}
function logError(action: string, msg: string, err?: any) {
  console.error(`[${new Date().toISOString()}] [orders/${action}] ERROR: ${msg}`, err?.message || err || '');
}

// ─── Handler ────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;
  const start = Date.now();

  log(action || 'unknown', `${req.method} ?action=${action}${id ? `&id=${id}` : ''}`);

  try {
    switch (action) {

      // ── LIST ─────────────────────────────────────────────────
      case 'list': {
        const status = req.query.status as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const orders = await orderService.listOrders(limit, status);
        log('list', `${orders.length} orders`);
        return success(res, { orders, count: orders.length });
      }

      // ── GET ──────────────────────────────────────────────────
      case 'get': {
        if (!id) return error(res, 400, 'Missing id parameter');
        const order = await orderService.getOrder(id);
        if (!order) return error(res, 404, `Order '${id}' not found`);
        return success(res, { order });
      }

      // ── STATS ────────────────────────────────────────────────
      case 'stats': {
        const stats = await orderService.getStats();
        return success(res, { stats });
      }

      // ── CREATE (with Zoho sync) ──────────────────────────────
      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');

        // Validate
        const validationErrors = orderService.validateCreateOrder(req.body || {});
        if (validationErrors.length > 0) {
          log('create', `Validation failed: ${validationErrors.length} errors`);
          return res.status(422).json({ success: false, error: 'Validation failed', validationErrors });
        }

        // Create order + Zoho sync
        const { order, zoho } = await orderService.createOrder(req.body);

        log('create', `Order ${order.id} created`, {
          items: order.items.length,
          total: order.total,
          zohoSync: zoho.success,
          zohoId: zoho.zohoSalesOrderId || null,
        });

        // Return both local order AND Zoho result
        return success(res, { order, zoho }, 201);
      }

      // ── UPDATE ───────────────────────────────────────────────
      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');
        if (!id) return error(res, 400, 'Missing id parameter');
        const updateBody = req.body || {};
        if (Object.keys(updateBody).length === 0) return error(res, 400, 'Body cannot be empty');

        const updateErrors = orderService.validateUpdateOrder(updateBody);
        if (updateErrors.length > 0)
          return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: updateErrors });

        delete updateBody.id;
        delete updateBody.createdAt;

        const updated = await orderService.updateOrder(id, updateBody);
        if (!updated) return error(res, 404, `Order '${id}' not found`);
        return success(res, { order: updated });
      }

      // ── DELETE ───────────────────────────────────────────────
      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');
        if (!id) return error(res, 400, 'Missing id parameter');
        const deleted = await orderService.deleteOrder(id);
        if (!deleted) return error(res, 404, `Order '${id}' not found`);
        return success(res, { message: `Order '${id}' deleted` });
      }

      // ── ZOHO ITEMS (helper for discovering item_ids) ─────────
      case 'zoho-items': {
        const page = Number(req.query.page) || 1;
        const items = await listZohoItems(page);
        const mappings = getMappings();
        return success(res, { ...items, currentMappings: mappings });
      }

      default:
        return error(res, 400, `Unknown action: '${action}'. Use: list|get|stats|create|update|delete|zoho-items`);
    }
  } catch (err: any) {
    logError(action, 'Unhandled exception', err);
    return error(res, 500, 'Internal server error', err.message);
  } finally {
    log(action || 'unknown', `Done in ${Date.now() - start}ms`);
  }
}
