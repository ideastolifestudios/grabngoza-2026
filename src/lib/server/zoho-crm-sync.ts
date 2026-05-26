// @ts-nocheck
/**
 * api/zoho-crm-sync.ts
 * Grab & Go — Vercel Serverless Function
 *
 * POST /api/zoho-crm-sync
 * Upserts a customer from a paid order into Zoho CRM Contacts.
 * - Searches by email first
 * - Creates if not found, updates if found
 * - Stores order context in the Description field
 *
 * Required env vars:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN,
 *   ZOHO_DATA_CENTER (default: "com")
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { zohoApiFetch } from '../../internal/lib/zohoAuth';

interface CustomerPayload {
  orderId: string; firstName: string; lastName: string; email: string;
  phone?: string; address?: string; city?: string; province?: string;
  postalCode?: string; country?: string; orderTotal?: number;
  itemCount?: number; deliveryMethod?: string;
}

function buildContactFields(p: CustomerPayload): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    First_Name: p.firstName, Last_Name: p.lastName, Email: p.email,
    Mailing_Country: p.country || 'South Africa',
    Description: [
      `Latest order: ${p.orderId}`,
      `R${(p.orderTotal || 0).toFixed(2)}`,
      `${p.itemCount || 0} items`,
      p.deliveryMethod || '',
      'Source: Grab & Go eCommerce',
    ].filter(Boolean).join(' | '),
  };
  if (p.phone)      fields.Phone         = p.phone;
  if (p.address)    fields.Mailing_Street = p.address;
  if (p.city)       fields.Mailing_City  = p.city;
  if (p.province)   fields.Mailing_State = p.province;
  if (p.postalCode) fields.Mailing_Zip   = p.postalCode;
  return fields;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const p = req.body as CustomerPayload;
  if (!p?.email || !p.firstName || !p.lastName)
    return res.status(400).json({ error: 'email, firstName, lastName required' });

  // 1. Search by email
  const searchData = await zohoApiFetch(
    `${crmBase()}/Contacts/search?email=${encodeURIComponent(p.email)}&fields=id,First_Name,Last_Name,Email`
  );
  const existing = (searchData.data as any[])?.[0];
  const fields = buildContactFields(p);

  if (existing) {
    // 2a. UPDATE — id must be INSIDE the data record
    const upd = await zohoApiFetch(`${crmBase()}/Contacts`, {
      method: 'PUT',
      body: JSON.stringify({ data: [{ ...fields, id: existing.id }] }),
    });
    const rec = (upd.data as any[])?.[0];
    if (rec?.status === 'success') {
      return res.status(200).json({
        success: true, action: 'updated',
        zohoContactId: rec.details?.id || existing.id,
        email: p.email, steps: ['Found existing', `Updated ${existing.id}`],
      });
    }
    return res.status(500).json({ error: 'Update failed', detail: rec });
  }

  // 2b. CREATE
  const crt = await zohoApiFetch(`${crmBase()}/Contacts`, {
    method: 'POST',
    body: JSON.stringify({ data: [fields] }),
  });
  const rec = (crt.data as any[])?.[0];
  if (rec?.status === 'success') {
    return res.status(200).json({
      success: true, action: 'created',
      zohoContactId: rec.details?.id || '',
      email: p.email, steps: ['No existing contact', `Created ${rec.details?.id}`],
    });
  }
  return res.status(500).json({ error: 'Create failed', detail: rec });
}
