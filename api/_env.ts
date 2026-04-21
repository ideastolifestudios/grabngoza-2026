// api/_env.ts — Central environment variable validation
// Import this in each API file to fail fast on missing config.

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`[ENV] Missing required environment variable: ${name}`);
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

// ─── Payment config ────────────────────────────────────────────────────────
export const YOCO_SECRET_KEY  = requireEnv('YOCO_SECRET_KEY');
export const YOCO_API_BASE    = 'https://payments.yoco.com/api';

// ─── Shipping config ───────────────────────────────────────────────────────
export const SHIPLOGIC_API_KEY = requireEnv('SHIPLOGIC_API_KEY');
export const SHIPLOGIC_BASE    = 'https://api.shiplogic.com';

// ─── Firebase ──────────────────────────────────────────────────────────────
export const FIREBASE_PROJECT_ID   = requireEnv('FIREBASE_PROJECT_ID');
export const FIREBASE_CLIENT_EMAIL = requireEnv('FIREBASE_CLIENT_EMAIL');
export const FIREBASE_PRIVATE_KEY  = requireEnv('FIREBASE_PRIVATE_KEY');

// ─── Internal auth ─────────────────────────────────────────────────────────
export const INTERNAL_API_SECRET = requireEnv('INTERNAL_API_SECRET');

// ─── Optional services ─────────────────────────────────────────────────────
export const RESEND_API_KEY = optionalEnv('RESEND_API_KEY');
export const STUDIO_PHONE   = optionalEnv('STUDIO_PHONE', '+27000000000');
export const STUDIO_EMAIL   = optionalEnv('STUDIO_EMAIL', 'dispatch@grabandgo.co.za');
export const STUDIO_WHATSAPP = optionalEnv('STUDIO_WHATSAPP', '+27000000000');

// ─── Base URL ──────────────────────────────────────────────────────────────
export const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : optionalEnv('BASE_URL', 'https://grabngoza-2026.vercel.app');
