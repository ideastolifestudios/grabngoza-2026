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

export async function getRates(params: RatesParams) {
  const key = `rates:${params.to}:${params.from ?? ''}:${params.weight ?? ''}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${process.env.RATES_API_URL}?to=${encodeURIComponent(params.to)}&weight=${encodeURIComponent(params.weight ?? '')}&from=${encodeURIComponent(params.from ?? '')}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.RATES_API_KEY}` },
    method: 'GET',
  });
  if (!resp.ok) throw new Error(`Rates API error ${resp.status}`);
  const data = await resp.json();
  cacheSet(key, data);
  return data;
}

export async function getPickupPoints(params: PickupParams) {
  const key = `pickup:${params.lat}:${params.lng}:${params.radius ?? '10'}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url = `${process.env.PICKUP_API_URL}?lat=${encodeURIComponent(params.lat)}&lng=${encodeURIComponent(params.lng)}&radius=${encodeURIComponent(params.radius ?? '10')}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.PICKUP_API_KEY}` },
    method: 'GET',
  });
  if (!resp.ok) throw new Error(`Pickup API error ${resp.status}`);
  const data = await resp.json();
  cacheSet(key, data);
  return data;
}
