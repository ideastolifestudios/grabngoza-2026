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
    const signatureHeader = req.headers.get('webhook-signature') || req.headers.get('yoco-signature');

    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (webhookSecret && signatureHeader) {
      try {
        const parts = signatureHeader.split(',');
        const timestampPart = parts.find(p => p.startsWith('t='));
        const signaturePart = parts.find(p => p.startsWith('v1='));

        if (timestampPart && signaturePart) {
          const timestamp = timestampPart.split('=')[1];
          const receivedSig = signaturePart.split('=')[1];
          const signedPayload = `${timestamp}.${rawBody}`;

          const expectedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('base64');

          const sigBuffer = Buffer.from(receivedSig);
          const expectedBuffer = Buffer.from(expectedSig);
          
          if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
          }
        }
      } catch (sigError) {
        console.error('Signature verification failed:', sigError);
        return NextResponse.json({ error: 'Signature verification error' }, { status: 400 });
      }
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

    // Atomic Transaction for Order, Variant Inventory, and Notification Outbox
    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const orderData = orderSnap.data();

      if (orderData.status === 'paid' || orderData.status === 'completed') {
        return; // Idempotency check
      }

      if (orderData.totalCents !== amountPaidCents || orderData.currency !== currencyPaid) {
        throw new Error(`Payment mismatch: Expected ${orderData.totalCents}, got ${amountPaidCents}`);
      }

      // Decrement Inventory for each canonical item & variant
      for (const item of orderData.items || []) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();

          if (item.variantId && productData.variants && Array.isArray(productData.variants)) {
            // Update specific variant stock
            const updatedVariants = productData.variants.map((v: any) => {
              if (v.id === item.variantId || v.sku === item.variantId) {
                const currentVariantStock = Number(v.stock ?? 0);
                return { ...v, stock: Math.max(0, currentVariantStock - item.quantity) };
              }
              return v;
            });
            transaction.update(productRef, { variants: updatedVariants });
          } else {
            // Update main product stock
            const currentStock = Number(productData.stock ?? productData.quantity ?? 0);
            const newStock = Math.max(0, currentStock - item.quantity);
            transaction.update(productRef, { stock: newStock, quantity: newStock });
          }
        }
      }

      // Update order status to paid
      transaction.update(orderRef, {
        status: 'paid',
        paidAt: serverTimestamp(),
        paymentId: paymentData.id || paymentData.checkoutId || 'yoco_paid',
      });
    });

    // Queue email notification outbox post-transaction
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
