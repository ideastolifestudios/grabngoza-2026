/**
 * api/store-api.ts — Consolidated Store API (Vercel Serverless)
 *
 * Single function handling: orders, customers, products, shipping-calc.
 * Routes via ?resource=orders&action=create pattern.
 *
 * This consolidation keeps us under Vercel Hobby's 12-function limit.
 *
 * Endpoints:
 *   ?resource=orders&action=list|get|stats|create|update|delete
 *   ?resource=customers&action=list|get|find|create|update|delete
 *   ?resource=products&action=list|get|create|update|delete|stock
 *   ?resource=shipping&action=calculate|rates|health
 *   ?resource=zoho&action=items  (Zoho Inventory item discovery)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './_lib/cors.ts';
import { success, error } from './_lib/response.ts';

// Services
import * as orderService from './_services/order.service.ts';
import * as customerService from './_services/customer.service.ts';
import * as productService from './_services/product.service.ts';
import * as shippingService from './_services/shipping.service.ts';
import { listZohoItems, getMappings } from './_services/zohoInventoryService.ts';

// ─── Logger ─────────────────────────────────────────────────────
function log(r: string, a: string, m: string, d?: any) {
  console.log(`[${new Date().toISOString()}] [${r}/${a}] ${m}`, d ? JSON.stringify(d) : '');
}

// ─── Handler ────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = (req.query.resource as string) || '';
  const action = (req.query.action as string) || '';
  const id = req.query.id as string;
  const start = Date.now();

  if (!resource) return error(res, 400, 'Missing ?resource= parameter. Use: orders|customers|products|shipping|zoho');
  if (!action)   return error(res, 400, 'Missing ?action= parameter');

  log(resource, action, `${req.method} ?resource=${resource}&action=${action}${id ? `&id=${id}` : ''}`);

  try {
    switch (resource) {

      // ══════════════════════════════════════════════════════════
      // ORDERS
      // ══════════════════════════════════════════════════════════
      case 'orders': {
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
            const errs = orderService.validateCreateOrder(req.body || {});
            if (errs.length > 0) return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: errs });
            const { order, zoho, crm } = await orderService.createOrder(req.body);
            log('orders', 'create', `${order.id}`, { total: order.total, crm: crm.success, zoho: zoho.success });
            return success(res, { order, zoho, crm }, 201);
          }
          case 'update': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const body = req.body || {};
            const uerrs = orderService.validateUpdateOrder(body);
            if (uerrs.length > 0) return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: uerrs });
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
          default: return error(res, 400, `Unknown orders action: '${action}'`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // CUSTOMERS
      // ══════════════════════════════════════════════════════════
      case 'customers': {
        switch (action) {
          case 'list': {
            const limit = Math.min(Number(req.query.limit) || 50, 200);
            const customers = await customerService.listCustomers(limit);
            return success(res, { customers, count: customers.length });
          }
          case 'get': {
            if (!id) return error(res, 400, 'Missing id');
            const customer = await customerService.getCustomer(id);
            if (!customer) return error(res, 404, 'Customer not found');
            return success(res, { customer });
          }
          case 'find': {
            const email = req.query.email as string;
            if (!email) return error(res, 400, 'Missing email');
            const customer = await customerService.getCustomerByEmail(email);
            if (!customer) return error(res, 404, 'Customer not found');
            return success(res, { customer });
          }
          case 'create': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const b = req.body || {};
            if (!b.email || !b.firstName || !b.lastName) return error(res, 400, 'Missing: email, firstName, lastName');
            const customer = await customerService.createCustomer(b);
            return success(res, { customer }, 201);
          }
          case 'update': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const updated = await customerService.updateCustomer(id, req.body || {});
            if (!updated) return error(res, 404, 'Customer not found');
            return success(res, { customer: updated });
          }
          case 'delete': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const deleted = await customerService.deleteCustomer(id);
            if (!deleted) return error(res, 404, 'Customer not found');
            return success(res, { message: 'Customer deleted' });
          }
          default: return error(res, 400, `Unknown customers action: '${action}'`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // PRODUCTS
      // ══════════════════════════════════════════════════════════
      case 'products': {
        switch (action) {
          case 'list': {
            const category = req.query.category as string | undefined;
            const limit = Math.min(Number(req.query.limit) || 100, 200);
            const products = await productService.listProducts(limit, category);
            return success(res, { products, count: products.length });
          }
          case 'get': {
            if (!id) return error(res, 400, 'Missing id');
            const product = await productService.getProduct(id);
            if (!product) return error(res, 404, 'Product not found');
            return success(res, { product });
          }
          case 'create': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const b = req.body || {};
            if (!b.name || b.price === undefined) return error(res, 400, 'Missing: name, price');
            const product = await productService.createProduct(b);
            return success(res, { product }, 201);
          }
          case 'update': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const updated = await productService.updateProduct(id, req.body || {});
            if (!updated) return error(res, 404, 'Product not found');
            return success(res, { product: updated });
          }
          case 'delete': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const deleted = await productService.deleteProduct(id);
            if (!deleted) return error(res, 404, 'Product not found');
            return success(res, { message: 'Product deactivated' });
          }
          case 'stock': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            if (!id) return error(res, 400, 'Missing id');
            const { stockKey, quantity } = req.body || {};
            if (!stockKey || quantity === undefined) return error(res, 400, 'Missing: stockKey, quantity');
            const ok = await productService.updateStock(id, stockKey, quantity);
            if (!ok) return error(res, 404, 'Product not found');
            return success(res, { message: 'Stock updated' });
          }
          default: return error(res, 400, `Unknown products action: '${action}'`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // SHIPPING CALCULATOR
      // ══════════════════════════════════════════════════════════
      case 'shipping': {
        switch (action) {
          case 'calculate': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const errs = shippingService.validateShippingInput(req.body || {});
            if (errs.length > 0) return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: errs });
            return success(res, { shipping: shippingService.calculateShipping(req.body) });
          }
          case 'rates': {
            const total = Number(req.query.total) || 0;
            return success(res, { rates: shippingService.getAllRates(total), free_shipping_threshold: 1000 });
          }
          case 'health':
            return success(res, { status: 'ok', service: 'shipping-calc' });
          default: return error(res, 400, `Unknown shipping action: '${action}'`);
        }
      }

      // ══════════════════════════════════════════════════════════
      // ZOHO HELPERS
      // ══════════════════════════════════════════════════════════
      case 'zoho': {
        switch (action) {
          case 'items': {
            const page = Number(req.query.page) || 1;
            return success(res, { ...(await listZohoItems(page)), currentMappings: getMappings() });
          }
          default: return error(res, 400, `Unknown zoho action: '${action}'`);
        }
      }

      default:
        return error(res, 400, `Unknown resource: '${resource}'. Use: orders|customers|products|shipping|zoho`);
    }
  } catch (err: any) {
    console.error(`[store-api/${resource}/${action}] ERROR:`, err);
    return error(res, 500, 'Internal server error', err.message);
  } finally {
    log(resource, action, `Done ${Date.now() - start}ms`);
  }
}
