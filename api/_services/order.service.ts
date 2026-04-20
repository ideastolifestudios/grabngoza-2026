/**
 * api/services/order.service.ts — Order business logic
 *
 * In-memory mock storage + Zoho Inventory sync + Zoho CRM sync.
 * All external calls are fire-and-catch — never crash the API.
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

  if (!body.email || typeof body.email !== 'string')
    errors.push({ field: 'email', message: 'Valid email is required' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push({ field: 'email', message: 'Invalid email format' });

  if (!body.firstName?.trim()) errors.push({ field: 'firstName', message: 'First name is required' });
  if (!body.lastName?.trim())  errors.push({ field: 'lastName', message: 'Last name is required' });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.productId)       errors.push({ field: `items[${i}].productId`, message: 'Required' });
      if (!item.name)            errors.push({ field: `items[${i}].name`, message: 'Required' });
      if (typeof item.price !== 'number' || item.price <= 0)
        errors.push({ field: `items[${i}].price`, message: 'Must be positive' });
      if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity))
        errors.push({ field: `items[${i}].quantity`, message: 'Must be a positive integer' });
    });
  }

  if (typeof body.total !== 'number' || body.total <= 0)
    errors.push({ field: 'total', message: 'Must be positive' });

  if (Array.isArray(body.items) && typeof body.total === 'number') {
    const expected = body.items.reduce((s: number, i: any) => s + ((i.price || 0) * (i.quantity || 0)), 0) + (body.shippingCost || 0);
    if (Math.abs(body.total - expected) > 1)
      errors.push({ field: 'total', message: `Mismatch: got ${body.total}, expected ${expected.toFixed(2)}` });
  }

  return errors;
}

export function validateUpdateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const vs = ['pending','paid','processing','shipped','delivered','cancelled','returned'];
  if (body.status && !vs.includes(body.status)) errors.push({ field: 'status', message: `Must be: ${vs.join(', ')}` });
  const vp = ['pending','paid','failed','refunded'];
  if (body.paymentStatus && !vp.includes(body.paymentStatus)) errors.push({ field: 'paymentStatus', message: `Must be: ${vp.join(', ')}` });
  return errors;
}

// ─── Result types ───────────────────────────────────────────────

export interface CreateOrderResult {
  order: Order;
  zoho: ZohoSalesOrderResult;
  crm: ZohoCRMResult;
}

// ─── CRUD ───────────────────────────────────────────────────────

export async function listOrders(limit = 50, status?: string): Promise<Order[]> {
  let result = Array.from(orders.values());
  if (status) result = result.filter(o => o.status === status);
  result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return result.slice(0, limit);
}

export async function getOrder(id: string): Promise<Order | null> {
  return orders.get(id) || null;
}

export async function createOrder(data: Omit<Order, 'id'>): Promise<CreateOrderResult> {
  const id = nextId();
  const now = new Date().toISOString();

  const order: Order = {
    id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || '',
    items: data.items,
    subtotal: data.items.reduce((s, i) => s + i.price * i.quantity, 0),
    shippingCost: data.shippingCost || 0,
    total: data.total,
    status: 'pending',
    paymentStatus: 'pending',
    deliveryMethod: data.deliveryMethod || 'standard',
    deliveryAddress: data.deliveryAddress,
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  // ── 1. Store locally (always succeeds) ────────────────────────
  orders.set(id, order);

  // ── 2. Sync to Zoho CRM (fire-and-catch) ─────────────────────
  let crmResult: ZohoCRMResult;
  try {
    crmResult = await createOrUpdateCustomer(order);
  } catch (err: any) {
    console.error(`[order.service] CRM sync exception for ${id}:`, err.message);
    crmResult = { success: false, error: `Unexpected: ${err.message}` };
  }

  // ── 3. Sync to Zoho Inventory (fire-and-catch) ────────────────
  let zohoResult: ZohoSalesOrderResult;
  try {
    // Pass CRM contact ID if we got one — links SO to contact
    const zohoCustomerId = crmResult.zohoContactId || undefined;
    zohoResult = await createZohoOrder(order, zohoCustomerId);

    if (zohoResult.success && zohoResult.zohoSalesOrderId) {
      order.notes = [order.notes, `Zoho SO: ${zohoResult.zohoSalesOrderId}`].filter(Boolean).join(' | ');
    }
  } catch (err: any) {
    console.error(`[order.service] Inventory sync exception for ${id}:`, err.message);
    zohoResult = { success: false, error: `Unexpected: ${err.message}` };
  }

  // ── 4. Append CRM ID to notes ─────────────────────────────────
  if (crmResult.success && crmResult.zohoContactId) {
    order.notes = [order.notes, `CRM: ${crmResult.zohoContactId}`].filter(Boolean).join(' | ');
  }

  orders.set(id, order);
  return { order, zoho: zohoResult, crm: crmResult };
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const existing = orders.get(id);
  if (!existing) return null;
  const updated: Order = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
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
