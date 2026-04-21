/**
 * api/yoco-webhook.ts
 * Handles Yoco payment webhook events.
 *
 * Mount in server.ts BEFORE express.json():
 *   app.post('/api/yoco-webhook',
 *     rawBodyMiddleware,
 *     verifyYocoWebhook,
 *     express.json(),
 *     yocoWebhookHandler
 *   );
 */

import { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { log } from '../src/services/logger';

type YocoEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'checkout.expired';

interface YocoWebhookPayload {
  type: YocoEventType;
  createdDate: string;
  payload: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: {
      orderId?: string;
      [key: string]: unknown;
    };
  };
}

export async function yocoWebhookHandler(req: Request, res: Response): Promise<void> {
  // Signature already verified by verifyYocoWebhook middleware
  const event = req.body as YocoWebhookPayload;
  const { type, payload } = event;

  log('info', 'webhook.received', { type, paymentId: payload?.id });

  // Acknowledge immediately — Yoco retries on non-2xx
  res.status(200).json({ success: true, received: true });

  // Process asynchronously after responding (fire-and-forget is safe here
  // because we've already acknowledged; Firestore write failure = logged only)
  setImmediate(() => processWebhookEvent(type, payload).catch(err => {
    log('error', 'webhook.processing_error', { type, error: err.message });
  }));
}

async function processWebhookEvent(
  type: YocoEventType,
  payload: YocoWebhookPayload['payload']
): Promise<void> {
  const db = getFirestore();
  const orderId = payload.metadata?.orderId;

  if (!orderId) {
    log('warn', 'webhook.missing_order_id', { paymentId: payload.id, type });
    return;
  }

  const orderRef = db.collection('orders').doc(orderId);

  switch (type) {
    case 'payment.succeeded': {
      const snap = await orderRef.get();
      if (!snap.exists) {
        log('warn', 'webhook.order_not_found', { orderId, type });
        return;
      }

      const order = snap.data()!;

      // Idempotency: don't re-process an already confirmed order
      if (order.status === 'confirmed') {
        log('info', 'webhook.duplicate_success', { orderId });
        return;
      }

      await orderRef.update({
        status: 'confirmed',
        paymentId: payload.id,
        paymentAmountCents: payload.amount,
        paymentCurrency: payload.currency,
        confirmedAt: FieldValue.serverTimestamp(),
      });

      log('info', 'order.confirmed', { orderId, amountCents: payload.amount });

      // Trigger fulfilment (Zoho, notifications etc.) — these are non-blocking
      await Promise.allSettled([
        triggerFulfilment(orderId, order),
      ]);
      break;
    }

    case 'payment.failed':
    case 'payment.cancelled':
    case 'checkout.expired': {
      await orderRef.update({
        status: type === 'payment.failed' ? 'payment_failed' : 'cancelled',
        paymentId: payload.id,
        failedAt: FieldValue.serverTimestamp(),
      }).catch(err => log('warn', 'webhook.status_update_failed', { orderId, error: err.message }));

      log('info', 'order.payment_not_completed', { orderId, type });
      break;
    }

    default:
      log('info', 'webhook.unhandled_type', { type });
  }
}

async function triggerFulfilment(orderId: string, order: Record<string, unknown>): Promise<void> {
  // Import dynamically to avoid circular deps — replace with your actual Zoho/email services
  try {
    const { syncOrderToZoho } = await import('../src/services/zohoService');
    await syncOrderToZoho(orderId, order);
  } catch (err: any) {
    log('warn', 'fulfilment.zoho_sync_failed', { orderId, error: err.message });
    // System continues — Zoho failure must never block order confirmation
  }
}
