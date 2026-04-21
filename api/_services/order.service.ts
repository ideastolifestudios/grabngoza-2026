/**
 * api/_services/order.service.ts — Payment-gated order flow
 *
 * Flow:
 *   1. createOrder()       → stores with status='pending_payment' (NO Zoho sync)
 *   2. confirmOrder()      → marks paid → triggers CRM + Inventory sync
 *   3. cancelOrder()       → marks cancelled (payment failed/timeout)
 *
 * This structure is ready for Yoco webhook: webhook calls confirmOrder().
 */

import type { Order } from '../_lib/types.ts';
import { createZohoOrder, type ZohoSalesOrderResult } from './zohoInventoryService.ts';
import { createOrUpdateCustomer, type ZohoCRMResult } from './zohoCRMService.ts';

// ─── In-memory store ────────────────────────────────────────────
const orders = new Map<string, Order>();
let counter = 1000;
function nextId(): string { return `ORD-${++counter}`; }

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

// ─── 1. CREATE (pending_payment — no Zoho yet) ─────────────────

export async function createOrder(data: any): Promise<Order> {
  const id = nextId();
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
    status: 'pending',            // Will move to 'processing' after payment
    paymentStatus: 'pending',     // Will move to 'paid' after confirmation
    deliveryMethod: data.deliveryMethod || 'standard',
    deliveryAddress: data.deliveryAddress,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };

  orders.set(id, order);
  console.log(`[order.service] Order ${id} created (pending payment). Total: R${order.total}`);
  return order;
}

// ─── 2. CONFIRM (payment success → Zoho sync) ──────────────────

export async function confirmOrder(orderId: string, paymentRef?: string): Promise<ConfirmResult | null> {
  const order = orders.get(orderId);
  if (!order) return null;

  if (order.paymentStatus === 'paid') {
    // Already confirmed — return current state without re-syncing
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
  order.updatedAt = new Date().toISOString();
  if (paymentRef) order.notes = `Payment: ${paymentRef}`;

  console.log(`[order.service] Order ${orderId} payment confirmed → syncing to Zoho`);

  // ── CRM sync ──────────────────────────────────────────────────
  let crmResult: ZohoCRMResult;
  try {
    crmResult = await createOrUpdateCustomer(order);
  } catch (err: any) {
    console.error(`[order.service] CRM sync error for ${orderId}:`, err.message);
    crmResult = { success: false, error: err.message };
  }

  // ── Inventory sync (linked to CRM contact if available) ───────
  let zohoResult: ZohoSalesOrderResult;
  try {
    zohoResult = await createZohoOrder(order, crmResult.zohoContactId || undefined);
    if (zohoResult.success && zohoResult.zohoSalesOrderId) {
      order.notes = [order.notes, `Zoho SO: ${zohoResult.zohoSalesOrderId}`].filter(Boolean).join(' | ');
    }
  } catch (err: any) {
    console.error(`[order.service] Inventory sync error for ${orderId}:`, err.message);
    zohoResult = { success: false, error: err.message };
  }

  if (crmResult.zohoContactId) {
    order.notes = [order.notes, `CRM: ${crmResult.zohoContactId}`].filter(Boolean).join(' | ');
  }

  orders.set(orderId, order);
  return { order, zoho: zohoResult, crm: crmResult };
}

// ─── 3. CANCEL (payment failed) ────────────────────────────────

export async function cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
  const order = orders.get(orderId);
  if (!order) return null;

  if (order.paymentStatus === 'paid') {
    console.log(`[order.service] Cannot cancel paid order ${orderId}`);
    return null; // Can't cancel paid orders this way
  }

  order.status = 'cancelled';
  order.paymentStatus = 'failed';
  order.updatedAt = new Date().toISOString();
  order.notes = [order.notes, `Cancelled: ${reason || 'payment failed'}`].filter(Boolean).join(' | ');

  orders.set(orderId, order);
  console.log(`[order.service] Order ${orderId} cancelled: ${reason || 'payment failed'}`);
  return order;
}

// ─── READ / LIST / STATS ────────────────────────────────────────

export async function listOrders(limit = 50, status?: string): Promise<Order[]> {
  let result = Array.from(orders.values());
  if (status) result = result.filter(o => o.status === status);
  result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return result.slice(0, limit);
}

export async function getOrder(id: string): Promise<Order | null> {
  return orders.get(id) || null;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const existing = orders.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  orders.set(id, updated as Order);
  return updated as Order;
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (!orders.has(id)) return false;
  orders.delete(id);
  return true;
}

export async function getStats() {
  const all = Array.from(orders.values());
  const byStatus: Record<string, number> = {};
  for (const o of all) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const revenue = all.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  return { total: all.length, byStatus, revenue };
}
