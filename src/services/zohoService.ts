/**
 * src/services/zohoService.ts
 * Zoho integration with full resilience — failures never crash the order flow.
 * Replace the stub implementations with your existing Zoho API calls.
 */

import { log } from './logger';

/**
 * Safe wrapper for any Zoho operation.
 * Returns null on failure instead of throwing.
 */
async function zohoSafe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    log('info', `zoho.${label}.ok`);
    return result;
  } catch (err: any) {
    log('warn', `zoho.${label}.failed`, {
      error: err?.message,
      status: err?.response?.status,
    });
    return null; // Never propagate — caller decides if null matters
  }
}

/**
 * Syncs a confirmed order to Zoho Inventory + CRM in parallel.
 * Both operations are isolated — one failure does not affect the other.
 */
export async function syncOrderToZoho(
  orderId: string,
  order: Record<string, unknown>
): Promise<void> {
  log('info', 'zoho.sync.start', { orderId });

  const [inventoryResult, crmResult] = await Promise.allSettled([
    zohoSafe('inventory.create_salesorder', () => createZohoSalesOrder(orderId, order)),
    zohoSafe('crm.upsert_contact',          () => upsertZohoCRMContact(order)),
  ]);

  const inventoryOk = inventoryResult.status === 'fulfilled' && inventoryResult.value !== null;
  const crmOk       = crmResult.status === 'fulfilled'       && crmResult.value !== null;

  log('info', 'zoho.sync.complete', { orderId, inventoryOk, crmOk });
}

// ---------------------------------------------------------------------------
// Replace these stubs with your actual Zoho API implementations
// ---------------------------------------------------------------------------

async function createZohoSalesOrder(
  orderId: string,
  order: Record<string, unknown>
): Promise<{ zohoOrderId: string }> {
  // TODO: replace with your existing Zoho Inventory API call
  // Example:
  //   const token = await getZohoAccessToken();
  //   const res = await fetch(`https://inventory.zoho.com/api/v1/salesorders`, {
  //     method: 'POST',
  //     headers: { Authorization: `Zoho-oauthtoken ${token}`, ... },
  //     body: JSON.stringify({ /* mapped order */ })
  //   });
  throw new Error('createZohoSalesOrder: not yet implemented — replace this stub');
}

async function upsertZohoCRMContact(
  order: Record<string, unknown>
): Promise<{ contactId: string }> {
  // TODO: replace with your existing Zoho CRM API call
  throw new Error('upsertZohoCRMContact: not yet implemented — replace this stub');
}
