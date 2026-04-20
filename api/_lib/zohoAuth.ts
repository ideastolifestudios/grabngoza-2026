/**
 * api/lib/zohoAuth.ts — Shared Zoho OAuth 2.0 auto-refresh
 *
 * Single token manager for ALL Zoho services (CRM, Inventory, FSM, Campaigns).
 * Each service gets its own scope but shares client_id/secret + refresh flow.
 *
 * Env vars:
 *   ZOHO_CLIENT_ID         — OAuth app client ID
 *   ZOHO_CLIENT_SECRET     — OAuth app client secret
 *   ZOHO_REFRESH_TOKEN     — Offline refresh token (all scopes combined)
 *   ZOHO_REGION            — com | eu | in | com.au (default: com)
 *
 * How it works:
 *   1. First call → refreshes token using refresh_token
 *   2. Caches in-memory (survives within a Vercel function invocation)
 *   3. On 401 → auto-refreshes once and retries
 *   4. Token cached per cold start (~5-15 min on Vercel)
 */

const REGION        = process.env.ZOHO_REGION || 'com';
const ACCOUNTS_URL  = `https://accounts.zoho.${REGION}`;
const CLIENT_ID     = process.env.ZOHO_CLIENT_ID || '';
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '';

// In-memory cache (per cold start)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Get a valid Zoho OAuth access token. Auto-refreshes if expired.
 */
export async function getZohoToken(): Promise<string> {
  // Return cached if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  return refreshToken();
}

/**
 * Force-refresh the token. Called automatically on 401.
 */
export async function refreshToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error(
      'Zoho OAuth not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN'
    );
  }

  console.log('[zoho-auth] Refreshing access token...');

  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: REFRESH_TOKEN,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    console.error('[zoho-auth] Refresh failed:', data);
    throw new Error(`Zoho token refresh failed: ${data.error || JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  // Zoho tokens last 1 hour — cache for 55 min
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

  console.log('[zoho-auth] Token refreshed successfully');
  return cachedToken!;
}

/**
 * Clear cached token (forces re-fetch on next call).
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
}

/**
 * Helper: make authenticated Zoho API request with auto-retry on 401.
 */
export async function zohoApiFetch(
  baseUrl: string,
  path: string,
  opts: {
    method?: string;
    body?: any;
    params?: Record<string, string>;
  } = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  const { method = 'GET', body, params } = opts;

  const makeRequest = async (token: string) => {
    let url = `${baseUrl}${path}`;
    if (params) {
      const qs = new URLSearchParams(params);
      url += (url.includes('?') ? '&' : '?') + qs.toString();
    }

    return fetch(url, {
      method,
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type':  'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  // First attempt
  let token = await getZohoToken();
  let res = await makeRequest(token);

  // Auto-retry on 401
  if (res.status === 401) {
    console.log('[zoho-auth] Got 401, refreshing token and retrying...');
    clearTokenCache();
    token = await refreshToken();
    res = await makeRequest(token);
  }

  const data = await res.json().catch(() => ({ message: 'Non-JSON response' }));
  return { ok: res.ok, status: res.status, data };
}

export const ZOHO_REGION = REGION;
