/**
 * api/create-shipment.ts — Grab & Go Shipment Creation (Vercel Serverless)
 *
 * Called internally by api/payments.ts after Yoco payment is confirmed.
 * Creates a ShipLogic shipment, stores shipmentId + labelUrl on the Firestore order.
 *
 * POST /api/create-shipment
 * Body: { orderId, order }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin init ───────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

// ─── ShipLogic config ──────────────────────────────────────────────────────
const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_BASE    = 'https://api.shiplogic.com';

const ORIGIN = {
  type:           'residential' as const,
  company:        'Grab & Go Studio',
  street_address: '10 Studio Lane',
  local_area:     'Sandton',
  city:           'Johannesburg',
  zone:           'GP',
  country:        'ZA',
  code:           '2196',
  contact_name:   'Grab & Go Dispatch',
  phone:          process.env.STUDIO_PHONE || '+27000000000',
  email:          process.env.STUDIO_EMAIL || 'dispatch@grabandgo.co.za',
};

function slHeaders() {
  return {
    'Authorization': `Bearer ${SHIPLOGIC_API_KEY}`,
    'Content-Type':  'application/json',
  };
}

function err(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({ error: message, details: details || '' });
}

// ─── Build parcel dimensions from cart items ────────────────────────────────
function buildParcels(items: any[]) {
  // Group into one parcel, sum weight, use max dimensions
  let totalWeight = 0;
  let maxL = 25, maxW = 20, maxH = 10;

  for (const item of items) {
    const qty = item.quantity || 1;
    totalWeight += (item.weight || 0.5) * qty;
    // If product has dimensions use them, else clothing defaults
    maxL = Math.max(maxL, item.length_cm || 30);
    maxW = Math.max(maxW, item.width_cm  || 25);
    maxH = Math.max(maxH, item.height_cm || 5);
  }

  // Clamp minimum
  totalWeight = Math.max(0.5, Math.round(totalWeight * 10) / 10);

  return [{
    submitted_length_cm: maxL,
    submitted_width_cm:  maxW,
    submitted_height_cm: maxH,
    submitted_weight_kg: totalWeight,
  }];
}

// ─── Safely extract a string from a possibly-nested ShipLogic address field ──
function resolveStr(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    return v.street_address || v.entered_address || v.address || v.name || '';
  }
  return String(v);
}

// ─── Build delivery address from order ─────────────────────────────────────
// Handles multiple address shapes: flat order fields, bobGo pickup point,
// or a nested deliveryAddress object saved to Firestore.
function buildDeliveryAddress(order: any) {
  const contact = `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Customer';

  // Bob Go: use stored deliveryAddress object (already normalised at checkout)
  if (order.deliveryMethod === 'bobgo' && order.bobGoPickupPoint) {
    const pp = order.bobGoPickupPoint;
    return {
      type:           'business',
      company:        resolveStr(pp.name) || 'PUDO Point',
      street_address: resolveStr(pp.address)     || resolveStr(pp.street_address) || '',
      local_area:     resolveStr(pp.suburb)       || resolveStr(pp.local_area) || '',
      city:           resolveStr(pp.city)         || '',
      zone:           resolveStr(pp.province)     || resolveStr(pp.zone) || 'GP',
      country:        'ZA',
      code:           resolveStr(pp.postal_code)  || resolveStr(pp.code) || '',
      contact_name:   contact,
      phone:          order.phone  || '',
      email:          order.email  || '',
    };
  }

  // If order has a pre-built deliveryAddress object (nested), use it but ensure strings
  if (order.deliveryAddress && typeof order.deliveryAddress === 'object') {
    const da = order.deliveryAddress;
    return {
      type:           da.type           || 'residential',
      company:        resolveStr(da.company)        || '',
      street_address: resolveStr(da.street_address) || resolveStr(da.address) || order.address || '',
      local_area:     resolveStr(da.local_area)     || resolveStr(da.suburb)  || order.city    || '',
      city:           resolveStr(da.city)           || order.city     || '',
      zone:           resolveStr(da.zone)           || resolveStr(da.province) || order.province || 'GP',
      country:        resolveStr(da.country)        || order.deliveryCountry || 'ZA',
      code:           resolveStr(da.code)           || resolveStr(da.postal_code) || order.postalCode || '',
      contact_name:   resolveStr(da.contact_name)  || contact,
      phone:          resolveStr(da.phone)          || order.phone || '',
      email:          resolveStr(da.email)          || order.email || '',
    };
  }

  // Standard domestic — flat order fields
  return {
    type:           'residential',
    street_address: order.address    || '',
    local_area:     order.city       || '',
    city:           order.city       || '',
    zone:           order.province   || 'GP',
    country:        order.deliveryCountry || order.country || 'ZA',
    code:           order.postalCode || '',
    contact_name:   contact,
    phone:          order.phone  || '',
    email:          order.email  || '',
  };
}

// ─── Deduct stock from Firestore ────────────────────────────────────────────
async function deductStock(items: any[]) {
  const batch = db.batch();
  const errors: string[] = [];

  for (const item of items) {
    if (!item.id) continue;
    const ref = db.collection('products').doc(item.id);
    const snap = await ref.get();
    if (!snap.exists) continue;

    const product = snap.data() as any;
    if (!product.stock) continue; // No stock tracking

    const qty = item.quantity || 1;
    const updatedStock: Record<string, number> = { ...product.stock };

    if (item.selectedVariants && Object.keys(item.selectedVariants).length > 0) {
      // Deduct per variant
      for (const [variantName, option] of Object.entries(item.selectedVariants as Record<string,string>)) {
        const key = `${variantName}:${option}`;
        if (updatedStock[key] !== undefined) {
          updatedStock[key] = Math.max(0, updatedStock[key] - qty);
        }
      }
    } else if (updatedStock['_default'] !== undefined) {
      updatedStock['_default'] = Math.max(0, updatedStock['_default'] - qty);
    }

    batch.update(ref, { stock: updatedStock });
  }

  try {
    await batch.commit();
  } catch (e: any) {
    errors.push(e.message);
    console.error('[create-shipment] stock deduction failed:', e);
  }

  return errors;
}

// ─── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

  // ─── SECURITY: Internal auth guard ───────────────────────────────────
  // Only api/payments.ts should call this endpoint (via X-Internal-Secret header)
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    console.error('[create-shipment] INTERNAL_API_SECRET not configured');
    return err(res, 503, 'Service not configured');
  }
  const providedSecret = req.headers['x-internal-secret'] as string;
  if (providedSecret !== internalSecret) {
    console.warn('[create-shipment] Unauthorized access attempt from:', req.headers.origin || 'unknown');
    return err(res, 403, 'Forbidden');
  }

  const { orderId, order } = req.body || {};
  if (!orderId || !order) return err(res, 400, 'Missing orderId or order');

  if (!SHIPLOGIC_API_KEY) {
    console.error('[create-shipment] SHIPLOGIC_API_KEY not set');
    // Don't block order success — just log and return
    return res.status(200).json({ ok: true, warning: 'Shipping service not configured — create shipment manually' });
  }

  try {
    // ── 1. Deduct stock ──────────────────────────────────────────────────
    const stockErrors = await deductStock(order.items || []);
    if (stockErrors.length) {
      console.error('[create-shipment] stock errors:', stockErrors);
    }

    // ── 2. Build ShipLogic payload ───────────────────────────────────────
    const parcels = buildParcels(order.items || []);
    const deliveryAddress = buildDeliveryAddress(order);

    // Declared value = order total in ZAR (used for insurance)
    const declaredValue = Math.round(order.total || 500);

    // Special instructions from Bob Go pickup or general notes
    const specialInstructions = order.specialInstructions || `Order #${orderId}`;

    const payload: any = {
      pickup_address:   ORIGIN,
      delivery_address: deliveryAddress,
      parcels,
      declared_value:  declaredValue,
      special_instructions: specialInstructions,
      // Use the rate/service level the customer selected at checkout
      ...(order.selectedServiceLevel ? {
        service_level_code: order.selectedServiceLevel,
      } : {}),
      // Metadata for tracking
      reference: orderId,
      customer_reference: `${order.firstName} ${order.lastName} — ${order.email}`,
    };

    // International: add customs info
    if (order.isInternational || (order.country && order.country !== 'ZA')) {
      payload.customs = {
        purpose: 'sale',
        currency: 'ZAR',
        items: (order.items || []).map((item: any) => ({
          description:  item.name,
          quantity:     item.quantity || 1,
          value:        item.price || 0,
          country_of_origin: 'ZA',
          harmonised_code: '6109100000', // Generic clothing HS code
        })),
      };
    }

    // ── 3. Create ShipLogic shipment ─────────────────────────────────────
    const slRes = await fetch(`${SHIPLOGIC_BASE}/shipments`, {
      method:  'POST',
      headers: slHeaders(),
      body:    JSON.stringify(payload),
    });

    const slData = await slRes.json();

    if (!slRes.ok) {
      console.error('[create-shipment] ShipLogic error:', slRes.status, JSON.stringify(slData));
      // Update order with error flag but don't fail the order
      await db.collection('orders').doc(orderId).update({
        shipmentError: slData.message || 'ShipLogic creation failed',
        shipmentStatus: 'error',
      });
      return res.status(200).json({
        ok: false,
        error: 'Shipment creation failed — create manually in ShipLogic',
        details: slData,
      });
    }

    const shipmentId  = slData.id       || slData.shipment_id;
    const waybillUrl  = slData.waybill_url || slData.label_url || slData.labels?.[0]?.url || null;
    const trackingRef = slData.tracking_reference || slData.short_tracking_reference || shipmentId;

    // ── 4. Save shipment details back to Firestore order ─────────────────
    await db.collection('orders').doc(orderId).update({
      shipmentId,
      shipmentStatus: 'created',
      labelUrl:       waybillUrl,
      trackingNumber: trackingRef,
      waybillUrl,
      shipmentCreatedAt: new Date().toISOString(),
    });

    console.log(`[create-shipment] ✅ Shipment ${shipmentId} created for order ${orderId}`);

    return res.status(200).json({
      ok:           true,
      shipmentId,
      trackingRef,
      waybillUrl,
      stockErrors:  stockErrors.length ? stockErrors : undefined,
    });

  } catch (error: any) {
    console.error('[create-shipment] Unhandled error:', error);
    // Don't crash order success — log and return gracefully
    return res.status(200).json({
      ok:      false,
      error:   error.message,
      warning: 'Order saved but shipment could not be created automatically',
    });
  }
}
