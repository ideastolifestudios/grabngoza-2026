// api/shipping.ts
// Handles all shipping via ?action=rates|create|track|label|cancel|pickup-points|webhook
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ── Firebase Admin (only needed for webhook) ──────────────────────────────────
function getDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

const BASE_URL = process.env.SHIPLOGIC_BASE_URL || 'https://api.shiplogic.com';
const API_KEY = () => process.env.SHIPLOGIC_API_KEY || '';

const CORS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token,Content-Type,Accept',
};

function setcors(res: any) { Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v)); }

// Store address from env
const STORE = () => ({
  type: 'business',
  company: 'IDEAS TO LIFE STUDIOS',
  street_address: process.env.BUSINESS_ADDRESS || '1104 Tugela Street',
  local_area: process.env.BUSINESS_LOCAL_AREA || 'Klipfontein View',
  city: process.env.BUSINESS_CITY || 'Midrand',
  zone: process.env.BUSINESS_PROVINCE || 'Gauteng',
  country: 'ZA',
  code: process.env.BUSINESS_POSTAL_CODE || '1685',
});

// ShipLogic status map for webhook
const STATUS_MAP: Record<string, { label: string; emoji: string; fbStatus: string }> = {
  'submitted':           { label: 'Order Placed',         emoji: '📋', fbStatus: 'confirmed' },
  'collection-assigned': { label: 'Pickup Scheduled',     emoji: '📅', fbStatus: 'pickup-scheduled' },
  'collected':           { label: 'Collected by Courier', emoji: '📦', fbStatus: 'collected' },
  'at-hub':              { label: 'At Sorting Hub',       emoji: '🏭', fbStatus: 'in-transit' },
  'in-transit':          { label: 'In Transit',           emoji: '🚚', fbStatus: 'in-transit' },
  'out-for-delivery':    { label: 'Out for Delivery',     emoji: '🛵', fbStatus: 'out-for-delivery' },
  'delivered':           { label: 'Delivered',            emoji: '✅', fbStatus: 'delivered' },
  'failed-delivery':     { label: 'Delivery Failed',      emoji: '❌', fbStatus: 'failed-delivery' },
  'returned':            { label: 'Returned',             emoji: '↩️', fbStatus: 'returned' },
};

// Fallback pickup points for Bob Go
const FALLBACK_POINTS = [
  { id: 'bg-jnb-001', name: 'PUDO Locker – Sandton City', address: 'Shop L23, Sandton City Mall, 83 Rivonia Rd', suburb: 'Sandton', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1076, lng: 28.0567, operating_hours: 'Mon–Sat 09:00–21:00, Sun 10:00–19:00', type: 'locker' },
  { id: 'bg-jnb-002', name: 'PUDO Counter – Rosebank Mall', address: 'Shop 14, The Zone @ Rosebank, Oxford Rd', suburb: 'Rosebank', city: 'Johannesburg', province: 'Gauteng', postal_code: '2196', lat: -26.1453, lng: 28.044, operating_hours: 'Mon–Sun 09:00–20:00', type: 'counter' },
  { id: 'bg-cpt-001', name: 'PUDO Locker – V&A Waterfront', address: 'Ground Floor, Victoria Wharf', suburb: 'Waterfront', city: 'Cape Town', province: 'Western Cape', postal_code: '8001', lat: -33.9025, lng: 18.4199, operating_hours: 'Mon–Sun 09:00–21:00', type: 'locker' },
  { id: 'bg-cpt-002', name: 'PUDO Counter – Cavendish Square', address: 'Lower Ground, Cavendish Square, Dreyer St', suburb: 'Claremont', city: 'Cape Town', province: 'Western Cape', postal_code: '7708', lat: -33.9821, lng: 18.4692, operating_hours: 'Mon–Sat 09:00–19:00', type: 'counter' },
  { id: 'bg-dbn-001', name: 'PUDO Locker – Gateway', address: 'Upper Level, Gateway Theatre, 1 Palm Blvd', suburb: 'Umhlanga', city: 'Durban', province: 'KwaZulu-Natal', postal_code: '4319', lat: -29.7298, lng: 31.0723, operating_hours: 'Mon–Sat 09:00–21:00', type: 'locker' },
  { id: 'bg-pta-001', name: 'PUDO Counter – Menlyn Park', address: 'Menlyn Park Shopping Centre, Atterbury Rd', suburb: 'Menlyn', city: 'Pretoria', province: 'Gauteng', postal_code: '0181', lat: -25.7836, lng: 28.277, operating_hours: 'Mon–Sat 09:00–21:00', type: 'counter' },
];

