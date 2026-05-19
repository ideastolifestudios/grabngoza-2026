// app/api/yoco-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { syncOrderToZoho } from '@/app/utils/zoho';

// 1. Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// Exact types from your original Express implementation
type YocoEventType = 'payment.succeeded' | 'payment.failed' | 'payment.cancelled' | 'checkout.expired';

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

export async function POST(request: NextRequest) {
  try {
    // 2. Yoco Signature Verification (Replaces your Express middleware)
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('yoco-signature');
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      console.error('[WEBHOOK ERROR] Missing signature or webhook secret.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Standard Yoco HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('base64'); // Note: Adjust to 'hex' if Yoco uses hex strings for your specific API version

    // 3. Parse your exact payload
    const event = JSON.parse(rawBody) as YocoWebhookPayload;
    const { type, payload } = event;
    const orderId = payload.metadata?.orderId;

    console.info(`[WEBHOOK] Received ${type} for Payment: ${payload?.id}`);

    if (!orderId) {
      console.warn(`[WEBHOOK WARN] Missing orderId in metadata for payment ${payload.id}`);
      return NextResponse.json({ success: true, message: 'No orderId attached' }, { status: 200 });
    }

    const orderRef = db.collection('orders').doc(orderId);

    // 4. Process event types (Awaited to survive Vercel Serverless freezing)
    switch (type) {
      case 'payment.succeeded': {
        const snap = await orderRef.get();
        if (!snap.exists) {
          console.warn(`[WEBHOOK WARN] Order ${orderId} not found in Firestore.`);
          break;
        }

        const order = snap.data()!;

        // Idempotency: don't re-process an already confirmed order
        if (order.status === 'confirmed') {
          console.info(`[WEBHOOK INFO] Duplicate success event skipped for Order: ${orderId}`);
          break;
        }

        // Apply your exact Firestore schema updates
        await orderRef.update({
          status: 'confirmed',
          paymentId: payload.id,
          paymentAmountCents: payload.amount,
          paymentCurrency: payload.currency,
          confirmedAt: FieldValue.serverTimestamp(),
        });

        console.info(`[WEBHOOK SUCCESS] Order ${orderId} confirmed.`);

        // Trigger fulfilment (Safe try/catch so Zoho doesn't crash the webhook)
        try {
          await syncOrderToZoho(orderId, order);
        } catch (zohoErr: any) {
          console.error(`[FULFILMENT ERROR] Zoho sync failed for ${orderId}: ${zohoErr.message}`);
        }
        break;
      }

      case 'payment.failed':
      case 'payment.cancelled':
      case 'checkout.expired': {
        await orderRef.update({
          status: type === 'payment.failed' ? 'payment_failed' : 'cancelled',
          paymentId: payload.id,
          failedAt: FieldValue.serverTimestamp(),
        }).catch(err => console.warn(`[WEBHOOK WARN] Status update failed for ${orderId}: ${err.message}`));

        console.info(`[WEBHOOK] Order ${orderId} marked as ${type}`);
        break;
      }

      default:
        console.info(`[WEBHOOK INFO] Unhandled event type: ${type}`);
    }

    // 5. Final Acknowledgement (Closes the Vercel function)
    return NextResponse.json({ success: true, received: true }, { status: 200 });

  } catch (error: any) {
    console.error(`[WEBHOOK FATAL] Failed to process webhook: ${error.message}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}