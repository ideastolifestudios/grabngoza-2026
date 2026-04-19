// api/[...slug].js
const fetch = require('node-fetch');

const SHIPLOGIC_API_KEY = process.env.SHIPLOGIC_API_KEY || '';
const SHIPLOGIC_API_URL = (process.env.SHIPLOGIC_API_URL || 'https://api.shiplogic.co.za').replace(/\/$/, '');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.end();
    }

    const method = (req.method || 'GET').toUpperCase();
    // Vercel provides the matched path in req.url (e.g., "/shipping/rates" or "/rates")
    const rawUrl = (req.url || '').toString();
    const path = rawUrl.split('?')[0] || '';
    const normalized = path.toLowerCase();

    const is = (suffix) => normalized === suffix || normalized.endsWith(suffix) || normalized.includes(suffix);

    // Shipping routes
    if (method === 'GET' && is('/rates')) {
      if (!SHIPLOGIC_API_KEY) return sendJson(res, 200, { success: true, rates: mockRates(), source: 'mock' });
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/rates${qs ? `?${qs}` : ''}`);
        const rates = data?.rates ?? data;
        return sendJson(res, 200, { success: true, rates });
      } catch (err) {
        console.error('[shipping GET /rates] error', err && err.message ? err.message : err);
        return sendJson(res, 200, { success: false, message: String(err), rates: mockRates(), source: 'mock' });
      }
    }

    if (method === 'GET' && is('/pickup-points')) {
      if (!SHIPLOGIC_API_KEY) return sendJson(res, 200, { success: true, points: mockPickupPoints(), source: 'mock' });
      const qs = rawUrl.split('?')[1] || '';
      try {
        const data = await fetchShipLogic(`/pickup-points${qs ? `?${qs}` : ''}`);
        const points = data?.points ?? data;
        return sendJson(res, 200, { success: true, points });
      } catch (err) {
        console.error('[shipping GET /pickup-points] error', err && err.message ? err.message : err);
        return sendJson(res, 200, { success: false, message: String(err), points: mockPickupPoints(), source: 'mock' });
      }
    }

    if (method === 'POST' && is('/rates')) {
      const body = req.body ?? (await readBody(req));
      if (!SHIPLOGIC_API_KEY) return sendJson(res, 200, { success: true, rates: mockRates(), source: 'mock', bodyReceived: body });
      try {
        const data = await fetchShipLogic(`/rates`, { method: 'POST', body: JSON.stringify(body) });
        const rates = data?.rates ?? data;
        return sendJson(res, 200, { success: true, rates });
      } catch (err) {
        console.error('[shipping POST /rates] error', err && err.message ? err.message : err);
        return sendJson(res, 502, { success: false, message: String(err) });
      }
    }

    // Notifications
    if (is('/notifications')) {
      if (method === 'POST') {
        const body = req.body ?? (await readBody(req));
        const action = (req.query?.action || new URL(req.url, 'http://localhost').searchParams.get('action') || '').toString();
        if (action === 'email') {
          if (!body.to || !body.subject) return sendJson(res, 400, { error: 'Missing: to, subject' });
          console.log('[notifications] email queued', body);
          return sendJson(res, 200, { success: true, message: 'Email queued (mock)' });
        }
        return sendJson(res, 200, { success: true, message: 'Notification received (mock)', action, bodyReceived: body });
      }
      if (method === 'GET') return sendJson(res, 200, { success: true, message: 'notifications endpoint OK' });
    }

    // Webhook
    if (method === 'POST' && is('/webhook-shiplogic')) {
      const body = req.body ?? (await readBody(req));
      console.log('[webhook-shiplogic] received', body);
      return sendJson(res, 200, { success: true, received: true });
    }

    // Payments, create-shipment, tracking, email actions, etc.
    if (is('/create-yoco-payment') || is('/create-shipment') || is('/track-shipment') || is('/send-order-confirmation') || is('/send-product-details') || is('/order-success') || is('/shipment-actions') || is('/submit-return')) {
      if (method === 'POST') {
        const body = req.body ?? (await readBody(req));
        return sendJson(res, 200, { success: true, message: 'Action processed (mock)', bodyReceived: body });
      }
      return sendJson(res, 200, { success: true, message: 'endpoint OK' });
    }

    // Health
    if (is('/health')) return sendJson(res, 200, { success: true, status: 'ok' });

    return sendJson(res, 404, { success: false, message: 'Unknown API route' });
  } catch (err) {
    console.error('[api catch-all] unexpected error', err && err.message ? err.message : err);
    return sendJson(res, 500, { success: false, message: String(err) });
  }
};
