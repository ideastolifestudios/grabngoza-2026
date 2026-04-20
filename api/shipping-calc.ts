/**
 * api/shipping-calc.ts — Shipping Calculator API (Vercel Serverless)
 *
 * Separate from existing api/shipping.ts (ShipLogic integration).
 * This handles the simple rule-based calculator for frontend use.
 *
 * Endpoints:
 *   POST  ?action=calculate     — Calculate shipping for a location + total
 *   GET   ?action=rates&total=X — Get all zone rates for a given total
 *   GET   ?action=health        — Health check
 *
 * Frontend usage:
 *   fetch('/api/shipping-calc?action=calculate', {
 *     method: 'POST',
 *     body: JSON.stringify({ city: 'Sandton', province: 'Gauteng', order_total: 850 })
 *   })
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './lib/cors.ts';
import { success, error } from './lib/response.ts';
import * as shippingService from './services/shipping.service.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action as string) || '';

  try {
    switch (action) {

      // ── CALCULATE (main endpoint) ────────────────────────────
      case 'calculate': {
        if (req.method !== 'POST') return error(res, 405, 'POST required');

        const body = req.body || {};
        const validationErrors = shippingService.validateShippingInput(body);
        if (validationErrors.length > 0)
          return res.status(422).json({ success: false, error: 'Validation failed', validationErrors });

        const quote = shippingService.calculateShipping(body);

        console.log(`[shipping-calc] ${body.city || body.location || '?'} → ${quote.zone}: R${quote.cost}`);

        return success(res, { shipping: quote });
      }

      // ── ALL RATES (for frontend dropdowns) ───────────────────
      case 'rates': {
        const total = Number(req.query.total) || 0;
        const rates = shippingService.getAllRates(total);
        return success(res, {
          rates,
          free_shipping_threshold: 1000,
          order_total: total,
        });
      }

      // ── HEALTH ───────────────────────────────────────────────
      case 'health':
        return success(res, { status: 'ok', service: 'shipping-calc' });

      default:
        return error(res, 400, `Unknown action: '${action}'. Use: calculate|rates|health`);
    }
  } catch (err: any) {
    console.error(`[shipping-calc] ERROR:`, err);
    return error(res, 500, 'Internal server error', err.message);
  }
}
