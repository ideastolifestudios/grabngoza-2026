/**
 * api/services/shipping.service.ts — Shipping cost calculator
 *
 * Rules:
 *   - Free shipping if order total > R1000
 *   - Johannesburg: R60 (1-2 days)
 *   - Gauteng (non-JHB): R80 (2-3 days)
 *   - Rest of South Africa: R120 (3-5 days)
 *
 * Also integrates with ShipLogic for live rates when available.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface ShippingQuote {
  cost: number;
  estimated_days: string;
  zone: string;
  free_shipping: boolean;
  method: string;
}

export interface ShippingInput {
  city?: string;
  province?: string;
  postal_code?: string;
  location?: string;   // Fallback: free-text location
  order_total: number;
}

export interface ValidationError { field: string; message: string; }

// ─── Validation ─────────────────────────────────────────────────

export function validateShippingInput(body: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof body.order_total !== 'number' || body.order_total < 0) {
    errors.push({ field: 'order_total', message: 'Must be a non-negative number' });
  }

  const hasLocation = body.city || body.province || body.postal_code || body.location;
  if (!hasLocation) {
    errors.push({ field: 'location', message: 'Provide at least one of: city, province, postal_code, or location' });
  }

  return errors;
}

// ─── Zone Detection ─────────────────────────────────────────────

const JHB_AREAS = [
  'johannesburg', 'sandton', 'randburg', 'midrand', 'fourways', 'rosebank',
  'braamfontein', 'soweto', 'alexandra', 'roodepoort', 'kempton park',
  'edenvale', 'germiston', 'bedfordview', 'alberton',
];

const GAUTENG_CODES = ['0', '1']; // Postal codes starting with 0xxx or 1xxx

function detectZone(input: ShippingInput): 'johannesburg' | 'gauteng' | 'other' {
  const city     = (input.city || '').toLowerCase().trim();
  const province = (input.province || '').toLowerCase().trim();
  const postal   = (input.postal_code || '').trim();
  const location = (input.location || '').toLowerCase().trim();
  const combined = `${city} ${province} ${location}`;

  // Check Johannesburg
  if (JHB_AREAS.some(area => combined.includes(area))) return 'johannesburg';
  if (city === 'jhb' || city === 'joburg') return 'johannesburg';

  // Check Gauteng
  if (province === 'gauteng' || province === 'gp' || province === 'gt') return 'gauteng';
  if (combined.includes('gauteng')) return 'gauteng';
  if (combined.includes('pretoria') || combined.includes('centurion') || combined.includes('tshwane')) return 'gauteng';
  if (combined.includes('benoni') || combined.includes('boksburg') || combined.includes('springs')) return 'gauteng';
  if (postal && GAUTENG_CODES.some(prefix => postal.startsWith(prefix))) return 'gauteng';

  return 'other';
}

// ─── Calculate Shipping ─────────────────────────────────────────

const RATES = {
  johannesburg: { cost: 60,  days: '1-2 business days', method: 'Standard (JHB Metro)' },
  gauteng:      { cost: 80,  days: '2-3 business days', method: 'Standard (Gauteng)' },
  other:        { cost: 120, days: '3-5 business days', method: 'Standard (National)' },
};

const FREE_SHIPPING_THRESHOLD = 1000;

export function calculateShipping(input: ShippingInput): ShippingQuote {
  const zone = detectZone(input);
  const rate = RATES[zone];
  const freeShipping = input.order_total > FREE_SHIPPING_THRESHOLD;

  return {
    cost:          freeShipping ? 0 : rate.cost,
    estimated_days: rate.days,
    zone,
    free_shipping: freeShipping,
    method:        freeShipping ? `Free Shipping (order > R${FREE_SHIPPING_THRESHOLD})` : rate.method,
  };
}

// ─── Bulk: all zones for a given total (for frontend display) ───

export function getAllRates(orderTotal: number): ShippingQuote[] {
  return (['johannesburg', 'gauteng', 'other'] as const).map(zone => {
    const rate = RATES[zone];
    const free = orderTotal > FREE_SHIPPING_THRESHOLD;
    return {
      cost: free ? 0 : rate.cost,
      estimated_days: rate.days,
      zone,
      free_shipping: free,
      method: free ? `Free Shipping (order > R${FREE_SHIPPING_THRESHOLD})` : rate.method,
    };
  });
}
