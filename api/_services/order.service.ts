/**
 * api/_services/order.service.ts — Redis-backed persistent order storage
 *
 * UPGRADED from in-memory Map to Upstash Redis.
 * Orders survive cold starts and scale across function instances.
 *
 * Storage layout:
 *   order:{id}           → JSON order object
 *   orders:list          → sorted set (score = timestamp, member = order id)
 *   order:payment:{pid}  → order id (dedup by paymentId)
 *   order:counter        → auto-increment counter
 *
 * Flow:
 *   1. createOrder()   → stores with status='pending' (NO Zoho sync)
 *   2. confirmOrder()  → marks paid → triggers CRM + Inventory sync
 *   3. cancelOrder()   → marks cancelled
 */

import type { Order } from '../_lib/types';
import { getRedis } from '../_lib/redis';
import { createZohoOrder, type ZohoSalesOrderResult } from './zohoInventoryService';
import { createOrUpdateCustomer, type ZohoCRMResult } from './zohoCRMService';

const ORDER_PREFIX    = 'order:';
const ORDER_LIST      = 'orders:list';
const PAYMENT_PREFIX  = 'order:payment:';
const COUNTER_KEY     = 'order:counter';

// ─── Helpers ────────────────────────────────────────────────────

async function saveOrder(order: Order): Promise<void> {
  const redis = getRedis();
  const ts = new Date(order.createdAt).getTime();
  await Promise.all([
    redis.set(`${ORDER_PREFIX}${order.id}`, JSON.stringify(order)),
    redis.zadd(ORDER_LIST, { score: ts, member: order.id }),
  ]);
  // Index by paymentId if present
  if (order.paymentId) {
    await redis.set(`${PAYMENT_PREFIX}${order.paymentId}`, order.id);
  }
}

async function nextId(): Promise<string> {
  const redis = getRedis();
  const counter = await redis.incr(COUNTER_KEY);
  return `ORD-${counter}`;
}

// ─── Validation ─────────────────────────────────────────────────

export interface ValidationError { field: string; message: string; }

export function validateCreateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push({ field: 'email', message: 'Valid email required' });
  if (!body.firstName?.trim()) errors.push({ field: 'firstName', message: 'Required' });
  if (!body.lastName?.trim())  errors.push({ field: 'lastName', message: 'Required' });
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item required' });
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.productId) errors.push({ field: `items[${i}].productId`, message: 'Required' });
      if (!item.name)      errors.push({ field: `items[${i}].name`, message: 'Required' });
      if (typeof item.price !== 'number' || item.price <= 0) errors.push({ field: `items[${i}].price`, message: 'Must be positive' });
      if (!Number.isInteger(item.quantity) || item.quantity < 1) errors.push({ field: `items[${i}].quantity`, message: 'Positive integer required' });
    });
  }
  if (typeof body.total !== 'number' || body.total <= 0) errors.push({ field: 'total', message: 'Must be positive' });
  return errors;
}

// ─── Result types ───────────────────────────────────────────────

export interface ConfirmResult {
  order: Order;
  zoho: ZohoSalesOrderResult;
  crm: ZohoCRMResult;
}

// ─── Duplicate check by paymentId ───────────────────────────────

export async function getOrderByPaymentId(paymentId: string): Promise<Order | null> {
  const redis = getRedis();
  const orderId = await redis.get<string>(`${PAYMENT_PREFIX}${paymentId}`);
  if (!orderId) return null;
  return getOrder(orderId);
}

// ─── 1. CREATE (pending_payment — no Zoho yet) ─────────────────

