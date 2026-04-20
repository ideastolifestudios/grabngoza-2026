/**
 * api/services/zohoInventoryService.ts — Zoho Inventory integration
 *
 * Creates sales orders in Zoho Inventory after local order is stored.
 * Uses simple env var for OAuth token (swap to auto-refresh later).
 *
 * Env vars needed:
 *   ZOHO_INVENTORY_ACCESS_TOKEN  — OAuth token (manual refresh for now)
 *   ZOHO_INVENTORY_ORG_ID        — Your Zoho org ID
 *   ZOHO_INVENTORY_REGION        — com | eu | in | com.au (default: com)
 *
 * API docs: https://www.zoho.com/inventory/api/v1/sales-orders/
 */

import type { Order, OrderItem } from '../lib/types.ts';

// ─── Config ─────────────────────────────────────────────────────

const REGION     = process.env.ZOHO_INVENTORY_REGION || 'com';
const BASE_URL   = `https://inventory.zoho.${REGION}/api/v1`;
const ORG_ID     = process.env.ZOHO_INVENTORY_ORG_ID || '';
const TOKEN      = () => process.env.ZOHO_INVENTORY_ACCESS_TOKEN || '';

// ─── Product ID Mapping (Local → Zoho) ─────────────────────────
//
// Maps your local product IDs (Firestore doc IDs) to Zoho Inventory
// item IDs. Update this map as you add products to Zoho.
//
// To find Zoho item_ids:
//   GET https://inventory.zoho.com/api/v1/items?organization_id={org_id}
//
// For production: store this mapping in Firestore or a config file
// instead of hardcoding here.

const PRODUCT_MAP: Record<string, string> = {
  // LOCAL_PRODUCT_ID  →  ZOHO_ITEM_ID
  // 'p1':            '1234567890001',
  // 'black-hoodie':  '1234567890002',
  // 'cap-standard':  '1234567890003',
};

/**
 * Look up a Zoho item_id for a local product.
 * Returns null if no mapping exists (unmapped products are skipped or use name fallback).
 */
export function getZohoItemId(localProductId: string): string | null {
  return PRODUCT_MAP[localProductId] || null;
}

/**
 * Register a product mapping at runtime (useful for dynamic config).
 */
export function registerMapping(localId: string, zohoItemId: string): void {
  PRODUCT_MAP[localId] = zohoItemId;
}

/**
 * Get all current mappings (for debugging).
 */
export function getMappings(): Record<string, string> {
  return { ...PRODUCT_MAP };
}

// ─── Zoho API helpers ───────────────────────────────────────────

function zohoHeaders() {
  const token = TOKEN();
  if (!token) throw new Error('ZOHO_INVENTORY_ACCESS_TOKEN not set');
  return {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Type':  'application/json',
  };
}

async function zohoFetch(
  method: string,
  path: string,
  body?: any,
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}organization_id=${ORG_ID}`;

  const res = await fetch(url, {
    method,
    headers: zohoHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({ message: 'Non-JSON response' }));

  return { ok: res.ok, status: res.status, data };
}

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

/**
 * Creates a sales order in Zoho Inventory from a local order.
 *
 * - Maps local product IDs → Zoho item IDs
 * - Unmapped products are included by name (Zoho will try to match)
 * - NEVER throws — always returns a result object
 *
 * @param order - The validated local order
 * @param zohoCustomerId - Optional Zoho CRM customer ID (if synced)
 */
export async function createZohoOrder(
  order: Order,
  zohoCustomerId?: string,
): Promise<ZohoSalesOrderResult> {
  // ── Pre-flight checks ────────────────────────────────────────
  if (!TOKEN()) {
    return {
      success: false,
      error: 'Zoho Inventory not configured (ZOHO_INVENTORY_ACCESS_TOKEN missing)',
    };
  }

  if (!ORG_ID) {
    return {
      success: false,
      error: 'Zoho Inventory not configured (ZOHO_INVENTORY_ORG_ID missing)',
    };
  }

  try {
    // ── Build line items ─────────────────────────────────────────
    const lineItems: any[] = [];
    const skippedItems: string[] = [];

    for (const item of order.items) {
      const zohoItemId = getZohoItemId(item.productId);

      if (zohoItemId) {
        // Mapped product → use Zoho item_id
        lineItems.push({
          item_id:    zohoItemId,
          name:       item.name,
          rate:       item.price,
          quantity:   item.quantity,
          ...(item.selectedVariants
            ? { description: Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ') }
            : {}),
        });
      } else {
        // Unmapped → include by name, let Zoho try to match
        lineItems.push({
          name:       item.name,
          rate:       item.price,
          quantity:   item.quantity,
          description: `[Unmapped] Local ID: ${item.productId}`,
        });
        skippedItems.push(item.productId);
      }
    }

    if (lineItems.length === 0) {
      return { success: false, error: 'No line items to send to Zoho' };
    }

    // ── Build Zoho payload ──────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const payload: any = {
      date: today,
      salesorder_number: order.id || `GNG-${Date.now()}`,
      reference_number:  order.id || '',
      line_items:        lineItems,
      notes: `Order from Grab & Go website. Customer: ${order.firstName} ${order.lastName} (${order.email})`,
      shipping_charge:   order.shippingCost || 0,
    };

    // Link to Zoho CRM customer if available
    if (zohoCustomerId) {
      payload.customer_id = zohoCustomerId;
    } else {
      // Use customer name for Zoho to match or create
      payload.customer_name = `${order.firstName} ${order.lastName}`;
    }

    // ── Send to Zoho ────────────────────────────────────────────
    console.log(`[zoho-inventory] Creating sales order for ${order.id}`, {
      items: lineItems.length,
      total: order.total,
    });

    const result = await zohoFetch('POST', '/salesorders', payload);

    if (result.ok && result.data?.salesorder) {
      const so = result.data.salesorder;
      console.log(`[zoho-inventory] Sales order created: ${so.salesorder_id}`, {
        number: so.salesorder_number,
        status: so.status,
      });

      return {
        success: true,
        zohoSalesOrderId:     so.salesorder_id,
        zohoSalesOrderNumber: so.salesorder_number,
        ...(skippedItems.length > 0 ? { skippedItems } : {}),
      };
    }

    // Zoho returned an error
    console.error(`[zoho-inventory] API error:`, result.status, result.data);
    return {
      success: false,
      error: result.data?.message || `Zoho API returned ${result.status}`,
      details: result.data,
      ...(skippedItems.length > 0 ? { skippedItems } : {}),
    };

  } catch (err: any) {
    // Network error, timeout, etc — never crash
    console.error(`[zoho-inventory] Exception:`, err.message);
    return {
      success: false,
      error: `Zoho sync failed: ${err.message}`,
    };
  }
}

// ─── Utility: List Zoho Items (for discovering item_ids) ────────

export async function listZohoItems(page = 1): Promise<{
  success: boolean;
  items?: Array<{ item_id: string; name: string; sku: string; rate: number }>;
  error?: string;
}> {
  try {
    const result = await zohoFetch('GET', `/items?page=${page}&per_page=50`);

    if (result.ok && result.data?.items) {
      return {
        success: true,
        items: result.data.items.map((i: any) => ({
          item_id: i.item_id,
          name:    i.name,
          sku:     i.sku || '',
          rate:    i.rate || 0,
        })),
      };
    }

    return { success: false, error: result.data?.message || 'Failed to list items' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
