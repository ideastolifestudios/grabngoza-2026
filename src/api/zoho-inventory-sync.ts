/**
 * api/zoho-inventory-sync.ts
 * Grab & Go — Vercel Serverless Function
 *
 * POST /api/zoho-inventory-sync
 * Syncs a paid Firestore order to Zoho Inventory:
 *   1. Find or create Inventory contact (by email/name)
 *   2. Find or create Inventory items (by SKU/name)
 *   3. Create Zoho sales order
 *
 * Required env vars (Vercel dashboard → Settings → Environment Variables):
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN,
 *   ZOHO_INVENTORY_ORG_ID, ZOHO_DATA_CENTER (default: "com")
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { invBase, zohoFetch } from '../services/zoho-auth';

const ORG = () => `?organization_id=${process.env.ZOHO_INVENTORY_ORG_ID || ''}`;

// ── Types ─────────────────────────────────────────────────────────
interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  selectedVariants?: Record<string, string>;
}
interface OrderAddress {
  address?: string; city?: string; province?: string;
  postalCode?: string; country?: string;
}
interface OrderPayload {
  orderId: string; firstName: string; lastName: string;
  email: string; phone?: string;
  items: OrderItem[]; total: number; shippingCost?: number;
  shippingAddress?: OrderAddress; deliveryMethod?: string;
  trackingNumber?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
async function findOrCreateContact(p: OrderPayload): Promise<string> {
  const data = await zohoFetch(`${invBase()}/contacts${ORG()}`);
  const contacts = (data.contacts as any[]) || [];
  const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();

  for (const c of contacts) {
    if (
      (c.email?.toLowerCase() === p.email.toLowerCase()) ||
      c.contact_name?.toLowerCase() === fullName
    ) return String(c.contact_id);
  }

  const created = await zohoFetch(`${invBase()}/contacts${ORG()}`, {
    method: 'POST',
    body: JSON.stringify({
      contact_name: `${p.firstName} ${p.lastName}`,
      contact_type: 'customer',
      contact_persons: [{
        first_name: p.firstName, last_name: p.lastName,
        email: p.email, phone: p.phone || '', is_primary_contact: true,
      }],
    }),
  });
  return String((created.contact as any)?.contact_id || '');
}

async function findOrCreateItem(item: OrderItem): Promise<string> {
  const data = await zohoFetch(`${invBase()}/items${ORG()}`);
  const items = (data.items as any[]) || [];

  for (const zi of items) {
    if (item.sku && zi.sku?.toLowerCase() === item.sku.toLowerCase()) return String(zi.item_id);
    if (zi.name?.toLowerCase() === item.name.toLowerCase()) return String(zi.item_id);
  }

  const body: Record<string, unknown> = {
    name: item.name, rate: item.price,
    item_type: 'inventory', product_type: 'goods', unit: 'pcs',
  };
  if (item.sku) body.sku = item.sku;

  const created = await zohoFetch(`${invBase()}/items${ORG()}`, {
    method: 'POST', body: JSON.stringify(body),
  });
  return String((created.item as any)?.item_id || '');
}

// ── Handler ───────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const order = req.body as OrderPayload;
  if (!order?.orderId || !order.email || !order.items?.length)
    return res.status(400).json({ error: 'orderId, email, and items are required' });

  const steps: string[] = [];
  const errors: string[] = [];

  // 1. Contact
  const customerId = await findOrCreateContact(order);
  steps.push(`Contact: ${customerId}`);

  // 2. Items
  const itemMap: Record<string, string> = {};
  for (const item of order.items) {
    try {
      itemMap[item.name] = await findOrCreateItem(item);
    } catch (e: any) {
      errors.push(`Item '${item.name}': ${e.message}`);
    }
  }
  steps.push(`Items: ${Object.keys(itemMap).length}/${order.items.length}`);

  // 3. Sales order
  const lineItems = order.items
    .filter(i => itemMap[i.name])
    .map(i => ({ item_id: itemMap[i.name], quantity: i.quantity, rate: i.price }));

  if (!lineItems.length)
    return res.status(422).json({ error: 'No valid line items', errors });

  const soBody: Record<string, unknown> = {
    customer_id: customerId,
    line_items: lineItems,
    reference_number: order.orderId.slice(0, 20),
    date: new Date().toISOString().split('T')[0],
    notes: `Grab & Go order ${order.orderId}`,
  };
  if (order.shippingCost) soBody.shipping_charge = order.shippingCost;
  if (order.shippingAddress) {
    const a = order.shippingAddress;
    soBody.shipping_address = {
      address: a.address || '', city: a.city || '', state: a.province || '',
      zip: a.postalCode || '', country: a.country || 'South Africa',
    };
  }

  const soData = await zohoFetch(`${invBase()}/salesorders${ORG()}`, {
    method: 'POST', body: JSON.stringify(soBody),
  });
  const salesOrderId = String((soData.salesorder as any)?.salesorder_id || '');
  steps.push(`SO: ${salesOrderId}`);

  return res.status(200).json({
    success: true, orderId: order.orderId,
    zohoCustomerId: customerId, zohoSalesOrderId: salesOrderId,
    zohoItemsCreated: Object.keys(itemMap).length, steps, errors,
  });
}
