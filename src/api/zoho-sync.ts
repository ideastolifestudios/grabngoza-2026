// @ts-nocheck
/**
 * api/zoho-sync.ts — Zoho CRM + Inventory Sync (Vercel Serverless)
 *
 * Called by api/payments.ts after payment is verified.
 * Creates/updates a Contact in Zoho CRM + creates a Sales Order in Zoho Inventory.
 *
 * POST /api/zoho-sync
 * Body: { orderId, order }
 *
 * Env vars required:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_ORG_ID
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Config ────────────────────────────────────────────────────────────────
const ZOHO_CLIENT_ID     = process.env.ZOHO_CLIENT_ID     || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '';
const ZOHO_ORG_ID        = process.env.ZOHO_ORG_ID        || '';

// Zoho API base URLs (adjust .com → .eu / .in if your DC is different)
const ZOHO_ACCOUNTS_URL  = 'https://accounts.zoho.com';
const ZOHO_CRM_URL       = 'https://www.zohoapis.com/crm/v5';
const ZOHO_INVENTORY_URL = 'https://www.zohoapis.com/inventory/v1';

function log(level: string, event: string, data?: any) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, service: 'zoho-sync', event, ...data }));
}

function err(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({ ok: false, error: message, details: details || '' });
}

// ─── Get fresh access token ────────────────────────────────────────────────
let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;

  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    refresh_token: ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token?${params}`, { method: 'POST' });
  const data = await res.json();

  if (!data.access_token) {
    log('error', 'token_refresh_failed', { data });
    throw new Error('Zoho token refresh failed');
  }

  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

// ─── Zoho API helper ───────────────────────────────────────────────────────
async function zohoFetch(url: string, opts: RequestInit & { token: string }) {
  const { token, ...fetchOpts } = opts;
  return fetch(url, {
    ...fetchOpts,
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`,
      'Content-Type':  'application/json',
      ...(ZOHO_ORG_ID ? { 'X-com-zoho-inventory-organizationid': ZOHO_ORG_ID } : {}),
      ...(fetchOpts.headers || {}),
    },
  });
}

// ─── Upsert CRM Contact ───────────────────────────────────────────────────
async function upsertContact(token: string, order: any): Promise<string | null> {
  const contactData = {
    data: [{
      Email:      order.email,
      First_Name: order.firstName || '',
      Last_Name:  order.lastName || 'Customer',
      Phone:      order.phone || '',
      Mailing_Street:  order.address || '',
      Mailing_City:    order.city || '',
      Mailing_State:   order.province || '',
      Mailing_Zip:     order.postalCode || '',
      Mailing_Country: order.country || 'South Africa',
    }],
    duplicate_check_fields: ['Email'],
    trigger: [],
  };

  const res = await zohoFetch(`${ZOHO_CRM_URL}/Contacts/upsert`, {
    token,
    method: 'POST',
    body: JSON.stringify(contactData),
  });
  const result = await res.json();

  const contactId = result?.data?.[0]?.details?.id;
  log('info', 'crm_contact_upserted', { email: order.email, contactId, status: result?.data?.[0]?.status });
  return contactId || null;
}

// ─── Create Inventory Sales Order ──────────────────────────────────────────
async function createSalesOrder(token: string, orderId: string, order: any): Promise<any> {
  const lineItems = (order.items || []).map((item: any, idx: number) => ({
    name:        item.name || `Product ${idx + 1}`,
    description: item.description || item.name || '',
    rate:        item.price || 0,
    quantity:    item.quantity || 1,
    // If you have Zoho item IDs mapped, use item_id instead
  }));

  const salesOrderData = {
    customer_name: `${order.firstName || ''} ${order.lastName || 'Customer'}`.trim(),
    email:         order.email || '',
    reference_number: orderId,
    date:          new Date().toISOString().split('T')[0],
    line_items:    lineItems,
    shipping_charge: order.shippingCost || 0,
    notes:         `Grab & Go Order #${orderId}. Delivery: ${order.deliveryMethod || 'standard'}`,
    shipping_address: {
      address:  order.address || '',
      city:     order.city || '',
      state:    order.province || '',
      zip:      order.postalCode || '',
      country:  order.country || 'South Africa',
    },
  };

  const res = await zohoFetch(`${ZOHO_INVENTORY_URL}/salesorders`, {
    token,
    method: 'POST',
    body: JSON.stringify(salesOrderData),
  });
  const result = await res.json();

  log('info', 'inventory_salesorder_created', {
    orderId,
    zohoSoId: result?.salesorder?.salesorder_id,
    code: result?.code,
  });
  return result;
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    log('warn', 'zoho_not_configured');
    return res.status(200).json({ ok: true, skipped: true, reason: 'Zoho not configured' });
  }

  const { orderId, order } = req.body || {};
  if (!orderId || !order) return err(res, 400, 'Missing orderId or order');

  const results: Record<string, any> = {};

  try {
    const token = await getAccessToken();

    // 1. Upsert CRM Contact
    try {
      results.crmContactId = await upsertContact(token, order);
    } catch (e: any) {
      log('error', 'crm_contact_failed', { orderId, error: e.message });
      results.crmError = e.message;
    }

    // 2. Create Inventory Sales Order
    try {
      const soResult = await createSalesOrder(token, orderId, order);
      results.salesOrderId = soResult?.salesorder?.salesorder_id;
      results.inventoryCode = soResult?.code;
    } catch (e: any) {
      log('error', 'inventory_salesorder_failed', { orderId, error: e.message });
      results.inventoryError = e.message;
    }

    log('info', 'zoho_sync_complete', { orderId, results });
    return res.status(200).json({ ok: true, orderId, results });

  } catch (error: any) {
    log('error', 'zoho_sync_unhandled', { orderId, error: error.message });
    // Don't block the order — Zoho sync is non-critical
    return res.status(200).json({ ok: false, orderId, error: error.message });
  }
}
