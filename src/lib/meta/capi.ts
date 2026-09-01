// src/lib/meta/capi.ts
import crypto from 'crypto';

function hashData(data?: string | null): string | undefined {
  if (!data) return undefined;
  const normalized = data.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export interface CAPIPurchaseItem {
  id: string;
  quantity: number;
  item_price: number;
}

export interface CAPIPurchaseParams {
  orderId: string;
  totalAmount: number;
  currency?: string; // Defaults to 'ZAR'
  items: CAPIPurchaseItem[];
  customer: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    province?: string; // State
    postalCode?: string;
    country?: string; // Defaults to 'za'
  };
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string; // _fbp cookie value
  fbc?: string; // _fbc cookie value
}

/**
 * Sends a server-side Purchase event to Meta Conversions API
 */
export async function sendCAPIPurchaseEvent(params: CAPIPurchaseParams) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[CAPI] Skipped event: META_PIXEL_ID or META_CONVERSIONS_API_ACCESS_TOKEN not set.');
    return null;
  }

  const {
    orderId,
    totalAmount,
    currency = 'ZAR',
    items,
    customer,
    clientIp,
    clientUserAgent,
    fbp,
    fbc,
  } = params;

  // Prepare hashed user data
  const userData: Record<string, any> = {};

  const hashedEmail = hashData(customer.email);
  if (hashedEmail) userData.em = [hashedEmail];

  const hashedPhone = hashData(customer.phone);
  if (hashedPhone) userData.ph = [hashedPhone];

  const hashedFn = hashData(customer.firstName);
  if (hashedFn) userData.fn = [hashedFn];

  const hashedLn = hashData(customer.lastName);
  if (hashedLn) userData.ln = [hashedLn];

  const hashedCity = hashData(customer.city);
  if (hashedCity) userData.ct = [hashedCity];

  const hashedState = hashData(customer.province);
  if (hashedState) userData.st = [hashedState];

  const hashedZip = hashData(customer.postalCode);
  if (hashedZip) userData.zp = [hashedZip];

  const hashedCountry = hashData(customer.country || 'za');
  if (hashedCountry) userData.country = [hashedCountry];

  if (clientIp) userData.client_ip_address = clientIp;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: orderId, // Critical for deduplication with browser Pixel
        user_data: userData,
        custom_data: {
          currency: currency.toUpperCase(),
          value: totalAmount,
          content_type: 'product',
          contents: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.item_price,
          })),
          order_id: orderId,
        },
      },
    ],
    access_token: accessToken,
  };

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('[CAPI Purchase Error]:', result.error || result);
      return { success: false, error: result.error };
    }

    console.log(`[CAPI Success] Purchase event sent for Order #${orderId}`);
    return { success: true, result };
  } catch (error: any) {
    console.error('[CAPI Fetch Error]:', error);
    return { success: false, error: error.message };
  }
}