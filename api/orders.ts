/**
 * api/orders.ts — Orders API Controller
 *
 * POST create now syncs: Local → Zoho CRM → Zoho Inventory
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors.ts';
import { success, error } from './lib/response.ts';
import * as orderService from './services/order.service.ts';
import { listZohoItems, getMappings } from './services/zohoInventoryService.ts';

function log(a: string, m: string, d?: any) {
  console.log(`[${new Date().toISOString()}] [orders/${a}] ${m}`, d !== undefined ? JSON.stringify(d) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';
  const id = req.query.id as string;
  const start = Date.now();

  log(action || '-', `${req.method} ?action=${action}${id ? `&id=${id}` : ''}`);

  try {
    switch (action) {

      case 'list': {
        const status = req.query.status as string | undefined;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const orders = await orderService.listOrders(limit, status);
        return success(res, { orders, count: orders.length });
      }

      case 'get': {
        if (!id) return error(res, 400, 'Missing id');
        const order = await orderService.getOrder(id);
        if (!order) return error(res, 404, `Order '${id}' not found`);
        return success(res, { order });
      }

      case 'stats':
        return success(res, { stats: await orderService.getStats() });

      case 'create': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');

        const validationErrors = orderService.validateCreateOrder(req.body || {});
        if (validationErrors.length > 0) {
          return res.status(422).json({ success: false, error: 'Validation failed', validationErrors });
        }

        // Create order → CRM sync → Inventory sync
        const { order, zoho, crm } = await orderService.createOrder(req.body);

        log('create', `${order.id} created`, {
          total: order.total,
          crmSync: crm.success,
          crmAction: crm.action || null,
          crmId: crm.zohoContactId || null,
          inventorySync: zoho.success,
          zohoSOId: zoho.zohoSalesOrderId || null,
        });

        return success(res, { order, zoho, crm }, 201);
      }

      case 'update': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');
        if (!id) return error(res, 400, 'Missing id');
        const body = req.body || {};
        if (Object.keys(body).length === 0) return error(res, 400, 'Body empty');
        const errs = orderService.validateUpdateOrder(body);
        if (errs.length > 0) return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: errs });
        delete body.id; delete body.createdAt;
        const updated = await orderService.updateOrder(id, body);
        if (!updated) return error(res, 404, `Order '${id}' not found`);
        return success(res, { order: updated });
      }

      case 'delete': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');
        if (!id) return error(res, 400, 'Missing id');
        const deleted = await orderService.deleteOrder(id);
        if (!deleted) return error(res, 404, `Order '${id}' not found`);
        return success(res, { message: `Order '${id}' deleted` });
      }

      case 'zoho-items': {
        const page = Number(req.query.page) || 1;
        return success(res, { ...(await listZohoItems(page)), currentMappings: getMappings() });
      }

      default:
        return error(res, 400, `Unknown action: '${action}'`);
    }
  } catch (err: any) {
    console.error(`[orders/${action}] ERROR:`, err);
    return error(res, 500, 'Internal server error', err.message);
  } finally {
    log(action || '-', `Done ${Date.now() - start}ms`);
  }
}
