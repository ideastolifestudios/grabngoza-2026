/**
 * api/webhook.ts — Yoco Webhook Handler (Vercel Serverless)
 *
 * Receives payment.succeeded events from Yoco.
 * Validates HMAC-SHA256 signature before processing.
 * Updates order status in Firestore.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ─── Firebase Admin ──────────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
const db = getFirestore();

const YOCO_WEBHOOK_SECRET = process.env.YOCO_WEBHOOK_SECRET || '';

function log(level: string, event: string, data?: any) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, event, ...data }));
}

// ─── HMAC-SHA256 signature verification ──────────────────────────────────────
function verifyYocoSignature(payload: string, signature: string): boolean {
  if (!YOCO_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac('sha256', YOCO_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const signature = (req.headers['x-yoco-signature'] || req.headers['x-webhook-signature'] || '') as string;
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  // ── Verify signature ──────────────────────────────────────────────────────
  if (YOCO_WEBHOOK_SECRET) {
    if (!verifyYocoSignature(rawBody, signature)) {
      log('error', 'webhook.signature_invalid', { signature: signature.slice(0, 10) + '...' });
      return res.status(401).json({ error: 'Invalid signature' });
    }
    log('info', 'webhook.signature_valid');
  } else {
    log('warn', 'webhook.no_secret_configured', {
      note: 'YOCO_WEBHOOK_SECRET not set — skipping signature validation. Set it in Vercel env vars!'
    });
  }

  // ── Parse event ───────────────────────────────────────────────────────────
  const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const eventType = event.type || event.event || '';

  log('info', 'webhook.received', { type: eventType, id: event.id });

  // ── Handle payment.succeeded ──────────────────────────────────────────────
  if (eventType === 'payment.succeeded') {
    const paymentId = event.payload?.id || event.data?.id || event.id;
    const metadata = event.payload?.metadata || event.data?.metadata || {};
    const orderId = metadata.orderId;

    if (!orderId) {
      log('warn', 'webhook.no_order_id', { paymentId });
      return res.status(200).json({ received: true, warning: 'No orderId in metadata' });
    }

    try {
      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        log('error', 'webhook.order_not_found', { orderId });
        return res.status(200).json({ received: true, warning: 'Order not found' });
      }

      const currentStatus = orderSnap.data()?.status;

      // Idempotent — don't re-process already confirmed orders
      if (['paid', 'confirmed', 'preparing', 'shipped', 'completed'].includes(currentStatus)) {
        log('info', 'webhook.already_processed', { orderId, currentStatus });
        return res.status(200).json({ received: true, status: 'already_processed' });
      }

      // Update to confirmed/paid
      await orderRef.update({
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: paymentId,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      log('info', 'webhook.order_confirmed', { orderId, paymentId });
      return res.status(200).json({ received: true, orderId, status: 'confirmed' });
    } catch (err: any) {
      log('error', 'webhook.processing_error', { orderId, error: err.message });
      return res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  // ── Handle other events (log + acknowledge) ───────────────────────────────
  log('info', 'webhook.unhandled_event', { type: eventType });
  return res.status(200).json({ received: true, type: eventType });
}
