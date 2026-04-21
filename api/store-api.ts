/**
 * api/store-api.ts — Consolidated Store API
 *
 * Order flow (payment-gated):
 *   1. POST ?resource=orders&action=create        → pending order (no Zoho)
 *   2. POST ?resource=orders&action=confirm        → mark paid → CRM + Inventory
 *   3. POST ?resource=orders&action=simulate-payment → dev testing (success/failed)
 *
 * Ready for Yoco webhook: webhook hits ?resource=orders&action=confirm
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './_lib/cors.ts';
import { success, error } from './_lib/response.ts';
import * as orderService from './_services/order.service.ts';
import * as customerService from './_services/customer.service.ts';
import * as productService from './_services/product.service.ts';
import * as shippingService from './_services/shipping.service.ts';
import { listZohoItems, getMappings } from './_services/zohoInventoryService.ts';

function log(r: string, a: string, m: string, d?: any) {
  console.log(`[${new Date().toISOString()}] [${r}/${a}] ${m}`, d ? JSON.stringify(d) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const resource = (req.query.resource as string) || '';
  const action   = (req.query.action as string) || '';
  const id       = req.query.id as string;
  const start    = Date.now();

  if (!resource) return error(res, 400, 'Missing ?resource=');
  if (!action)   return error(res, 400, 'Missing ?action=');

  log(resource, action, `${req.method}`);

  try {
    switch (resource) {

      // ══════════════════════════════════════════════════════════
      // ORDERS (payment-gated)
      // ══════════════════════════════════════════════════════════
      case 'orders': {
        switch (action) {

          // List / Get / Stats
          case 'list': {
            const status = req.query.status as string | undefined;
            const limit = Math.min(Number(req.query.limit) || 50, 200);
            return success(res, { orders: await orderService.listOrders(limit, status) });
          }
          case 'get': {
            if (!id) return error(res, 400, 'Missing id');
            const order = await orderService.getOrder(id);
            if (!order) return error(res, 404, `Order '${id}' not found`);
            return success(res, { order });
          }
          case 'stats':
            return success(res, { stats: await orderService.getStats() });

          // Step 1: Create pending order (NO Zoho sync yet)
          case 'create': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const errs = orderService.validateCreateOrder(req.body || {});
            if (errs.length > 0)
              return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: errs });

            const order = await orderService.createOrder(req.body);
            log('orders', 'create', `${order.id} created (pending payment)`, { total: order.total });
            return success(res, { order, message: 'Order created. Proceed to payment.' }, 201);
          }

          // Step 2: Confirm after payment → triggers Zoho sync
          case 'confirm': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const { orderId, paymentRef } = req.body || {};
            if (!orderId) return error(res, 400, 'Missing orderId');

            const result = await orderService.confirmOrder(orderId, paymentRef);
            if (!result) return error(res, 404, `Order '${orderId}' not found`);

            log('orders', 'confirm', `${orderId} confirmed`, {
              crm: result.crm.success, zoho: result.zoho.success,
            });
            return success(res, { order: result.order, zoho: result.zoho, crm: result.crm });
          }

          // Step 2 (alt): Simulate payment for dev/testing
          case 'simulate-payment': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const { orderId: simId, paymentStatus: simStatus } = req.body || {};
            if (!simId)    return error(res, 400, 'Missing orderId');
            if (!['success', 'failed'].includes(simStatus))
              return error(res, 400, 'paymentStatus must be "success" or "failed"');

            if (simStatus === 'failed') {
              const cancelled = await orderService.cancelOrder(simId, 'Simulated payment failure');
              if (!cancelled) return error(res, 404, `Order '${simId}' not found`);
              log('orders', 'simulate-payment', `${simId} → FAILED (simulated)`);
              return success(res, {
                order: cancelled,
                payment: { status: 'failed', simulated: true },
                message: 'Order cancelled — payment failed (simulated)',
              });
            }

            // Success → confirm order (same as real payment)
            const result = await orderService.confirmOrder(simId, 'SIM-' + Date.now());
            if (!result) return error(res, 404, `Order '${simId}' not found`);
            log('orders', 'simulate-payment', `${simId} → SUCCESS (simulated)`);
            return success(res, {
              order: result.order,
              zoho: result.zoho,
              crm: result.crm,
              payment: { status: 'success', simulated: true },
            });
          }

          // Update / Delete
          case 'update': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            const body = req.body || {};
            delete body.id; delete body.createdAt;
            const updated = await orderService.updateOrder(id, body);
            if (!updated) return error(res, 404, `Order '${id}' not found`);
            return success(res, { order: updated });
          }
          case 'delete': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            const deleted = await orderService.deleteOrder(id);
            if (!deleted) return error(res, 404, `Order '${id}' not found`);
            return success(res, { message: `Order '${id}' deleted` });
          }
          default: return error(res, 400, `Unknown orders action: '${action}'`);
        }
      }

      // ══════════ CUSTOMERS ══════════
      case 'customers': {
        switch (action) {
          case 'list': return success(res, { customers: await customerService.listCustomers(Number(req.query.limit) || 50) });
          case 'get': {
            if (!id) return error(res, 400, 'Missing id');
            const c = await customerService.getCustomer(id);
            return c ? success(res, { customer: c }) : error(res, 404, 'Not found');
          }
          case 'find': {
            const email = req.query.email as string;
            if (!email) return error(res, 400, 'Missing email');
            const c = await customerService.getCustomerByEmail(email);
            return c ? success(res, { customer: c }) : error(res, 404, 'Not found');
          }
          case 'create': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const b = req.body || {};
            if (!b.email || !b.firstName || !b.lastName) return error(res, 400, 'Missing: email, firstName, lastName');
            return success(res, { customer: await customerService.createCustomer(b) }, 201);
          }
          case 'update': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            const u = await customerService.updateCustomer(id, req.body || {});
            return u ? success(res, { customer: u }) : error(res, 404, 'Not found');
          }
          case 'delete': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            return (await customerService.deleteCustomer(id)) ? success(res, { message: 'Deleted' }) : error(res, 404, 'Not found');
          }
          default: return error(res, 400, `Unknown customers action: '${action}'`);
        }
      }

      // ══════════ PRODUCTS ══════════
      case 'products': {
        switch (action) {
          case 'list': return success(res, { products: await productService.listProducts(Number(req.query.limit) || 100, req.query.category as string) });
          case 'get': {
            if (!id) return error(res, 400, 'Missing id');
            const p = await productService.getProduct(id);
            return p ? success(res, { product: p }) : error(res, 404, 'Not found');
          }
          case 'create': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const b = req.body || {};
            if (!b.name || b.price === undefined) return error(res, 400, 'Missing: name, price');
            return success(res, { product: await productService.createProduct(b) }, 201);
          }
          case 'update': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            const u = await productService.updateProduct(id, req.body || {});
            return u ? success(res, { product: u }) : error(res, 404, 'Not found');
          }
          case 'delete': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            return (await productService.deleteProduct(id)) ? success(res, { message: 'Deactivated' }) : error(res, 404, 'Not found');
          }
          case 'stock': {
            if (req.method !== 'POST' || !id) return error(res, 400, 'POST + id required');
            const { stockKey, quantity } = req.body || {};
            return (await productService.updateStock(id, stockKey, quantity)) ? success(res, { message: 'Updated' }) : error(res, 404, 'Not found');
          }
          default: return error(res, 400, `Unknown products action: '${action}'`);
        }
      }

      // ══════════ SHIPPING ══════════
      case 'shipping': {
        switch (action) {
          case 'calculate': {
            if (req.method !== 'POST') return error(res, 405, 'POST required');
            const errs = shippingService.validateShippingInput(req.body || {});
            if (errs.length > 0) return res.status(422).json({ success: false, error: 'Validation failed', validationErrors: errs });
            return success(res, { shipping: shippingService.calculateShipping(req.body) });
          }
          case 'rates': return success(res, { rates: shippingService.getAllRates(Number(req.query.total) || 0), free_shipping_threshold: 1000 });
          case 'health': return success(res, { status: 'ok' });
          default: return error(res, 400, `Unknown shipping action: '${action}'`);
        }
      }

      // ══════════ ZOHO ══════════
      case 'zoho': {
        if (action === 'items') return success(res, { ...(await listZohoItems(Number(req.query.page) || 1)), currentMappings: getMappings() });
        return error(res, 400, `Unknown zoho action: '${action}'`);
      }

      default: return error(res, 400, `Unknown resource: '${resource}'`);
    }
  } catch (err: any) {
    console.error(`[store-api/${resource}/${action}] ERROR:`, err);
    return error(res, 500, 'Internal server error', err.message);
  } finally {
    log(resource, action, `Done ${Date.now() - start}ms`);
  }
}
