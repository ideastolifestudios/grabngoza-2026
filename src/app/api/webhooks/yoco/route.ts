import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    
    // Yoco / Svix standard webhook headers
    const webhookId = req.headers.get('webhook-id');
    const webhookTimestamp = req.headers.get('webhook-timestamp');
    const webhookSignature = req.headers.get('webhook-signature');

    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    // CRITICAL SECURITY FIX: Fail closed if secret or required headers are missing in production
    if (!webhookSecret) {
      console.error('CRITICAL: YOCO_WEBHOOK_SECRET is missing on the server.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      return NextResponse.json({ error: 'Missing webhook signature headers' }, { status: 401 });
    }

    try {
      // Yoco signature format: base64-encoded HMAC-SHA256 of "msgId.timestamp.body"
      // Note: Secrets prefixed with "whsec_" need the base64 part decoded if required, 
      // but standard Yoco secret handling uses the secret bytes.
      const secretBytes = webhookSecret.startsWith('whsec_') 
        ? Buffer.from(webhookSecret.slice(6), 'base64') 
        : Buffer.from(webhookSecret, 'utf8');

      const signedPayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      
      const expectedSignature = crypto
        .createHmac('sha256', secretBytes)
        .update(signedPayload)
        .digest('base64');

      // Extract v1= signature from header (e.g., "v1,signature_hash v1,another_hash")
      const signatures = webhookSignature.split(' ').map(sig => {
        const parts = sig.split(',');
        return parts.length === 2 ? parts[1] : parts[0];
      });

      const isValid = signatures.some(sig => {
        try {
          const sigBuffer = Buffer.from(sig);
          const expectedBuffer = Buffer.from(expectedSignature);
          return sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);
        } catch {
          return false;
        }
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    } catch (sigError) {
      console.error('Webhook signature verification exception:', sigError);
      return NextResponse.json({ error: 'Signature verification failure' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    if (event.type !== 'payment.succeeded' && event.type !== 'checkout.completed') {
      return NextResponse.json({ received: true, message: 'Event ignored' });
    }

    const paymentData = event.payload || event.data || {};
    const orderId = paymentData.metadata?.orderId;
    const amountPaidCents = Number(paymentData.amount);
    const currencyPaid = paymentData.currency || 'ZAR';

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId metadata' }, { status: 400 });
    }

    // Atomic Transaction for Order Settlement & Inventory Decrement
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const orderData = orderSnap.data();

      // Idempotency check: prevent double processing if retry occurs
      if (orderData.status === 'paid' || orderData.status === 'completed') {
        return;
      }

      // Strict Amount & Currency Reconciliation
      if (orderData.totalCents !== amountPaidCents || orderData.currency !== currencyPaid) {
        throw new Error(`Payment mismatch: Expected ${orderData.totalCents} ${orderData.currency}, got ${amountPaidCents} ${currencyPaid}`);
      }

      // Decrement Inventory for each canonical item & variant atomically
      for (const item of orderData.items || []) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();

          if (item.variantId && productData.variants && Array.isArray(productData.variants)) {
            const updatedVariants = productData.variants.map((v: any) => {
              if (v.id === item.variantId || v.sku === item.variantId) {
                const currentVariantStock = Number(v.stock ?? 0);
                return { ...v, stock: Math.max(0, currentVariantStock - item.quantity) };
              }
              return v;
            });
            transaction.update(productRef, { variants: updatedVariants });
          } else {
            const currentStock = Number(productData.stock ?? productData.quantity ?? 0);
            const newStock = Math.max(0, currentStock - item.quantity);
            transaction.update(productRef, { stock: newStock, quantity: newStock });
          }
        }
      }

      // Mark order as paid successfully
      transaction.update(orderRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paymentId: paymentData.id || paymentData.checkoutId || webhookId,
      });
    });

    // Durable Outbox Pattern for Customer Confirmation
    try {
      await addDoc(collection(db, 'notifications_outbox'), {
        orderId,
        type: 'ORDER_CONFIRMATION',
        status: 'queued',
        createdAt: serverTimestamp(),
      });
    } catch (outboxError) {
      console.error('Failed to queue notification outbox:', outboxError);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal webhook error' }, { status: 500 });
  }
}
