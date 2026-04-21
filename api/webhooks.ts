/**
 * api/webhooks.ts — Webhook receiver (Vercel Serverless)
 *
 * HARDENED: Yoco webhooks now use HMAC-SHA256 signature verification.
 * Other sources (Zoho, ShipLogic) still use token-based auth.
 *
 * URLs to register with external services:
 *   Zoho:      POST https://yoursite.vercel.app/api/webhooks?source=zoho
 *   Yoco:      POST https://yoursite.vercel.app/api/webhooks?source=yoco
 *   ShipLogic: POST https://yoursite.vercel.app/api/webhooks?source=shiplogic
 *
 * Required env vars:
 *   YOCO_WEBHOOK_SECRET — HMAC secret from Yoco dashboard
 *   WEBHOOK_SECRET_ZOHO — token for Zoho webhooks
 *   WEBHOOK_SECRET_SHIPLOGIC — token for ShipLogic webhooks
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Firebase Admin init ────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

// ─── Structured Logger ──────────────────────────────────────────

function logWebhook(source: string, event: string, data?: any) {
  const entry = {
    ts: new Date().toISOString(),
    level: 'info',
    source: `webhook/${source}`,
    event,
    ...(data || {}),
  };
  console.log(JSON.stringify(entry));
}

// ─── HMAC Verification (Yoco) ───────────────────────────────────

function verifyYocoHMAC(req: VercelRequest): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook/yoco] YOCO_WEBHOOK_SECRET not set — rejecting');
    return false;
  }

  const signature = req.headers['x-yoco-signature'] as string | undefined;
  if (!signature) {
    console.warn('[webhook/yoco] Missing X-Yoco-Signature header');
    return false;
  }

  const [algo, provided] = signature.split('=');
  if (algo !== 'sha256' || !provided) {
    console.warn('[webhook/yoco] Malformed signature format:', signature);
    return false;
  }

  // Vercel parses body, so we reconstruct it
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

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
    console.warn(`[webhooks/${source}] No WEBHOOK_SECRET_${source.toUpperCase()} set — accepting (set in production!)`);
    return true;
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader === `Bearer ${expectedToken}`) return true;

  const tokenHeader = req.headers['x-webhook-token'] || req.headers['x-hook-secret'] || '';
  if (tokenHeader === expectedToken) return true;

  if (req.query.token === expectedToken) return true;

  return false;
}

// ─── Handler ────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Token, X-Hook-Secret, X-Yoco-Signature');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const source = (req.query.source as string || '').toLowerCase();
  if (!source) {
    return res.status(400).json({ error: 'Missing ?source= parameter. Use: zoho|yoco|shiplogic' });
  }

  // ── Source-specific security ──────────────────────────────────
  if (source === 'yoco') {
    if (!verifyYocoHMAC(req)) {
      logWebhook('yoco', 'REJECTED — invalid HMAC signature');
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }
    logWebhook('yoco', 'HMAC signature verified');
  } else {
    if (!verifyWebhookToken(source, req)) {
      logWebhook(source, 'REJECTED — invalid token');
      return res.status(401).json({ error: 'Invalid webhook token' });
    }
  }

  const body = req.body || {};
  logWebhook(source, 'Received', { keys: Object.keys(body) });

  try {
    switch (source) {

      // ═══════════════════════════════════════════════════════════
      // ZOHO — inventory updates, order status, CRM changes
      // ═══════════════════════════════════════════════════════════
      case 'zoho': {
        const eventType = body.event_type || body.module || body.action || 'unknown';
        const module    = body.module || body.resource || '';
        const recordId  = body.id || body.record_id || body.data?.id || '';

        logWebhook('zoho', `Event: ${eventType}`, { module, recordId });

        switch (eventType) {
          case 'SalesOrders.update':
          case 'salesorder_update': {
            const status = body.data?.status || body.status || '';
            logWebhook('zoho', `Sales order ${recordId} → ${status}`);
            break;
          }
          case 'Items.update':
          case 'item_update': {
            const itemId = body.data?.item_id || recordId;
            const stock  = body.data?.stock_on_hand ?? body.stock_on_hand;
            logWebhook('zoho', `Item ${itemId} stock → ${stock}`);
            break;
          }
          case 'Contacts.create':
          case 'Contacts.update': {
            logWebhook('zoho', `CRM contact ${eventType}: ${recordId}`);
            break;
          }
          default:
            logWebhook('zoho', `Unhandled event: ${eventType}`, body);
        }
        return res.status(200).json({ received: true, source: 'zoho', event: eventType });
      }

      // ═══════════════════════════════════════════════════════════
      // YOCO — payment confirmations (HMAC-verified)
      // ═══════════════════════════════════════════════════════════
      case 'yoco': {
        const eventType = body.type || body.event || 'unknown';
        const paymentId = body.payload?.id || body.id || '';
        const status    = body.payload?.status || body.status || '';
        const metadata  = body.payload?.metadata || body.metadata || {};
        const amountCents = body.payload?.amount || 0;

        logWebhook('yoco', `${eventType}: payment=${paymentId} status=${status}`, { metadata, amountCents });

        // Acknowledge immediately — Yoco retries on non-2xx
        res.status(200).json({ success: true, received: true });

        // Process asynchronously (response already sent)
        try {
          if (eventType === 'payment.succeeded' || status === 'succeeded') {
            const orderId = metadata.orderId;
            if (orderId) {
              const orderRef = db.collection('orders').doc(orderId);
              const snap = await orderRef.get();

              if (!snap.exists) {
                logWebhook('yoco', `Order not found: ${orderId}`);
                return;
              }

              const order = snap.data()!;

              // Idempotency — don't re-process
              if (order.paymentStatus === 'paid' || order.status === 'confirmed') {
                logWebhook('yoco', `Order ${orderId} already confirmed — skipping`);
                return;
              }

              await orderRef.update({
                status:            'confirmed',
                paymentStatus:     'paid',
                paymentId:         paymentId,
                paymentAmountCents: amountCents,
                confirmedAt:       FieldValue.serverTimestamp(),
              });

              logWebhook('yoco', `Order ${orderId} confirmed`, { amountCents });
            }
          }

          if (eventType === 'payment.failed' || eventType === 'payment.cancelled' || eventType === 'checkout.expired') {
            const orderId = metadata.orderId;
            if (orderId) {
              await db.collection('orders').doc(orderId).update({
                status:        eventType === 'payment.failed' ? 'payment_failed' : 'cancelled',
                paymentId:     paymentId,
                failedAt:      FieldValue.serverTimestamp(),
              }).catch(e => logWebhook('yoco', 'Status update failed', { orderId, error: e.message }));

              logWebhook('yoco', `Order ${orderId} → ${eventType}`);
            }
          }
        } catch (err: any) {
          console.error(`[webhook/yoco] Processing error:`, err);
        }
        return;
      }

      // ═══════════════════════════════════════════════════════════
      // SHIPLOGIC — delivery status updates
      // ═══════════════════════════════════════════════════════════
      case 'shiplogic': {
        const trackingRef = body.tracking_reference || body.trackingNumber || '';
        const status      = body.status || body.event || '';
        const shipmentId  = body.shipment_id || body.id || '';

        logWebhook('shiplogic', `Shipment ${shipmentId} tracking=${trackingRef} → ${status}`);
        return res.status(200).json({ received: true, source: 'shiplogic', status });
      }

      default:
        logWebhook(source, 'Unknown source — logging raw body', body);
        return res.status(200).json({ received: true, source, warning: 'Unknown source — logged only' });
    }
  } catch (err: any) {
    console.error(`[webhooks/${source}] ERROR:`, err);
    return res.status(200).json({ received: true, error: err.message });
  }
}
