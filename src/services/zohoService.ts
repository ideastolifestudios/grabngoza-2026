/**
 * src/services/zohoService.ts
 * Zoho integration — wired to real API services.
 * Failures never crash the order flow.
 */

import { log } from './logger';

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
    return null;
  }
}

export async function syncOrderToZoho(
  orderId: string,
  order: Record<string, unknown>
): Promise<void> {
  log('info', 'zoho.sync.start', { orderId });

  // These are server-side API services — they use zohoAuth.ts for OAuth
  // If running in a context without Zoho env vars, they fail gracefully
  const [inventoryResult, crmResult] = await Promise.allSettled([
    zohoSafe('inventory.create_salesorder', async () => {
      const { zohoApiFetch, ZOHO_REGION } = await import('../../api/_lib/zohoAuth');
      const BASE = `https://inventory.zoho.${ZOHO_REGION}/api/v1`;
      const ORG_ID = process.env.ZOHO_INVENTORY_ORG_ID || '';
      if (!ORG_ID) throw new Error('ZOHO_INVENTORY_ORG_ID not set');

      const items = (order.items as any[]) || [];
      const payload = {
        date: new Date().toISOString().split('T')[0],
        salesorder_number: orderId,
        reference_number: orderId,
        customer_name: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Customer',
        line_items: items.map((item: any) => ({
          name: item.name || 'Item',
          rate: item.price || 0,
          quantity: item.quantity || 1,
        })),
        notes: `Grab & Go order ${orderId}. ${order.email || ''}`,
        shipping_charge: (order.shippingCost as number) || 0,
      };

      const result = await zohoApiFetch(BASE, '/salesorders', {
        method: 'POST', body: payload, params: { organization_id: ORG_ID },
      });

      return { zohoOrderId: result.data?.salesorder?.salesorder_id || 'unknown' };
    }),

    zohoSafe('crm.upsert_contact', async () => {
      const { zohoApiFetch, ZOHO_REGION } = await import('../../api/_lib/zohoAuth');
      const BASE = `https://www.zohoapis.${ZOHO_REGION}/crm/v2`;

      const contactData = {
        Email: order.email || '',
        First_Name: order.firstName || '',
        Last_Name: order.lastName || 'Unknown',
        Phone: order.phone || '',
        Description: `Grab & Go customer. Order: ${orderId}`,
        Lead_Source: 'Website',
      };

      const result = await zohoApiFetch(BASE, '/Contacts', {
        method: 'POST', body: { data: [contactData] },
      });

      return { contactId: result.data?.data?.[0]?.details?.id || 'unknown' };
    }),
  ]);

  const inventoryOk = inventoryResult.status === 'fulfilled' && inventoryResult.value !== null;
  const crmOk = crmResult.status === 'fulfilled' && crmResult.value !== null;

  log('info', 'zoho.sync.complete', { orderId, inventoryOk, crmOk });
}