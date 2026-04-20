/**
 * api/services/order.service.ts — Order business logic
 *
 * In-memory mock storage for development.
 * Swap to Firestore / Zoho when ready — same interface.
 *
 * NOTE: In-memory store resets on each Vercel cold start.
 *       This is fine for dev/testing. For persistence, swap
 *       the Map for Firestore calls (commented examples below).
 */

import type { Order } from '../lib/types.ts';

// ─── In-memory store (mock DB) ─────────────────────────────────
const orders = new Map<string, Order>();
let counter = 1000;

function nextId(): string {
  counter += 1;
  return `ORD-${counter}`;
}

// ─── Validation ─────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCreateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Customer info
  if (!body.email || typeof body.email !== 'string') {
    errors.push({ field: 'email', message: 'Valid email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!body.firstName || typeof body.firstName !== 'string' || body.firstName.trim().length === 0) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!body.lastName || typeof body.lastName !== 'string' || body.lastName.trim().length === 0) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  // Items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.productId) {
        errors.push({ field: `items[${i}].productId`, message: 'Product ID is required' });
      }
      if (!item.name || typeof item.name !== 'string') {
        errors.push({ field: `items[${i}].name`, message: 'Item name is required' });
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        errors.push({ field: `items[${i}].price`, message: 'Price must be a positive number' });
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        errors.push({ field: `items[${i}].quantity`, message: 'Quantity must be a positive integer' });
      }
    });
  }

  // Total
  if (typeof body.total !== 'number' || body.total <= 0) {
    errors.push({ field: 'total', message: 'Total must be a positive number' });
  }

  // Cross-check: total vs items
  if (Array.isArray(body.items) && typeof body.total === 'number') {
    const computed = body.items.reduce(
      (sum: number, i: any) => sum + ((i.price || 0) * (i.quantity || 0)),
      0
    );
    const shipping = body.shippingCost || 0;
    const expected = computed + shipping;
    // Allow R1 tolerance for rounding
    if (Math.abs(body.total - expected) > 1) {
      errors.push({
        field: 'total',
        message: `Total (${body.total}) does not match items + shipping (${expected.toFixed(2)})`,
      });
    }
  }

  return errors;
}

export function validateUpdateOrder(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
  if (body.status && !validStatuses.includes(body.status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const validPayment = ['pending', 'paid', 'failed', 'refunded'];
  if (body.paymentStatus && !validPayment.includes(body.paymentStatus)) {
    errors.push({ field: 'paymentStatus', message: `Payment status must be one of: ${validPayment.join(', ')}` });
  }

  return errors;
}

// ─── CRUD Operations ────────────────────────────────────────────

export async function listOrders(limit = 50, status?: string): Promise<Order[]> {
  let result = Array.from(orders.values());

  if (status) {
    result = result.filter(o => o.status === status);
  }

  // Sort newest first
  result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return result.slice(0, limit);

  // FIRESTORE VERSION (swap in later):
  // let q = db.collection('orders').orderBy('createdAt', 'desc').limit(limit);
  // if (status) q = q.where('status', '==', status);
  // const snap = await q.get();
  // return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrder(id: string): Promise<Order | null> {
  return orders.get(id) || null;

  // FIRESTORE: const doc = await db.collection('orders').doc(id).get();
  // return doc.exists ? { id: doc.id, ...doc.data() } as Order : null;
}

export async function createOrder(data: Omit<Order, 'id'>): Promise<Order> {
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

  orders.set(id, order);
  return order;

  // TODO: Zoho CRM sync — create deal here
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<Order | null> {
  const existing = orders.get(id);
  if (!existing) return null;

  const updated: Order = {
    ...existing,
    ...data,
    id, // preserve ID
    updatedAt: new Date().toISOString(),
  };

  orders.set(id, updated);
  return updated;

  // TODO: Zoho CRM sync — update deal status here
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (!orders.has(id)) return false;
  orders.delete(id);
  return true;
}

// ─── Stats (bonus) ──────────────────────────────────────────────

export async function getStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  revenue: number;
}> {
  const all = Array.from(orders.values());
  const byStatus: Record<string, number> = {};

  for (const o of all) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  }

  const revenue = all
    .filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + o.total, 0);

  return { total: all.length, byStatus, revenue };
}
