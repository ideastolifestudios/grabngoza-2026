// src/lib/shipping.ts
import fetch from 'node-fetch';

type RatesParams = { to: string; from?: string; weight?: string };
type PickupParams = { lat: string; lng: string; radius?: string };

const CACHE_TTL_MS = Number(process.env.SHIPPING_CACHE_TTL_MS ?? 60_000);
const cache = new Map<string, { ts: number; value: any }>();

function cacheGet(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}
function cacheSet(key: string, value: any) {
  cache.set(key, { ts: Date.now(), value });
}

function getShiplogicBase() {
  // Allow override if you set SHIPLOGIC_API_URL; otherwise use a sensible default.
  // If you prefer a different default, set SHIPLOGIC_API_URL in your .env.local.
  const override = process.env.SHIPLOGIC_API_URL;
  const defaultBase = 'https://api.shiplogic.co.za';
  const base = override?.trim() || defaultBase;
  try {
    // validate absolute URL
    return new URL(base).toString();
  } catch {
    return null;
  }
}

function getAuthHeader() {
  const key = process.env.SHIPLOGIC_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}` };
}

export async function getRates(params: RatesParams) {
  const key = `rates:${params.to}:${params.from ?? ''}:${params.weight ?? ''}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const base = getShiplogicBase();
  const auth = getAuthHeader();

  if (!auth || !base) {
    console.warn('[shipping] SHIPLOGIC_API_KEY or base URL missing — returning local mock for dev');
    const mock = { carrier: 'shiplogic-mock', price: 99.0, currency: 'ZAR', params };
    cacheSet(key, mock);
    return mock;
  }

  const url = `${base.replace(/\/$/, '')}/rates?to=${encodeURIComponent(params.to)}&weight=${encodeURIComponent(params.weight ?? '')}&from=${encodeURIComponent(params.from ?? '')}`;
  console.log('[shipping] ShipLogic rates fetch:', url);
  const resp = await fetch(url, {
    headers: { ...auth, 'Content-Type': 'application/json' },
    method: 'GET',
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`ShipLogic rates error ${resp.status} ${body}`);
  }
  const data = await resp.json();
  cacheSet(key, data);
  return data;
}

export async function getPickupPoints(params: PickupParams) {
  const key = `pickup:${params.lat}:${params.lng}:${params.radius ?? '10'}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const base = getShiplogicBase();
  const auth = getAuthHeader();

  if (!auth || !base) {
    console.warn('[shipping] SHIPLOGIC_API_KEY or base URL missing — returning local mock for dev');
    const mock = [{ id: 'mock-1', name: 'Mock Pickup', lat: params.lat, lng: params.lng }];
    cacheSet(key, mock);
    return mock;
  }

  const url = `${base.replace(/\/$/, '')}/pickup-points?lat=${encodeURIComponent(params.lat)}&lng=${encodeURIComponent(params.lng)}&radius=${encodeURIComponent(params.radius ?? '10')}`;
  console.log('[shipping] ShipLogic pickup-points fetch:', url);
  const resp = await fetch(url, {
    headers: { ...auth, 'Content-Type': 'application/json' },
    method: 'GET',
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`ShipLogic pickup-points error ${resp.status} ${body}`);
  }
  const data = await resp.json();
  cacheSet(key, data);
  return data;
}
