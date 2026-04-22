/**
 * api/_lib/cors.ts — CORS helper for store-api.ts
 * Sets CORS headers on response.
 */
import type { VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://grabngoza-2026.vercel.app',
  'https://www.grabandgo.co.za',
];

if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://localhost:5173');
}

export function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
