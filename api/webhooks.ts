/**
 * api/webhooks.ts — Production Webhook Receiver (Vercel Serverless)
 *
 * PRODUCTION-HARDENED:
 *   ✅ HMAC-SHA256 signature verification (Yoco)
 *   ✅ Upstash Redis idempotency (dedup by paymentId)
 *   ✅ Persistent order storage (Redis)
 *   ✅ WhatsApp admin notification (Twilio)
 *   ✅ Zoho CRM + Inventory sync (non-blocking)
 *   ✅ Structured logging for every step
 *   ✅ Never crashes — all side-effects are try/caught
 *
 * Webhook URLs:
 *   Yoco:      POST /api/webhooks?source=yoco
 *   Zoho:      POST /api/webhooks?source=zoho
 *   ShipLogic: POST /api/webhooks?source=shiplogic
 *
 * Required env vars:
 *   YOCO_WEBHOOK_SECRET
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *   TWILIO_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER / ADMIN_WHATSAPP_NUMBER
 *   ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { createLogger } from './_logger';
import { claimIdempotencyKey } from './_lib/redis';
import { sendOrderAlert } from './_services/whatsapp.service';
import * as orderService from './_services/order.service';
import { createOrUpdateCustomer } from './_services/zohoCRMService';
import { createZohoOrder } from './_services/zohoInventoryService';
import type { Order } from './_lib/types';

const log = createLogger('webhook');

// ─── HMAC Verification (Yoco) ───────────────────────────────────

function verifyYocoHMAC(req: VercelRequest): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) {
    log.error('yoco-hmac', 'YOCO_WEBHOOK_SECRET not set — rejecting');
    return false;
  }

  const signature = req.headers['x-yoco-signature'] as string | undefined;
  if (!signature) {
    log.warn('yoco-hmac', 'Missing X-Yoco-Signature header');
    return false;
  }

  const [algo, provided] = signature.split('=');
  if (algo !== 'sha256' || !provided) {
    log.warn('yoco-hmac', `Malformed signature format: ${signature}`);
    return false;
  }

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    const providedBuf = Buffer.from(provided, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (providedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}

// ─── Token Verification (Zoho, ShipLogic) ───────────────────────

function verifyWebhookToken(source: string, req: VercelRequest): boolean {
  const expectedToken = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];

  if (!expectedToken) {
    log.warn('auth', `No WEBHOOK_SECRET_${source.toUpperCase()} set — accepting (set in production!)`);
    return true;
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader === `Bearer ${expectedToken}`) return true;

  const tokenHeader = req.headers['x-webhook-token'] || req.headers['x-hook-secret'] || '';
  if (tokenHeader === expectedToken) return true;

  if (req.query.token === expectedToken) return true;

  return false;
}

// ─── Yoco Payment Handler ───────────────────────────────────────

async function handleYocoPayment(body: any): Promise<{
  action: string;
  orderId?: string;
  whatsapp?: { success: boolean };
  zoho?: { success: boolean };
  crm?: { success: boolean };
}> {
  const eventType = body.type;
  const payload = body.payload || body;
  const paymentId = payload.id || payload.paymentId;
  const metadata = payload.metadata || {};
  const orderId = metadata.orderId || metadata.checkoutId;

  log.info('yoco-event', `Event: ${eventType}`, { paymentId, orderId });

  // ── payment.succeeded ─────────────────────────────────────────
  if (eventType === 'payment.succeeded') {
    // 1. Idempotency check via Redis
    const isNew = await claimIdempotencyKey(`yoco:${paymentId}`);
    if (!isNew) {
      log.info('yoco-dedup', `Duplicate payment ${paymentId} — skipping`, { paymentId });
      return { action: 'duplicate_skipped', orderId };
    }

    // 2. Check if order already exists for this payment
    const existingOrder = await orderService.getOrderByPaymentId(paymentId);
    if (existingOrder) {
      log.info('yoco-dedup', `Order already exists for payment ${paymentId}`, {
        orderId: existingOrder.id, paymentId,
      });
      return { action: 'order_already_exists', orderId: existingOrder.id };
    }

    // 3. Try to confirm existing pending order, or create new one
    let order: Order | null = null;
    let confirmResult: orderService.ConfirmResult | null = null;

    if (orderId) {
      confirmResult = await orderService.confirmOrder(orderId, paymentId);
      if (confirmResult) {
        order = confirmResult.order;
        log.info('order-confirmed', `Order ${orderId} confirmed via webhook`, { paymentId });
      }
    }

    // If no pending order found, create one from webhook data
    if (!order) {
      const amountRands = (payload.amount || 0) / 100; // Yoco sends cents
      order = await orderService.createOrder({
        email: metadata.email || payload.email || 'unknown@webhook.com',
        firstName: metadata.firstName || 'Webhook',
        lastName: metadata.lastName || 'Customer',
        phone: metadata.phone || '',
        items: metadata.items || [{ productId: 'webhook', name: 'Webhook Order', price: amountRands, quantity: 1 }],
        total: amountRands,
        shippingCost: 0,
      });

      // Immediately confirm it
      confirmResult = await orderService.confirmOrder(order.id, paymentId);
      if (confirmResult) order = confirmResult.order;

      log.info('order-created', `New order ${order.id} created from webhook`, {
        paymentId, total: amountRands,
      });
    }

    // 4. WhatsApp notification (non-blocking)
    let whatsappResult = { success: false };
    try {
      whatsappResult = await sendOrderAlert(order);
    } catch (err: any) {
      log.error('whatsapp-fail', `WhatsApp failed: ${err.message}`, { orderId: order.id });
    }

    // 5. Zoho sync (non-blocking — already done in confirmOrder, but handle edge case)
    let zohoResult = confirmResult?.zoho || { success: false };
    let crmResult = confirmResult?.crm || { success: false };

    // If confirmOrder didn't run Zoho (e.g., order was already paid), try manually
    if (!confirmResult || (confirmResult.zoho?.zohoSalesOrderId === 'already-synced')) {
      try {
        const crmRes = await createOrUpdateCustomer(order);
        crmResult = crmRes;
        const zohoRes = await createZohoOrder(order, crmRes.zohoContactId || undefined);
        zohoResult = zohoRes;
      } catch (err: any) {
        log.error('zoho-fail', `Zoho manual sync failed: ${err.message}`, { orderId: order.id });
      }
    }

    log.info('yoco-complete', `Payment ${paymentId} fully processed`, {
      orderId: order.id,
      whatsapp: whatsappResult.success,
      zoho: zohoResult.success,
      crm: crmResult.success,
    });

    return {
      action: 'order_confirmed',
      orderId: order.id,
      whatsapp: { success: whatsappResult.success },
      zoho: { success: zohoResult.success },
      crm: { success: crmResult.success },
    };
  }

  // ── payment.failed / cancelled / checkout.expired ─────────────
  if (['payment.failed', 'payment.cancelled', 'checkout.expired'].includes(eventType)) {
    if (orderId) {
      await orderService.cancelOrder(orderId, eventType).catch(err => {
        log.error('cancel-fail', `Failed to cancel ${orderId}: ${err.message}`);
      });
    }
    log.info('yoco-failed', `Payment ${eventType}`, { paymentId, orderId });
    return { action: eventType, orderId };
  }

  log.info('yoco-unhandled', `Unhandled event type: ${eventType}`);
  return { action: 'unhandled', orderId };
}

// ─── Main Handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Webhook-Token, X-Hook-Secret, X-Yoco-Signature'
  );
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const source = (req.query.source as string || '').toLowerCase();
  if (!source) {
    return res.status(400).json({ error: 'Missing ?source= parameter. Use: yoco|zoho|shiplogic' });
  }

  // ── Security ──────────────────────────────────────────────────
  if (source === 'yoco') {
    if (!verifyYocoHMAC(req)) {
      log.error('auth', 'Yoco HMAC verification failed');
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }
    log.info('auth', 'Yoco HMAC verified ✓');
  } else {
    if (!verifyWebhookToken(source, req)) {
      log.error('auth', `${source} token verification failed`);
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
  }

  const body = req.body || {};
  log.info('received', `Webhook from ${source}`, { keys: Object.keys(body), type: body.type });

  try {
    switch (source) {
      case 'yoco': {
        const result = await handleYocoPayment(body);
        return res.status(200).json({ success: true, ...result });
      }

      case 'zoho': {
        // Pass-through for Zoho webhooks (inventory/CRM updates)
        log.info('zoho', 'Zoho webhook received', { body });
        return res.status(200).json({ success: true, received: true });
      }

      case 'shiplogic': {
        // Pass-through for ShipLogic tracking updates
        log.info('shiplogic', 'ShipLogic webhook received', { body });
        return res.status(200).json({ success: true, received: true });
      }

      default:
        log.warn('unknown', `Unknown webhook source: ${source}`);
        return res.status(400).json({ error: `Unknown source: ${source}` });
    }
  } catch (err: any) {
    // NEVER crash — always return 200 to avoid webhook retries
    log.error('critical', `Webhook handler crashed: ${err.message}`, {
      source, stack: err.stack?.slice(0, 500),
    });
    return res.status(200).json({ success: false, error: 'Internal processing error — logged' });
  }
}