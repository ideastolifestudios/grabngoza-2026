/**
 * api/services/zohoInventoryService.ts — Zoho Inventory integration
 *
 * Now uses shared auto-refresh OAuth from lib/zohoAuth.ts.
 * No more manual token management.
 */

import type { Order } from '../_lib/types.ts';
import { zohoApiFetch, ZOHO_REGION } from '../_lib/zohoAuth.ts';

const BASE_URL = `https://inventory.zoho.${ZOHO_REGION}/api/v1`;
const ORG_ID   = process.env.ZOHO_INVENTORY_ORG_ID || '';

// ─── Product ID Mapping (Local → Zoho) ─────────────────────────
const PRODUCT_MAP: Record<string, string> = {
  // 'local-id': 'zoho-item-id',
};

export function getZohoItemId(localId: string): string | null { return PRODUCT_MAP[localId] || null; }
export function registerMapping(localId: string, zohoId: string) { PRODUCT_MAP[localId] = zohoId; }
export function getMappings() { return { ...PRODUCT_MAP }; }

// ─── Types ──────────────────────────────────────────────────────
export interface ZohoSalesOrderResult {
  success: boolean;
  zohoSalesOrderId?: string;
  zohoSalesOrderNumber?: string;
  error?: string;
  details?: any;
  skippedItems?: string[];
}

// ─── Create Sales Order ─────────────────────────────────────────
export async function createZohoOrder(order: Order, zohoCustomerId?: string): Promise<ZohoSalesOrderResult> {
  if (!ORG_ID) return { success: false, error: 'ZOHO_INVENTORY_ORG_ID not set' };

  try {
    const lineItems: any[] = [];
    const skippedItems: string[] = [];

    for (const item of order.items) {
      const zohoId = getZohoItemId(item.productId);
      lineItems.push({
        ...(zohoId ? { item_id: zohoId } : {}),
        name: item.name,
        rate: item.price,
        quantity: item.quantity,
        ...(item.selectedVariants
          ? { description: Object.entries(item.selectedVariants).map(([k,v]) => `${k}: ${v}`).join(', ') }
          : {}),
        ...(!zohoId ? { description: `[Unmapped] Local ID: ${item.productId}` } : {}),
      });
      if (!zohoId) skippedItems.push(item.productId);
    }

    const payload: any = {
      date: new Date().toISOString().split('T')[0],
      salesorder_number: order.id || `GNG-${Date.now()}`,
      reference_number: order.id || '',
      line_items: lineItems,
      notes: `Grab & Go order. ${order.firstName} ${order.lastName} (${order.email})`,
      shipping_charge: order.shippingCost || 0,
    };

    if (zohoCustomerId) payload.customer_id = zohoCustomerId;
    else payload.customer_name = `${order.firstName} ${order.lastName}`;

    console.log(`[zoho-inventory] Creating SO for ${order.id}`);

    const result = await zohoApiFetch(BASE_URL, '/salesorders', {
      method: 'POST',
      body: payload,
      params: { organization_id: ORG_ID },
    });

    if (result.ok && result.data?.salesorder) {
      const so = result.data.salesorder;
      console.log(`[zoho-inventory] SO created: ${so.salesorder_id}`);
      return {
        success: true,
        zohoSalesOrderId: so.salesorder_id,
        zohoSalesOrderNumber: so.salesorder_number,
        ...(skippedItems.length > 0 ? { skippedItems } : {}),
      };
    }

    return { success: false, error: result.data?.message || `API ${result.status}`, details: result.data };
  } catch (err: any) {
    return { success: false, error: `Inventory sync: ${err.message}` };
  }
}

export async function listZohoItems(page = 1) {
  try {
    const result = await zohoApiFetch(BASE_URL, '/items', {
      params: { organization_id: ORG_ID, page: String(page), per_page: '50' },
    });
    if (result.ok && result.data?.items)
      return { success: true, items: result.data.items.map((i: any) => ({ item_id: i.item_id, name: i.name, sku: i.sku || '', rate: i.rate || 0 })) };
    return { success: false, error: result.data?.message || 'Failed' };
  } catch (err: any) { return { success: false, error: err.message }; }
}
