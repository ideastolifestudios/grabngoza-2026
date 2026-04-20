/**
 * api/shipping.ts  —  Grab & Go Shipping API (Vercel Serverless)
 *
 * Actions:
 *   GET  ?action=rates          (POST body: deliveryAddress, items)
 *   GET  ?action=pickup-points  (query: postal_code, city)
 *   GET  ?action=track          (query: trackingNumber)
 *   GET  ?action=label          (query: shipmentId)
 *
 * Provider: ShipLogic / Bob Go  (same REST API, two base URLs)
 *   ShipLogic:  https://api.shiplogic.com
 *   Bob Go:     https://api.bobgo.co.za   (uses same ShipLogic engine)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Config ────────────────────────────────────────────────────────────────
const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_BASE    = 'https://api.shiplogic.com';

// Grab & Go origin address (used for rate quotes)
const ORIGIN = {
  street_address: '10 Studio Lane',
  local_area:     'Sandton',
  city:           'Johannesburg',
  zone:           'GP',
  country:        'ZA',
  code:           '2196',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function slHeaders() {
  return {
    'Authorization': `Bearer ${SHIPLOGIC_API_KEY}`,
    'Content-Type':  'application/json',
  };
}

async function slFetch(path: string, opts: RequestInit = {}) {
  const url = `${SHIPLOGIC_BASE}${path}`;
  const res = await fetch(url, { ...opts, headers: { ...slHeaders(), ...(opts.headers || {}) } });
  return res;
}

function err(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({ error: message, details: details || '' });
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  if (!action) return err(res, 400, 'Missing action parameter');

  // Guard: API key must be set
  if (!SHIPLOGIC_API_KEY) {
    console.error('[shipping] SHIPLOGIC_API_KEY not set');
    return err(res, 503, 'Shipping service not configured');
  }

  try {
    switch (action) {

      // ── Shipping rates ─────────────────────────────────────────────────
      case 'rates': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

        const { deliveryAddress, items } = req.body || {};
        if (!deliveryAddress || !items?.length) {
          return err(res, 400, 'Missing deliveryAddress or items');
        }

        // Calculate total weight (kg) from items
        const totalWeight = Math.max(
          0.5,
          items.reduce((sum: number, i: any) => sum + (i.weight || 0.5) * (i.quantity || 1), 0)
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
            street_address: deliveryAddress.address  || '',
            local_area:     deliveryAddress.city     || '',
            city:           deliveryAddress.city     || '',
            zone:           deliveryAddress.province || '',
            country:        deliveryAddress.country  || 'ZA',
            code:           deliveryAddress.postalCode || '',
          },
          parcels: [{
            submitted_length_cm: 30,
            submitted_width_cm:  25,
            submitted_height_cm: 15,
            submitted_weight_kg: totalWeight,
          }],
          declared_value: 500, // R500 default declared value
        };

        const slRes = await slFetch('/shipments/rates', {
          method: 'POST',
          body:   JSON.stringify(payload),
        });

        if (!slRes.ok) {
          const text = await slRes.text();
          console.error('[shipping/rates] ShipLogic error:', slRes.status, text);
          // Return empty rates gracefully — frontend handles this
          return res.status(200).json({ rates: [] });
        }

        const data = await slRes.json();

        // Normalise rates into the shape the frontend expects:
        // { amount: number, serviceLevel: { name: string, description: string } }
        const rates = (data.rates || []).map((r: any) => ({
          id:           r.id,
          amount:       r.total_rate || r.rate || 0,
          serviceLevel: {
            name:        r.service_level?.name        || r.courier?.name || 'Standard',
            description: r.service_level?.description || `${r.transit_days || 3}–${(r.transit_days || 3) + 2} business days`,
            code:        r.service_level?.code        || '',
          },
          courier:    r.courier?.name || '',
          transitDays: r.transit_days || 3,
        }));

        return res.status(200).json({ rates });
      }

      // ── Bob Go pickup points ───────────────────────────────────────────
      case 'pickup-points': {
        const postalCode = req.query.postal_code as string || '';
        const city       = req.query.city        as string || '';

        const params = new URLSearchParams();
        if (postalCode) params.set('postal_code', postalCode);
        if (city)       params.set('city',        city);

        // ShipLogic/Bob Go pickup-points endpoint
        const slRes = await slFetch(`/pickup-points?${params.toString()}`);

        if (!slRes.ok) {
          console.error('[shipping/pickup-points] ShipLogic error:', slRes.status);
          // Return empty — frontend falls back to BOBGO_FALLBACK_POINTS
          return res.status(200).json({ pickup_points: [] });
        }

        const data = await slRes.json();

        // Normalise to the BobGoPickupPoint shape the frontend expects.
        // ShipLogic returns pickup points where address fields can be either
        // flat strings OR nested address objects — handle both shapes.
        const resolveStr = (v: any): string => {
          if (!v) return '';
          if (typeof v === 'string') return v;
          // ShipLogic nested address object
          if (typeof v === 'object') return v.street_address || v.entered_address || v.address || String(v.id || '');
          return String(v);
        };

        const pickup_points = (data.pickup_points || data.results || data || []).map((p: any) => ({
          id:              String(p.id || p.code || ''),
          name:            resolveStr(p.name) || resolveStr(p.title) || 'Pickup Point',
          address:         resolveStr(p.street_address) || resolveStr(p.address) || '',
          suburb:          resolveStr(p.local_area)     || resolveStr(p.suburb) || '',
          city:            resolveStr(p.city)           || city,
          province:        resolveStr(p.zone)           || resolveStr(p.province) || '',
          postal_code:     resolveStr(p.code)           || postalCode,
          lat:             typeof p.lat === 'number' ? p.lat : (typeof p.latitude  === 'number' ? p.latitude  : 0),
          lng:             typeof p.lng === 'number' ? p.lng : (typeof p.longitude === 'number' ? p.longitude : 0),
          operating_hours: typeof p.operating_hours === 'string' ? p.operating_hours : '',
          type:            typeof p.type === 'string' ? p.type : 'counter',
        }));

        return res.status(200).json({ pickup_points });
      }

      // ── Tracking ──────────────────────────────────────────────────────
      case 'track': {
        const trackingNumber = req.query.trackingNumber as string;
        if (!trackingNumber) return err(res, 400, 'Missing trackingNumber');

        const slRes = await slFetch(`/shipments?tracking_reference=${encodeURIComponent(trackingNumber)}`);

        if (!slRes.ok) {
          const text = await slRes.text();
          console.error('[shipping/track] ShipLogic error:', slRes.status, text);
          return err(res, slRes.status, 'Tracking lookup failed', text);
        }

        const data = await slRes.json();
        const shipment = data.shipments?.[0] || data;

        return res.status(200).json({
          status:         shipment.status              || 'unknown',
          trackingNumber: shipment.tracking_reference  || trackingNumber,
          events:         (shipment.tracking_events || []).map((e: any) => ({
            timestamp:   e.timestamp   || e.created_at,
            description: e.description || e.status,
            location:    e.location    || '',
          })),
          estimatedDelivery: shipment.estimated_delivery_date || null,
          courier:           shipment.courier?.name           || '',
        });
      }

      // ── Shipping label (PDF) ──────────────────────────────────────────
      // ShipLogic label generation is async — the label may not be ready
      // immediately after shipment creation. This endpoint returns the PDF
      // bytes when ready, or a 202 with { ready: false } to signal retry.
      case 'label': {
        const shipmentId = req.query.shipmentId as string;
        if (!shipmentId) return err(res, 400, 'Missing shipmentId');

        // First try to get the waybill/label URL from the shipment record
        const shipRes = await slFetch(`/shipments/${shipmentId}`);

        if (!shipRes.ok) {
          const text = await shipRes.text();
          console.error('[shipping/label] get shipment failed:', shipRes.status, text);
          return err(res, shipRes.status, 'Shipment not found', text);
        }

        const shipData = await shipRes.json();

        // If ShipLogic has already generated a label URL, redirect to it
        const labelUrl: string | undefined =
          shipData.waybill_url   ||
          shipData.label_url     ||
          shipData.labels?.[0]?.url;

        if (labelUrl) {
          // Proxy the PDF so the browser can download it without CORS issues
          const pdfRes = await fetch(labelUrl);
          if (pdfRes.ok) {
            const buffer = Buffer.from(await pdfRes.arrayBuffer());
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
            return res.status(200).send(buffer);
          }
        }

        // Try the direct label endpoint
        const labelRes = await slFetch(`/shipments/${shipmentId}/label`);

        if (labelRes.status === 404 || labelRes.status === 422) {
          // Label not generated yet — tell frontend to retry
          return res.status(202).json({
            ready:   false,
            message: 'Label is still being generated by the courier. Please retry in a few seconds.',
          });
        }

        if (!labelRes.ok) {
          const text = await labelRes.text();
          console.error('[shipping/label] label fetch failed:', labelRes.status, text);
          return err(res, labelRes.status, 'Label unavailable', text);
        }

        const contentType = labelRes.headers.get('content-type') || 'application/pdf';

        // If we got JSON back (some couriers return a URL instead of bytes)
        if (contentType.includes('application/json')) {
          const json = await labelRes.json();
          const url  = json.url || json.label_url || json.waybill_url;
          if (url) {
            const pdfRes = await fetch(url);
            if (pdfRes.ok) {
              const buffer = Buffer.from(await pdfRes.arrayBuffer());
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
              return res.status(200).send(buffer);
            }
          }
          // Still not ready
          return res.status(202).json({ ready: false, message: 'Label URL not yet available' });
        }

        // Got raw PDF bytes
        const buffer = Buffer.from(await labelRes.arrayBuffer());
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="label-${shipmentId}.pdf"`);
        return res.status(200).send(buffer);
      }

      default:
        return err(res, 400, `Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('[shipping] Unhandled error:', error);
    return err(res, 500, 'Internal server error', error.message);
  }
}
