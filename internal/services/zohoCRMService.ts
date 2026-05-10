/**
 * api/services/zohoCRMService.ts — Zoho CRM integration
 *
 * Now uses shared auto-refresh OAuth from lib/zohoAuth.ts.
 */

import type { Order } from '../_lib/types';
import { zohoApiFetch, ZOHO_REGION } from '../_lib/zohoAuth';

const BASE_URL = `https://www.zohoapis.${ZOHO_REGION}/crm/v2`;

export interface ZohoCRMResult {
  success: boolean;
  action?: 'created' | 'updated' | 'skipped';
  zohoContactId?: string;
  error?: string;
  details?: any;
}

async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const result = await zohoApiFetch(BASE_URL, `/Contacts/search`, {
      params: { email },
    });
    if (result.ok && result.data?.data?.length > 0) return result.data.data[0].id;
    return null;
  } catch { return null; }
}

export async function createOrUpdateCustomer(order: Order): Promise<ZohoCRMResult> {
  if (!order.email) return { success: false, error: 'No email on order' };

  try {
    const existingId = await findContactByEmail(order.email);

    const contactData: Record<string, any> = {
      Email: order.email,
      First_Name: order.firstName || '',
      Last_Name: order.lastName || 'Unknown',
      Phone: order.phone || '',
    };

    if (order.deliveryAddress) {
      const da = order.deliveryAddress;
      contactData.Mailing_Street  = da.street_address || da.address || '';
      contactData.Mailing_City    = da.city || '';
      contactData.Mailing_State   = da.zone || da.province || '';
      contactData.Mailing_Zip     = da.code || da.postalCode || '';
      contactData.Mailing_Country = da.country || 'ZA';
    }

    const orderNote = `Last order: ${order.id} (R${order.total}) on ${order.createdAt?.split('T')[0] || 'today'}`;

    if (existingId) {
      contactData.Description = orderNote;
      const result = await zohoApiFetch(BASE_URL, '/Contacts', {
        method: 'PUT', body: { data: [{ id: existingId, ...contactData }] },
      });
      if (result.ok && result.data?.data?.[0]?.status === 'success')
        return { success: true, action: 'updated', zohoContactId: existingId };
      return { success: false, action: 'updated', error: result.data?.data?.[0]?.message || `${result.status}`, details: result.data };
    } else {
      contactData.Description = `Grab & Go customer. ${orderNote}`;
      contactData.Lead_Source = 'Website';
      const result = await zohoApiFetch(BASE_URL, '/Contacts', {
        method: 'POST', body: { data: [contactData] },
      });
      if (result.ok && result.data?.data?.[0]?.status === 'success')
        return { success: true, action: 'created', zohoContactId: result.data.data[0].details?.id };
      if (result.data?.data?.[0]?.code === 'DUPLICATE_DATA')
        return { success: true, action: 'skipped', zohoContactId: result.data.data[0].details?.id, error: 'Duplicate — already exists' };
      return { success: false, error: result.data?.data?.[0]?.message || `${result.status}`, details: result.data };
    }
  } catch (err: any) {
    return { success: false, error: `CRM sync: ${err.message}` };
  }
}
