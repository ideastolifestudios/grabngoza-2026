// api/shipping/index.ts
import fetch from 'node-fetch';
import { IncomingMessage, ServerResponse } from 'http';

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

function jsonResponse(res: ServerResponse, status: number, body: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
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

async function readBody(req: IncomingMessage) {
  return new Promise<any>((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const rawUrl = (req.url || '').toString();

    // Normalize path: if Vercel gives relative path like "/rates", or full path "/api/shipping/rates"
    const path = rawUrl.split('?')[0] || '';
    const normalized = path.toLowerCase();

    // Helper checks that work for both '/rates' and '/api/shipping/rates'
    const isRates = normalized.endsWith('/rates') || normalized.includes('/rates');
    const isPickup = normalized.endsWith('/pickup-points') || normalized.includes('/pickup-points');

    // GET /rates
    if (method === 'GET' && isRates) {
      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock' });
      }
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/rates${qs ? `?${qs}` : ''}`);
        const rates = data?.rates ?? data;
        return jsonResponse(res, 200, { success: true, rates });
      } catch (err: any) {
        console.error('[shipping GET /rates] error', err?.message ?? err);
        return jsonResponse(res, 200, { success: false, message: String(err?.message ?? err), rates: mockRates(), source: 'mock' });
      }
    }

    // GET /pickup-points
    if (method === 'GET' && isPickup) {
      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, points: mockPickupPoints(), source: 'mock' });
      }
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/pickup-points${qs ? `?${qs}` : ''}`);
        const points = data?.points ?? data;
        return jsonResponse(res, 200, { success: true, points });
      } catch (err: any) {
        console.error('[shipping GET /pickup-points] error', err?.message ?? err);
        return jsonResponse(res, 200, { success: false, message: String(err?.message ?? err), points: mockPickupPoints(), source: 'mock' });
      }
    }

    // POST /rates
    if (method === 'POST' && isRates) {
      let body: any = req.body ?? (await readBody(req));
      if (!SHIPLOGIC_API_KEY) {
        return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock', bodyReceived: body });
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

    // Not found / method not allowed
    res.setHeader('Allow', 'GET, POST');
    return jsonResponse(res, 405, { success: false, message: 'Method Not Allowed or unknown shipping route' });
  } catch (err: any) {
    console.error('[shipping handler] unexpected error', err);
    return jsonResponse(res, 500, { success: false, message: String(err?.message ?? err) });
  }
}