export async function createOrder(data: any): Promise<Order> {
  const id = await nextId();
  const now = new Date().toISOString();

  const order: Order = {
    id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || '',
    items: data.items,
    subtotal: data.items.reduce((s: number, i: any) => s + i.price * i.quantity, 0),
    shippingCost: data.shippingCost || 0,
    total: data.total,
    status: 'pending',
    paymentStatus: 'pending',
    deliveryMethod: data.deliveryMethod || 'standard',
    deliveryAddress: data.deliveryAddress,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  await saveOrder(order);
  console.log(`[order.service] Order ${id} created (pending payment). Total: R${order.total}`);
  return order;
}

// ─── 2. CONFIRM (payment success → Zoho sync) ──────────────────

export async function confirmOrder(orderId: string, paymentRef?: string): Promise<ConfirmResult | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  if (order.paymentStatus === 'paid') {
    console.log(`[order.service] Order ${orderId} already confirmed, skipping`);
    return {
      order,
      zoho: { success: true, zohoSalesOrderId: 'already-synced' },
      crm:  { success: true, action: 'skipped' },
    };
  }

  // Mark as paid
  order.paymentStatus = 'paid';
  order.status = 'processing';
  order.paidAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();
  if (paymentRef) {
    order.paymentId = paymentRef;
    order.notes = `Payment: ${paymentRef}`;
  }

  console.log(`[order.service] Order ${orderId} payment confirmed → syncing to Zoho`);

  // ── CRM sync (non-blocking) ───────────────────────────────────
  let crmResult: ZohoCRMResult;
  try {
    crmResult = await createOrUpdateCustomer(order);
  } catch (err: any) {
    console.error(`[order.service] CRM sync error for ${orderId}:`, err.message);
    crmResult = { success: false, error: err.message };
  }

  // ── Inventory sync ────────────────────────────────────────────
  let zohoResult: ZohoSalesOrderResult;
  try {
    zohoResult = await createZohoOrder(order, crmResult.zohoContactId || undefined);
    if (zohoResult.success && zohoResult.zohoSalesOrderId) {
      order.zohoOrderId = zohoResult.zohoSalesOrderId;
      order.notes = [order.notes, `Zoho SO: ${zohoResult.zohoSalesOrderId}`].filter(Boolean).join(' | ');
    }
  } catch (err: any) {
    console.error(`[order.service] Inventory sync error for ${orderId}:`, err.message);
    zohoResult = { success: false, error: err.message };
  }

  if (crmResult.zohoContactId) {
    order.zohoCrmContactId = crmResult.zohoContactId;
    order.notes = [order.notes, `CRM: ${crmResult.zohoContactId}`].filter(Boolean).join(' | ');
  }

  await saveOrder(order);
  return { order, zoho: zohoResult, crm: crmResult };
}

// ─── 3. CANCEL ──────────────────────────────────────────────────

export async function cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  if (order.paymentStatus === 'paid') {
    console.log(`[order.service] Cannot cancel paid order ${orderId}`);
    return null;
  }

  order.status = 'cancelled';
  order.paymentStatus = 'failed';
  order.updatedAt = new Date().toISOString();
  order.notes = [order.notes, `Cancelled: ${reason || 'payment failed'}`].filter(Boolean).join(' | ');

  await saveOrder(order);
  console.log(`[order.service] Order ${orderId} cancelled: ${reason || 'payment failed'}`);
  return order;
}

// ─── READ / LIST / STATS ────────────────────────────────────────

export async function listOrders(limit = 50, status?: string): Promise<Order[]> {
  const redis = getRedis();
  // Get newest first (highest score = most recent)
  const ids = await redis.zrange(ORDER_LIST, '+inf', '-inf', {
    byScore: true,
    rev: true,
    offset: 0,
    count: Math.min(limit * 2, 200), // fetch extra to filter by status
  });

  if (!ids || ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(`${ORDER_PREFIX}${id}`);
  }
  const results = await pipeline.exec<(string | null)[]>();

  let orders: Order[] = results
    .filter((r): r is string => r !== null)
    .map(r => {
      try { return typeof r === 'string' ? JSON.parse(r) : r; }
      catch { return null; }
    })
    .filter((o): o is Order => o !== null);

  if (status) orders = orders.filter(o => o.status === status);
  return orders.slice(0, limit);
}

export async function getOrder(id: string): Promise<Order | null> {
  const redis = getRedis();
  const data = await redis.get<string>(`${ORDER_PREFIX}${id}`);
  if (!data) return null;
  try { return typeof data === 'string' ? JSON.parse(data) : data; }
  catch { return null; }
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const existing = await getOrder(id);
  if (!existing) return null;
  const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  await saveOrder(updated as Order);
  return updated as Order;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`${ORDER_PREFIX}${id}`);
  if (!exists) return false;
  await Promise.all([
    redis.del(`${ORDER_PREFIX}${id}`),
    redis.zrem(ORDER_LIST, id),
  ]);
  return true;
}

export async function getStats() {
  const orders = await listOrders(500);
  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  return { total: orders.length, byStatus, revenue };
}