/**
 * api/shipping.ts — Grab & Go Shipping API (Vercel Serverless)
 *
 * STANDALONE — no _lib/ or _services/ imports. Works on any Node version.
 *
 * Actions:
 *   POST ?action=rates          — Live ShipLogic courier rates
 *   GET  ?action=pickup-points  — Bob Go pickup/PUDO points
 *   GET  ?action=track          — Shipment tracking
 *   GET  ?action=label          — Download shipping label PDF
 *   GET  ?action=health         — Health check
 *
 * Providers:
 *   ShipLogic: https://api.shiplogic.com (rates, shipments, labels)
 *   Bob Go:    https://api.bobgo.co.za/v2 (pickup points)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Config ────────────────────────────────────────────────────────────────
const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const BOBGO_API_KEY     = process.env.BOBGO_API_KEY || process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_BASE    = 'https://api.shiplogic.com';
const BOBGO_BASE        = 'https://api.bobgo.co.za/v2';

// Grab & Go studio address (ship-from origin)
const ORIGIN = {
  street_address: '1104 Tugela Street',
  local_area:     'Klipfontein View',
  city:           'Midrand',
  zone:           'GP',
  country:        'ZA',
  code:           '1685',
};

// Free collection point (studio pickup)
const STUDIO_COLLECTION = {
  id:              'studio-collection',
  name:            'Grab & Go Studio (Free Collection)',
  address:         '1104 Tugela Street, Klipfontein View',
  suburb:          'Klipfontein View',
  city:            'Midrand',
  province:        'Gauteng',
  postal_code:     '1685',
  lat:             -25.9899,
  lng:             28.1265,
  operating_hours: 'Mon-Fri 09:00-17:00, Sat 09:00-13:00',
  type:            'studio',
};

// Fallback rates when ShipLogic is unavailable
const FALLBACK_RATES = [
  {
    id: 'fallback-standard',
    amount: 99,
    serviceLevel: { name: 'Standard Shipping', description: '3-5 business days', code: 'STD' },
    courier: 'Grab & Go Logistics',
    transitDays: 4,
  },
  {
    id: 'fallback-express',
    amount: 149,
    serviceLevel: { name: 'Express Shipping', description: '1-2 business days', code: 'EXP' },
    courier: 'Grab & Go Logistics',
    transitDays: 2,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function slHeaders() {
  return { 'Authorization': `Bearer ${SHIPLOGIC_API_KEY}`, 'Content-Type': 'application/json' };
}

function bgHeaders() {
  return { 'Authorization': `Bearer ${BOBGO_API_KEY}`, 'Content-Type': 'application/json' };
}

async function slFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${SHIPLOGIC_BASE}${path}`, { ...opts, headers: { ...slHeaders(), ...(opts.headers || {}) } });
}

function err(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({ error: message, details: details || '' });
}

function log(action: string, msg: string, data?: any) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'shipping', action, msg, ...data }));
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  if (!action) return err(res, 400, 'Missing ?action= parameter. Use: rates, pickup-points, track, label, health');

  try {
    switch (action) {

      // ══════════ HEALTH CHECK ══════════
      case 'health': {
        return res.status(200).json({
          ok: true,
          status: 'operational',
          ts: new Date().toISOString(),
          shiplogic: !!SHIPLOGIC_API_KEY,
          bobgo: !!BOBGO_API_KEY,
          origin: `${ORIGIN.city}, ${ORIGIN.code}`,
        });
      }

      // ══════════ LIVE SHIPPING RATES ══════════
      case 'rates': {
        if (req.method !== 'POST') return err(res, 405, 'POST required');

        const { deliveryAddress, items, orderTotal } = req.body || {};
        if (!deliveryAddress) return err(res, 400, 'Missing deliveryAddress');

        // Free shipping threshold
        const total = orderTotal || 0;
        const freeShipping = total >= 1000;

        if (!SHIPLOGIC_API_KEY) {
          log('rates', 'No API key — using fallback');
          const rates = freeShipping
            ? [{ ...FALLBACK_RATES[0], amount: 0, serviceLevel: { ...FALLBACK_RATES[0].serviceLevel, name: 'Free Standard Shipping' } }]
            : FALLBACK_RATES;
          return res.status(200).json({ rates, source: 'fallback', freeShipping });
        }

        // Calculate parcel weight
        const totalWeight = Math.max(
          0.5,
          (items || []).reduce((sum: number, i: any) => sum + (i.weight || 0.5) * (i.quantity || 1), 0)
        );

        const payload = {
          pickup_address: {
            street_address: ORIGIN.street_address,
            local_area:     ORIGIN.local_area,
            city:           ORIGIN.city,
            zone:           ORIGIN.zone,
            country:        ORIGIN.country,
            code:           ORIGIN.code,
          },
          delivery_address: {
            street_address: deliveryAddress.address    || deliveryAddress.street_address || '',
            local_area:     deliveryAddress.suburb     || deliveryAddress.local_area || deliveryAddress.city || '',
            city:           deliveryAddress.city       || '',
            zone:           deliveryAddress.province   || deliveryAddress.zone || '',
            country:        deliveryAddress.country    || 'ZA',
            code:           deliveryAddress.postalCode || deliveryAddress.code || '',
          },
          parcels: [{
            submitted_length_cm: 30,
            submitted_width_cm:  25,
            submitted_height_cm: 15,
            submitted_weight_kg: totalWeight,
          }],
          declared_value: Math.max(total, 500),
        };

        log('rates', 'Requesting rates from ShipLogic', {
          to: payload.delivery_address.city,
          code: payload.delivery_address.code,
          weight: totalWeight,
        });

        const slRes = await slFetch('/shipments/rates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!slRes.ok) {
          const text = await slRes.text();
          log('rates', `ShipLogic error ${slRes.status}`, { error: text.slice(0, 300) });
          return res.status(200).json({ rates: FALLBACK_RATES, source: 'fallback', freeShipping });
        }

        const data = await slRes.json();

        let rates = (data.rates || []).map((r: any) => ({
          id:           r.id || `sl-${Math.random().toString(36).slice(2, 8)}`,
          amount:       freeShipping ? 0 : (r.total_rate || r.rate || 0),
          originalAmount: r.total_rate || r.rate || 0,
          serviceLevel: {
            name:        freeShipping ? `Free ${r.service_level?.name || 'Shipping'}` : (r.service_level?.name || r.courier?.name || 'Standard'),
            description: r.service_level?.description || `${r.transit_days || 3}-${(r.transit_days || 3) + 2} business days`,
            code:        r.service_level?.code || '',
          },
          courier:     r.courier?.name || 'Courier',
          transitDays: r.transit_days || 3,
        }));

        // Sort by price (cheapest first)
        rates.sort((a: any, b: any) => a.originalAmount - b.originalAmount);

        // Always include free studio collection
        rates.push({
          id: 'studio-collection',
          amount: 0,
          originalAmount: 0,
          serviceLevel: {
            name: 'Free Studio Collection',
            description: 'Collect from Grab & Go Studio, Midrand',
            code: 'COLLECT',
          },
          courier: 'Self Collection',
          transitDays: 0,
        });

        log('rates', `Returned ${rates.length} rates`, { live: rates.length - 1, freeShipping });
        return res.status(200).json({ rates, source: 'shiplogic', freeShipping });
      }

      // ══════════ BOB GO PICKUP POINTS ══════════
      case 'pickup-points': {
        const postalCode = (req.query.postal_code as string) || (req.query.postalCode as string) || '';
        const city       = (req.query.city as string) || '';

        // Always include studio collection as first option
        const points: any[] = [STUDIO_COLLECTION];

        if (!BOBGO_API_KEY) {
          log('pickup-points', 'No API key — returning studio only');
          return res.status(200).json({ pickup_points: points, source: 'studio-only' });
        }

        // Try Bob Go API for real PUDO/locker points
        try {
          const params = new URLSearchParams();
          if (postalCode) params.set('postal_code', postalCode);
          if (city) params.set('city', city);
          params.set('country', 'ZA');

          // Try Bob Go API first
          let response = await fetch(`${BOBGO_BASE}/pickup-points?${params.toString()}`, {
            headers: bgHeaders(),
          });

          // If Bob Go doesn't work, try ShipLogic pickup-points
          if (!response.ok) {
            log('pickup-points', `Bob Go API ${response.status} — trying ShipLogic`);
            response = await slFetch(`/pickup-points?${params.toString()}`);
          }

          if (response.ok) {
            const data = await response.json();
            const rawPoints = data.pickup_points || data.results || (Array.isArray(data) ? data : []);

            const resolveStr = (v: any): string => {
              if (!v) return '';
              if (typeof v === 'string') return v;
              if (typeof v === 'object') return v.street_address || v.entered_address || v.address || String(v.id || '');
              return String(v);
            };

            for (const p of rawPoints) {
              points.push({
                id:              String(p.id || p.code || `pp-${points.length}`),
                name:            resolveStr(p.name) || resolveStr(p.title) || 'Pickup Point',
                address:         resolveStr(p.street_address) || resolveStr(p.address) || '',
                suburb:          resolveStr(p.local_area) || resolveStr(p.suburb) || '',
                city:            resolveStr(p.city) || city,
                province:        resolveStr(p.zone) || resolveStr(p.province) || '',
                postal_code:     resolveStr(p.code) || postalCode,
                lat:             typeof p.lat === 'number' ? p.lat : (typeof p.latitude === 'number' ? p.latitude : 0),
                lng:             typeof p.lng === 'number' ? p.lng : (typeof p.longitude === 'number' ? p.longitude : 0),
                operating_hours: typeof p.operating_hours === 'string' ? p.operating_hours : '',
                type:            typeof p.type === 'string' ? p.type : 'counter',
              });
            }

            log('pickup-points', `Found ${rawPoints.length} Bob Go points`, { postalCode, city });
          } else {
            log('pickup-points', 'Both Bob Go and ShipLogic failed — studio only');
          }
        } catch (e: any) {
          log('pickup-points', `Error: ${e.message}`);
        }

        return res.status(200).json({ pickup_points: points, source: points.length > 1 ? 'bobgo' : 'studio-only' });
      }

      // ══════════ TRACKING ══════════
      case 'track': {
        const trackingNumber = req.query.trackingNumber as string;
        if (!trackingNumber) return err(res, 400, 'Missing trackingNumber');

        const slRes = await slFetch(`/shipments?tracking_reference=${encodeURIComponent(trackingNumber)}`);
        if (!slRes.ok) {
          const text = await slRes.text();
          return err(res, slRes.status, 'Tracking lookup failed', text);
        }

        const data = await slRes.json();
        const shipment = data.shipments?.[0] || data;

        return res.status(200).json({
          status:            shipment.status || 'unknown',
          trackingNumber:    shipment.tracking_reference || trackingNumber,
          events:            (shipment.tracking_events || []).map((e: any) => ({
            timestamp:   e.timestamp || e.created_at,
            description: e.description || e.status,
            location:    e.location || '',
          })),
          estimatedDelivery: shipment.estimated_delivery_date || null,
          courier:           shipment.courier?.name || '',
        });
      }

      // ══════════ SHIPPING LABEL ══════════
      case 'label': {
        const shipmentId = req.query.shipmentId as string;
        if (!shipmentId) return err(res, 400, 'Missing shipmentId');

        const shipRes = await slFetch(`/shipments/${shipmentId}`);
        if (!shipRes.ok) {
          const text = await shipRes.text();
          return err(res, shipRes.status, 'Shipment not found', text);
        }

        const shipData = await shipRes.json();
        const labelUrl = shipData.waybill_url || shipData.label_url || shipData.labels?.[0]?.url;

        if (labelUrl) {
          const pdfRes = await fetch(labelUrl);
          if (pdfRes.ok) {
            const buffer = Buffer.from(await pdfRes.arrayBuffer());
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
            return res.status(200).send(buffer);
          }
        }

        const labelRes = await slFetch(`/shipments/${shipmentId}/label`);
        if (labelRes.status === 404 || labelRes.status === 422) {
          return res.status(202).json({ ready: false, message: 'Label being generated. Retry in a few seconds.' });
        }
        if (!labelRes.ok) return err(res, labelRes.status, 'Label unavailable');

        const ct = labelRes.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const json = await labelRes.json();
          const url = json.url || json.label_url;
          if (url) {
            const pdfRes = await fetch(url);
            if (pdfRes.ok) {
              const buf = Buffer.from(await pdfRes.arrayBuffer());
              res.setHeader('Content-Type', 'application/pdf');
              return res.status(200).send(buf);
            }
          }
          return res.status(202).json({ ready: false });
        }

        const buffer = Buffer.from(await labelRes.arrayBuffer());
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
        return res.status(200).send(buffer);
      }

      default:
        return err(res, 400, `Unknown action: ${action}. Use: rates, pickup-points, track, label, health`);
    }
  } catch (error: any) {
    console.error('[shipping] Error:', error.message);
    return err(res, 500, 'Internal server error', error.message);
  }
}