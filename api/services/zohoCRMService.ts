/**
 * api/services/zohoCRMService.ts — Zoho CRM integration
 *
 * Creates or updates contacts in Zoho CRM when orders are placed.
 * Deduplicates by email — if contact exists, updates it instead.
 *
 * Env vars:
 *   ZOHO_CRM_ACCESS_TOKEN  — OAuth token (manual refresh for now)
 *   ZOHO_CRM_REGION        — com | eu | in | com.au (default: com)
 *
 * API docs: https://www.zoho.com/crm/developer/docs/api/v2/
 */

import type { Order } from '../lib/types.ts';

// ─── Config ─────────────────────────────────────────────────────

const REGION   = process.env.ZOHO_CRM_REGION || 'com';
const BASE_URL = `https://www.zohoapis.${REGION}/crm/v2`;
const TOKEN    = () => process.env.ZOHO_CRM_ACCESS_TOKEN || '';

// ─── Zoho API helpers ───────────────────────────────────────────

function crmHeaders() {
  const token = TOKEN();
  if (!token) throw new Error('ZOHO_CRM_ACCESS_TOKEN not set');
  return {
    'Authorization': `Zoho-oauthtoken ${token}`,
    'Content-Type':  'application/json',
  };
}

async function crmFetch(
  method: string,
  path: string,
  body?: any,
): Promise<{ ok: boolean; status: number; data: any }> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method,
    headers: crmHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({ message: 'Non-JSON response' }));
  return { ok: res.ok, status: res.status, data };
}

// ─── Types ──────────────────────────────────────────────────────

export interface ZohoCRMResult {
  success: boolean;
  action?: 'created' | 'updated' | 'skipped';
  zohoContactId?: string;
  error?: string;
  details?: any;
}

// ─── Search contact by email ────────────────────────────────────

async function findContactByEmail(email: string): Promise<string | null> {
  try {
    // Zoho CRM search: exact email match
    const result = await crmFetch(
      'GET',
      `/Contacts/search?email=${encodeURIComponent(email)}`,
    );

    if (result.ok && result.data?.data?.length > 0) {
      return result.data.data[0].id;
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Create or Update Contact ───────────────────────────────────

/**
 * Creates a new contact or updates existing one (matched by email).
 * NEVER throws — always returns a result object.
 *
 * @param order - The validated local order (used to extract customer info)
 */
export async function createOrUpdateCustomer(order: Order): Promise<ZohoCRMResult> {
  // ── Pre-flight ────────────────────────────────────────────────
  if (!TOKEN()) {
    return {
      success: false,
      error: 'Zoho CRM not configured (ZOHO_CRM_ACCESS_TOKEN missing)',
    };
  }

  if (!order.email) {
    return { success: false, error: 'No email on order — cannot sync to CRM' };
  }

  try {
    // ── 1. Check if contact already exists ──────────────────────
    const existingId = await findContactByEmail(order.email);

    // ── 2. Build contact payload ────────────────────────────────
    const contactData: Record<string, any> = {
      Email:      order.email,
      First_Name: order.firstName || '',
      Last_Name:  order.lastName || 'Unknown',
      Phone:      order.phone || '',
    };

    // Add address if available
    if (order.deliveryAddress) {
      const da = order.deliveryAddress;
      contactData.Mailing_Street  = da.street_address || da.address || '';
      contactData.Mailing_City    = da.city || '';
      contactData.Mailing_State   = da.zone || da.province || '';
      contactData.Mailing_Zip     = da.code || da.postalCode || '';
      contactData.Mailing_Country = da.country || 'ZA';
    }

    // Tag with order info in description
    const orderNote = `Last order: ${order.id} (R${order.total}) on ${order.createdAt?.split('T')[0] || 'today'}`;

    if (existingId) {
      // ── 3a. UPDATE existing contact ───────────────────────────
      contactData.Description = orderNote;

      const result = await crmFetch('PUT', '/Contacts', {
        data: [{ id: existingId, ...contactData }],
      });

      if (result.ok && result.data?.data?.[0]?.status === 'success') {
        console.log(`[zoho-crm] Contact updated: ${existingId} (${order.email})`);
        return {
          success: true,
          action:  'updated',
          zohoContactId: existingId,
        };
      }

      console.error(`[zoho-crm] Update failed for ${existingId}:`, result.data);
      return {
        success: false,
        action:  'updated',
        error:   result.data?.data?.[0]?.message || `Update failed (${result.status})`,
        details: result.data,
      };

    } else {
      // ── 3b. CREATE new contact ────────────────────────────────
      contactData.Description = `Customer from Grab & Go website. ${orderNote}`;
      contactData.Lead_Source = 'Website';

      const result = await crmFetch('POST', '/Contacts', {
        data: [contactData],
      });

      if (result.ok && result.data?.data?.[0]?.status === 'success') {
        const newId = result.data.data[0].details?.id;
        console.log(`[zoho-crm] Contact created: ${newId} (${order.email})`);
        return {
          success: true,
          action:  'created',
          zohoContactId: newId,
        };
      }

      // Handle duplicate detection by Zoho
      const errCode = result.data?.data?.[0]?.code;
      if (errCode === 'DUPLICATE_DATA') {
        const dupId = result.data?.data?.[0]?.details?.id;
        console.log(`[zoho-crm] Duplicate detected, existing: ${dupId}`);
        return {
          success: true,
          action:  'skipped',
          zohoContactId: dupId,
          error:   'Duplicate detected by Zoho — contact already exists',
        };
      }

      console.error(`[zoho-crm] Create failed:`, result.data);
      return {
        success: false,
        action:  'created',
        error:   result.data?.data?.[0]?.message || `Create failed (${result.status})`,
        details: result.data,
      };
    }

  } catch (err: any) {
    console.error(`[zoho-crm] Exception:`, err.message);
    return { success: false, error: `CRM sync failed: ${err.message}` };
  }
}