// Flat-rate fallback when ShipLogic key missing or returns error
const FALLBACK_RATES = [
  { serviceLevel: { name: 'Standard Delivery', description: '3–5 business days', code: 'standard' }, amount: 89, carrier: 'The Courier Guy' },
  { serviceLevel: { name: 'Express Delivery', description: '1–2 business days', code: 'express' }, amount: 149, carrier: 'The Courier Guy' },
];

function parcelFromItems(items: any[]) {
  const totalWeight = (items || []).reduce((s, i) => s + (i.weight || 0.5) * (i.quantity || 1), 0);
  const totalItems = (items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  return {
    submitted_length_cm: Math.min(10 + totalItems * 5, 60),
    submitted_width_cm: Math.min(10 + totalItems * 3, 40),
    submitted_height_cm: Math.min(5 + totalItems * 3, 30),
    submitted_weight_kg: Math.max(totalWeight, 0.5),
  };
}

async function slFetch(path: string, method: string, body?: any) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  setcors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  // ── GET rates ───────────────────────────────────────────────────────────────
  if (action === 'rates') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    if (!API_KEY()) return res.status(200).json({ rates: FALLBACK_RATES });

    const { deliveryAddress, items } = req.body || {};
    if (!deliveryAddress) return res.status(400).json({ error: 'deliveryAddress required' });

    const parcel = parcelFromItems(items || []);
    const payload = {
      collection_address: STORE(),
      delivery_address: {
        type: 'residential',
        street_address: deliveryAddress.address || '',
        local_area: deliveryAddress.city || '',
        city: deliveryAddress.city || '',
        zone: deliveryAddress.province || '',
        country: deliveryAddress.country || 'ZA',
        code: deliveryAddress.postalCode || '',
      },
      parcels: [parcel],
    };

    const { ok, data } = await slFetch('/rates', 'POST', payload);
    if (!ok) return res.status(200).json({ rates: FALLBACK_RATES });

    const rates = (data.rates || []).map((r: any) => ({
      serviceLevel: {
        name: r.service_level?.name || r.service_level?.code || 'Delivery',
        description: r.service_level?.description || '',
        code: r.service_level?.code || '',
        delivery_date_from: r.estimated_delivery_date || null,
      },
      amount: r.price_breakdown?.total || r.cost?.amount || r.rate || 0,
      carrier: r.courier?.name || r.carrier || 'Courier',
    })).sort((a: any, b: any) => a.amount - b.amount);

    return res.status(200).json({ success: true, rates: rates.length ? rates : FALLBACK_RATES, parcelDetails: parcel });
  }

  // ── Pickup points (Bob Go) ──────────────────────────────────────────────────
  if (action === 'pickup-points') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });

    if (!API_KEY()) return res.status(200).json({ pickup_points: FALLBACK_POINTS });

    const { postal_code, city } = req.query;
    const params = new URLSearchParams({ courier: 'bobgo' });
    if (postal_code) params.set('postal_code', postal_code as string);
    if (city) params.set('city', city as string);

    try {
      const { ok, data } = await slFetch(`/pickup-points?${params}`, 'GET');
      const points = ok ? (data.pickup_points || data.locations || []) : [];
      return res.status(200).json({ pickup_points: points.length ? points : FALLBACK_POINTS });
    } catch {
      return res.status(200).json({ pickup_points: FALLBACK_POINTS });
    }
  }

  // ── Create shipment ─────────────────────────────────────────────────────────
  if (action === 'create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    if (!API_KEY()) return res.status(200).json({ success: false, error: 'ShipLogic not configured' });

    const { order, customs, special_instructions_delivery, special_instructions_collection } = req.body || {};
    if (!order) return res.status(400).json({ error: 'order required' });

    const isInternational = order.isInternational || (order.country && order.country !== 'ZA');
    const parcel = parcelFromItems(order.items || []);

    const deliveryAddr = order.deliveryAddress || {
      type: 'residential',
      street_address: order.address || '',
      local_area: order.city || '',
      city: order.city || '',
      zone: order.province || '',
      country: order.country || 'ZA',
      code: order.postalCode || '',
    };

    const payload: any = {
      collection_address: STORE(),
      delivery_address: deliveryAddr,
      collection_contact: {
        name: 'IDEAS TO LIFE STUDIOS',
        mobile_number: process.env.BUSINESS_PHONE || '',
        email: process.env.BUSINESS_EMAIL || '',
      },
      delivery_contact: {
        name: `${order.firstName || ''} ${order.lastName || ''}`.trim(),
        mobile_number: order.phone || '',
        email: order.email || '',
      },
      parcels: [parcel],
      service_level_id: 184277,
      reference: `GNG-${order.id || Date.now()}`,
      declared_value: order.total || 0,
      ...(special_instructions_delivery ? { special_instructions_delivery } : {}),
      ...(special_instructions_collection ? { special_instructions_collection } : {}),
      ...(isInternational && customs ? { customs } : {}),
    };

    const { ok, status, data } = await slFetch('/shipments', 'POST', payload);

    if (!ok) {
      console.error('ShipLogic create error:', JSON.stringify(data));
      return res.status(200).json({ success: false, error: 'ShipLogic error', details: data });
    }

    return res.status(200).json({
      success: true,
      shipmentId: data.id || null,
      trackingNumber: data.tracking_reference || data.short_tracking_reference || null,
      trackingRef: data.custom_tracking_reference || data.reference || `GNG-${order.id?.slice(0, 8)}`,
      waybill_url: data.waybill_url || null,
      status: data.status,
      raw: data,
    });
  }

  // ── Track shipment ──────────────────────────────────────────────────────────
  if (action === 'track') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
    const { trackingNumber } = req.query;
    if (!trackingNumber) return res.status(400).json({ error: 'trackingNumber required' });

    const { ok, data } = await slFetch(`/tracking/${trackingNumber}`, 'GET');
    if (!ok) return res.status(404).json({ error: 'Tracking failed', details: data });

    return res.status(200).json({
      success: true,
      trackingNumber: data.tracking_number,
      status: data.status,
      events: (data.events || []).map((e: any) => ({
        timestamp: e.timestamp,
        location: e.location,
        description: e.description,
      })),
    });
  }

  // ── Print label / cancel ────────────────────────────────────────────────────
  if (action === 'label') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
    const { shipmentId, type } = req.query;
    if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });

    const labelType = type === 'sticker' ? 'sticker' : 'label';
    const response = await fetch(`${BASE_URL}/v2/shipments/${shipmentId}/${labelType}`, {
      headers: { Authorization: `Bearer ${API_KEY()}` },
    });

    if (!response.ok) return res.status(response.status).json({ error: 'Label fetch failed' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=label-${shipmentId}.pdf`);
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));
  }

  if (action === 'cancel') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const { shipmentId } = req.body || {};
    if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });

    const { ok, data } = await slFetch(`/shipments/${shipmentId}/cancel`, 'POST');
    if (!ok) return res.status(400).json({ error: 'Cancel failed', details: data });
    return res.status(200).json({ success: true, message: data.message || 'Cancelled' });
  }

  // ── ShipLogic webhook ───────────────────────────────────────────────────────
  if (action === 'webhook') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    const payload = req.body;

    try {
      const db = getDb();

      if (payload.custom_tracking_reference && payload.status && payload.tracking_events) {
        const ref = payload.custom_tracking_reference;
        const mapped = STATUS_MAP[payload.status] || { label: payload.status, emoji: '📍', fbStatus: payload.status };
        const snap = await db.collection('orders').where('trackingReference', '==', ref).limit(1).get();

        if (!snap.empty) {
          const docRef = snap.docs[0];
          const order = docRef.data();
          const latest = payload.tracking_events?.[0];

          await docRef.ref.update({
            status: mapped.fbStatus,
            lastTrackingUpdate: new Date().toISOString(),
            trackingHistory: FieldValue.arrayUnion({
              slStatus: payload.status,
              message: latest?.message || mapped.label,
              location: latest?.location || '',
              timestamp: payload.event_time || new Date().toISOString(),
            }),
          });

          // Fire notifications (non-blocking)
          const base = process.env.APP_URL || 'https://grabngoza-2026.vercel.app';
          if (order.email) {
            fetch(`${base}/api/notifications?action=email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: order.email,
                subject: `${mapped.emoji} ${mapped.label} — Order #${docRef.id.toUpperCase()}`,
                html: `<p>Hi ${order.firstName}, your order is now <strong>${mapped.label}</strong>.</p>`,
              }),
            }).catch(() => {});
          }
        }
        return res.status(200).json({ received: true, matched: !snap.empty });
      }

      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('[Webhook error]', err.message);
      return res.status(200).json({ received: true, error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action || 'none'}. Use ?action=rates|create|track|label|cancel|pickup-points|webhook` });
}
