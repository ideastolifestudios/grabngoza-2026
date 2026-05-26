/**
 * services/zoho-auth.ts
 * Grab & Go — Zoho OAuth token manager
 *
 * Set these env vars in Vercel dashboard:
 *   ZOHO_CLIENT_ID       – from api-console.zoho.com  (Self Client)
 *   ZOHO_CLIENT_SECRET   – from api-console.zoho.com
 *   ZOHO_REFRESH_TOKEN   – run zoho-oauth-setup.sh to generate once
 *   ZOHO_DATA_CENTER     – e.g. "com" | "eu" | "in" | "au" | "jp"
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

let _cache: TokenCache | null = null;

export async function getZohoToken(): Promise<string> {
  if (_cache && Date.now() < _cache.expiresAt) return _cache.token;

  const dc    = process.env.ZOHO_DATA_CENTER || 'com';
  const url   = `https://accounts.zoho.${dc}/oauth/v2/token`;
  const body  = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     process.env.ZOHO_CLIENT_ID     || '',
    client_secret: process.env.ZOHO_CLIENT_SECRET  || '',
    refresh_token: process.env.ZOHO_REFRESH_TOKEN  || '',
  });

  const res  = await fetch(url, { method: 'POST', body });
  const data = await res.json() as { access_token: string; expires_in: number; error?: string };

  if (data.error) throw new Error(`Zoho token refresh failed: ${data.error}`);

  _cache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return _cache.token;
}

/** Zoho Inventory base URL */
export function invBase(): string {
  const dc = process.env.ZOHO_DATA_CENTER || 'com';
  return `https://www.zohoapis.${dc}/inventory/v1`;
}

/** Zoho CRM base URL */
export function crmBase(): string {
  const dc = process.env.ZOHO_DATA_CENTER || 'com';
  return `https://www.zohoapis.${dc}/crm/v2`;
}

/** Shared fetch wrapper for Zoho APIs */
export async function zohoFetch(
  url: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const token = await getZohoToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Zoho API error ${res.status}: ${JSON.stringify(data)}`);
  return data as Record<string, unknown>;
}
