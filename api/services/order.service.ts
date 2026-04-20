/**
 * api/services/order.service.ts — Order business logic
 *
 * In-memory mock storage + Zoho Inventory sync.
 * Zoho failures are caught and logged — never crash the API.
 */

import type { Order } from '../lib/types.ts';
import { createZohoOrder, type ZohoSalesOrderResult } from './zohoInventoryService.ts';

// ─── In-memory store ────────────────────────────────────────────
const orders = new Map<string, Order>();
let counter = 1000;
function nextId(): string { return `ORD-${++counter}`; }

// ─── Validation ─────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!body.email || typeof body.email !== 'string')
    errors.push({ field: 'email', message: 'Valid email is required' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push({ field: 'email', message: 'Invalid email format' });

  if (!body.firstName?.trim())
    errors.push({ field: 'firstName', message: 'First name is required' });
  if (!body.lastName?.trim())
    errors.push({ field: 'lastName', message: 'Last name is required' });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.productId)
        errors.push({ field: `items[${i}].productId`, message: 'Product ID is required' });
      if (!item.name || typeof item.name !== 'string')
        errors.push({ field: `items[${i}].name`, message: 'Item name is required' });
      if (typeof item.price !== 'number' || item.price <= 0)
        errors.push({ field: `items[${i}].price`, message: 'Price must be positive' });
      if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity))
        errors.push({ field: `items[${i}].quantity`, message: 'Quantity must be a positive integer' });
    });
  }

  if (typeof body.total !== 'number' || body.total <= 0)
    errors.push({ field: 'total', message: 'Total must be positive' });

  if (Array.isArray(body.items) && typeof body.total === 'number') {
    const computed = body.items.reduce((s: number, i: any) => s + ((i.price || 0) * (i.quantity || 0)), 0);
    const expected = computed + (body.shippingCost || 0);
    if (Math.abs(body.total - expected) > 1)
      errors.push({ field: 'total', message: `Total (${body.total}) doesn't match items+shipping (${expected.toFixed(2)})` });
  }

  return errors;
}

export function validateUpdateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (body.status && !validStatuses.includes(body.status))
    errors.push({ field: 'status', message: `Must be one of: ${validStatuses.join(', ')}` });
  const validPayment = ['pending', 'paid', 'failed', 'refunded'];
  if (body.paymentStatus && !validPayment.includes(body.paymentStatus))
    errors.push({ field: 'paymentStatus', message: `Must be one of: ${validPayment.join(', ')}` });
  return errors;
}

// ─── Create Order Result (includes Zoho) ────────────────────────

export interface CreateOrderResult {
  order: Order;
  zoho: ZohoSalesOrderResult;
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

  // 1. Store locally
  orders.set(id, order);

  // 2. Sync to Zoho Inventory (fire-and-catch, never crash)
  let zohoResult: ZohoSalesOrderResult;
  try {
    zohoResult = await createZohoOrder(order);

    // If Zoho succeeded, store the Zoho ID on the order
    if (zohoResult.success && zohoResult.zohoSalesOrderId) {
      order.notes = [
        order.notes,
        `Zoho SO: ${zohoResult.zohoSalesOrderId}`,
      ].filter(Boolean).join(' | ');
      orders.set(id, order);
    }
  } catch (err: any) {
    console.error(`[order.service] Zoho sync exception for ${id}:`, err.message);
    zohoResult = { success: false, error: `Unexpected: ${err.message}` };
  }

  return { order, zoho: zohoResult };
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
