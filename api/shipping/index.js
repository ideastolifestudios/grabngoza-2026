// api/shipping/index.js
const fetch = require('node-fetch');

const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_API_URL = (process.env.SHIPLOGIC_API_URL || 'https://api.shiplogic.co.za').replace(/\/$/, '');

function jsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function mockRates() {
  return [
    { rate_id: 'mock-1', carrier: 'MockCarrier', service: 'Standard', price: 49.0, currency: 'ZAR', eta: '2-4 days' },
    { rate_id: 'mock-2', carrier: 'MockCarrier', service: 'Express', price: 99.0, currency: 'ZAR', eta: '1-2 days' },
  ];
}

function mockPickupPoints() {
  return [
    { id: 'pp-1', name: 'Mock Pickup 1', address: '123 Mock St' },
    { id: 'pp-2', name: 'Mock Pickup 2', address: '456 Mock Ave' },
  ];
}

async function fetchShipLogic(path, opts = {}) {
  const url = `${SHIPLOGIC_API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (SHIPLOGIC_API_KEY) headers['Authorization'] = `Bearer ${SHIPLOGIC_API_KEY}`;
  const res = await fetch(url, { ...opts, headers, timeout: 10000 });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upstream ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function handler(req, res) {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const rawUrl = (req.url || '').toString();
    const path = rawUrl.split('?')[0] || '';
    const normalized = path.toLowerCase();

    const isRates = normalized.endsWith('/rates') || normalized.includes('/rates');
    const isPickup = normalized.endsWith('/pickup-points') || normalized.includes('/pickup-points');

    // GET /rates
    if (method === 'GET' && isRates) {
      if (!SHIPLOGIC_API_KEY) return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock' });
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/rates${qs ? `?${qs}` : ''}`);
        const rates = data?.rates ?? data;
        return jsonResponse(res, 200, { success: true, rates });
      } catch (err) {
        console.error('[shipping GET /rates] error', err && err.message ? err.message : err);
        return jsonResponse(res, 200, { success: false, message: String(err), rates: mockRates(), source: 'mock' });
      }
    }

    // GET /pickup-points
    if (method === 'GET' && isPickup) {
      if (!SHIPLOGIC_API_KEY) return jsonResponse(res, 200, { success: true, points: mockPickupPoints(), source: 'mock' });
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/pickup-points${qs ? `?${qs}` : ''}`);
        const points = data?.points ?? data;
        return jsonResponse(res, 200, { success: true, points });
      } catch (err) {
        console.error('[shipping GET /pickup-points] error', err && err.message ? err.message : err);
        return jsonResponse(res, 200, { success: false, message: String(err), points: mockPickupPoints(), source: 'mock' });
      }
    }

    // POST /rates
    if (method === 'POST' && isRates) {
      const body = req.body ?? (await readBody(req));
      if (!SHIPLOGIC_API_KEY) return jsonResponse(res, 200, { success: true, rates: mockRates(), source: 'mock', bodyReceived: body });
      try {
        const data = await fetchShipLogic(`/rates`, { method: 'POST', body: JSON.stringify(body) });
        const rates = data?.rates ?? data;
        return jsonResponse(res, 200, { success: true, rates });
      } catch (err) {
        console.error('[shipping POST /rates] error', err && err.message ? err.message : err);
        return jsonResponse(res, 502, { success: false, message: String(err) });
      }
    }

    res.setHeader('Allow', 'GET, POST');
    return jsonResponse(res, 405, { success: false, message: 'Method Not Allowed or unknown shipping route' });
  } catch (err) {
    console.error('[shipping handler] unexpected error', err && err.message ? err.message : err);
    return jsonResponse(res, 500, { success: false, message: String(err) });
  }
};
