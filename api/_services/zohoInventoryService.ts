/**
 * api/_services/zohoInventoryService.ts — Zoho Inventory integration
 *
 * Now uses shared productMap from _lib/ and shared auth from _lib/zohoAuth.
 */

import type { Order } from '../_lib/types.ts';
import { zohoApiFetch, ZOHO_REGION } from '../_lib/zohoAuth.ts';
import { getZohoItemId, getAllMappings, getMappingStats } from '../_lib/productMap.ts';

const BASE_URL = `https://inventory.zoho.${ZOHO_REGION}/api/v1`;
const ORG_ID   = process.env.ZOHO_INVENTORY_ORG_ID || '';

// Re-export mapping functions for controller access
export { getAllMappings as getMappings, getMappingStats };
export { getZohoItemId, registerMapping, registerMappings } from '../_lib/productMap.ts';

export interface ZohoSalesOrderResult {
  success: boolean;
  zohoSalesOrderId?: string;
  zohoSalesOrderNumber?: string;
  error?: string;
  details?: any;
  skippedItems?: string[];
}

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
      method: 'POST', body: payload, params: { organization_id: ORG_ID },
    });

    if (result.ok && result.data?.salesorder) {
      const so = result.data.salesorder;
      return { success: true, zohoSalesOrderId: so.salesorder_id, zohoSalesOrderNumber: so.salesorder_number, ...(skippedItems.length ? { skippedItems } : {}) };
    }
    return { success: false, error: result.data?.message || `API ${result.status}`, details: result.data };
  } catch (err: any) {
    return { success: false, error: `Inventory sync: ${err.message}` };
  }
}

export async function listZohoItems(page = 1) {
  try {
    const result = await zohoApiFetch(BASE_URL, '/items', { params: { organization_id: ORG_ID, page: String(page), per_page: '50' } });
    if (result.ok && result.data?.items)
      return { success: true, items: result.data.items.map((i: any) => ({ item_id: i.item_id, name: i.name, sku: i.sku || '', rate: i.rate || 0 })) };
    return { success: false, error: result.data?.message || 'Failed' };
  } catch (err: any) { return { success: false, error: err.message }; }
}
