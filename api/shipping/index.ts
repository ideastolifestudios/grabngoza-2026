// api/shipping/index.ts
import fetch from 'node-fetch';

type ShipLogicRate = {
  rate_id: string;
  carrier: string;
  service: string;
  price: number;
  currency?: string;
  eta?: string;
  [k: string]: any;
};

type PickupPoint = {
  id: string;
  name: string;
  address?: string;
  lat?: number | string;
  lng?: number | string;
  [k: string]: any;
};

const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_API_URL = (process.env.SHIPLOGIC_API_URL || 'https://api.shiplogic.co.za').replace(/\/$/, '');

function jsonResponse(res: any, status: number, body: any) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function mockRates(): ShipLogicRate[] {
  return [
    { rate_id: 'mock-1', carrier: 'MockCarrier', service: 'Standard', price: 49.0, currency: 'ZAR', eta: '2-4 days' },
    { rate_id: 'mock-2', carrier: 'MockCarrier', service: 'Express', price: 99.0, currency: 'ZAR', eta: '1-2 days' },
  ];
}

function mockPickupPoints(): PickupPoint[] {
  return [
    { id: 'pp-1', name: 'Mock Pickup 1', address: '123 Mock St' },
    { id: 'pp-2', name: 'Mock Pickup 2', address: '456 Mock Ave' },
  ];
}

async function fetchShipLogic(path: string, opts: any = {}) {
  const url = `${SHIPLOGIC_API_URL}${path}`;
  const headers: any = { 'Content-Type': 'application/json' };
  if (SHIPLOGIC_API_KEY) headers['Authorization'] = `Bearer ${SHIPLOGIC_API_KEY}`;
  const res = await fetch(url, { ...opts, headers, timeout: 10000 });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upstream ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export default async function handler(req: any, res: any) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const url = req.url || '';
    if (method === 'GET' && url.includes('/api/shipping/rates')) {
      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock' });
      }
      const qs = req.url.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/rates${qs ? `?${qs}` : ''}`);
        const rates = data?.rates ?? data;
        return jsonResponse(res, 200, { success: true, rates });
      } catch (err: any) {
        console.error('[shipping GET /rates] error', err?.message ?? err);
        return jsonResponse(res, 200, { success: false, message: String(err?.message ?? err), rates: mockRates(), source: 'mock' });
      }
    }

    if (method === 'GET' && url.includes('/api/shipping/pickup-points')) {
      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, points: mockPickupPoints(), source: 'mock' });
      }
      const qs = req.url.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/pickup-points${qs ? `?${qs}` : ''}`);
        const points = data?.points ?? data;
        return jsonResponse(res, 200, { success: true, points });
      } catch (err: any) {
        console.error('[shipping GET /pickup-points] error', err?.message ?? err);
        return jsonResponse(res, 200, { success: false, message: String(err?.message ?? err), points: mockPickupPoints(), source: 'mock' });
      }
    }

    if (method === 'POST' && url.includes('/api/shipping/rates')) {
      let body: any = req.body;
      if (!body) {
        try {
          const raw = await new Promise<string>((resolve) => {
            let data = '';
            req.on('data', (chunk: any) => (data += chunk));
            req.on('end', () => resolve(data));
          });
          body = raw ? JSON.parse(raw) : {};
        } catch {
          body = {};
        }
      }

      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock' });
      }

      try {
        const data = await fetchShipLogic(`/rates`, { method: 'POST', body: JSON.stringify(body) });
        const rates = data?.rates ?? data;
        return jsonResponse(res, 200, { success: true, rates });
      } catch (err: any) {
        console.error('[shipping POST /rates] error', err?.message ?? err);
        return jsonResponse(res, 502, { success: false, message: String(err?.message ?? err) });
      }
    }

    res.setHeader('Allow', 'GET, POST');
    return jsonResponse(res, 405, { success: false, message: 'Method Not Allowed or unknown shipping route' });
  } catch (err: any) {
    console.error('[shipping handler] unexpected error', err);
    return jsonResponse(res, 500, { success: false, message: String(err?.message ?? err) });
  }
}
