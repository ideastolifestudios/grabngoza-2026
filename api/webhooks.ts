/**
 * api/webhooks.ts — Production Webhook Receiver
 *
 * ZERO top-level side effects — all heavy imports are dynamic.
 * Module load NEVER crashes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// ─── Logger (inline, no import) ─────────────────────────────────

function log(level: string, action: string, message: string, extra?: any) {
  const entry = { ts: new Date().toISOString(), level, service: 'webhook', action, message, ...extra };
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

// ─── Lazy Redis for idempotency ─────────────────────────────────

let _redis: any = null;
async function getRedis(): Promise<any> {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('UPSTASH_REDIS not configured');
    const { Redis } = await import('@upstash/redis');
    _redis = new Redis({ url, token });
  }
  return _redis;
}

async function claimIdempotencyKey(key: string): Promise<boolean> {
  const redis = await getRedis();
  const result = await redis.set(`idem:${key}`, Date.now(), { nx: true, ex: 604800 });
  return result === 'OK';
}

// ─── HMAC Verification ──────────────────────────────────────────

function verifyYocoHMAC(req: VercelRequest): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) { log('error', 'hmac', 'YOCO_WEBHOOK_SECRET not set'); return false; }

  const signature = req.headers['x-yoco-signature'] as string | undefined;
  if (!signature) { log('warn', 'hmac', 'Missing X-Yoco-Signature'); return false; }

  const [algo, provided] = signature.split('=');
  if (algo !== 'sha256' || !provided) return false;

  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    const a = Buffer.from(provided, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

function verifyWebhookToken(source: string, req: VercelRequest): boolean {
  const expected = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];
  if (!expected) return true;
  const auth = req.headers.authorization || '';
  if (auth === `Bearer ${expected}`) return true;
  const token = req.headers['x-webhook-token'] || req.headers['x-hook-secret'] || '';
  if (token === expected) return true;
  if (req.query.token === expected) return true;
  return false;
}

// ─── Yoco Payment Handler ───────────────────────────────────────

async function handleYocoPayment(body: any) {
  const eventType = body.type;
  const payload = body.payload || body;
  const paymentId = payload.id || payload.paymentId;
  const metadata = payload.metadata || {};
  const orderId = metadata.orderId || metadata.checkoutId;

  log('info', 'yoco-event', `${eventType}`, { paymentId, orderId });

  if (eventType === 'payment.succeeded') {
    const isNew = await claimIdempotencyKey(`yoco:${paymentId}`);
    if (!isNew) {
      log('info', 'dedup', `Duplicate ${paymentId} skipped`);
      return { action: 'duplicate_skipped' };
    }

    // Lazy-import order service
    const orderService = await import('./_services/order.service');

    const existing = await orderService.getOrderByPaymentId(paymentId);
    if (existing) {
      log('info', 'dedup', `Order exists for ${paymentId}`);
      return { action: 'order_already_exists', orderId: existing.id };
    }

    let order: any = null;
    let confirmResult: any = null;

    if (orderId) {
      confirmResult = await orderService.confirmOrder(orderId, paymentId);
      if (confirmResult) order = confirmResult.order;
    }

    if (!order) {
      const amountRands = (payload.amount || 0) / 100;
      order = await orderService.createOrder({
        email: metadata.email || 'unknown@webhook.com',
        firstName: metadata.firstName || 'Webhook',
        lastName: metadata.lastName || 'Customer',
        phone: metadata.phone || '',
        items: metadata.items || [{ productId: 'webhook', name: 'Webhook Order', price: amountRands, quantity: 1 }],
        total: amountRands,
      });
      confirmResult = await orderService.confirmOrder(order.id, paymentId);
      if (confirmResult) order = confirmResult.order;
    }

    // WhatsApp (non-blocking)
    let whatsapp = { success: false };
    try {
      const { sendOrderAlert } = await import('./_services/whatsapp.service');
      whatsapp = await sendOrderAlert(order);
    } catch (err: any) {
      log('error', 'whatsapp', err.message);
    }

    log('info', 'complete', `Payment ${paymentId} processed`, {
      orderId: order.id, whatsapp: whatsapp.success,
      zoho: confirmResult?.zoho?.success, crm: confirmResult?.crm?.success,
    });

    return { action: 'order_confirmed', orderId: order.id, whatsapp, zoho: confirmResult?.zoho, crm: confirmResult?.crm };
  }

  if (['payment.failed', 'payment.cancelled', 'checkout.expired'].includes(eventType)) {
    if (orderId) {
      try {
        const orderService = await import('./_services/order.service');
        await orderService.cancelOrder(orderId, eventType);
      } catch (err: any) { log('error', 'cancel', err.message); }
    }
    return { action: eventType };
  }

  return { action: 'unhandled' };
}

// ─── Main Handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Token, X-Hook-Secret, X-Yoco-Signature');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const source = (req.query.source as string || '').toLowerCase();
  if (!source) return res.status(400).json({ error: 'Missing ?source=' });

  if (source === 'yoco') {
    if (!verifyYocoHMAC(req)) {
      log('error', 'auth', 'HMAC failed');
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
    log('info', 'auth', 'HMAC verified');
  } else if (!verifyWebhookToken(source, req)) {
    log('error', 'auth', `${source} token failed`);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const body = req.body || {};
  log('info', 'received', `${source} webhook`, { type: body.type });

  try {
    switch (source) {
      case 'yoco':
        return res.status(200).json({ success: true, ...(await handleYocoPayment(body)) });
      case 'zoho':
      case 'shiplogic':
        log('info', source, 'received');
        return res.status(200).json({ success: true, received: true });
      default:
        return res.status(400).json({ error: `Unknown source: ${source}` });
    }
  } catch (err: any) {
    log('error', 'crash', err.message);
    return res.status(200).json({ success: false, error: 'Logged internally' });
  }
}