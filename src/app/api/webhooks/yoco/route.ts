import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

function initAdminDb() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  // 1. Check individual FIREBASE_ADMIN_* variables first
  const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (adminProjectId && adminClientEmail && adminPrivateKey) {
    const formattedKey = adminPrivateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: formattedKey,
      }),
    });
    return getFirestore();
  }

  // 2. Fall back to FIREBASE_SERVICE_ACCOUNT_KEY JSON string
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    try {
      const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
      const serviceAccount = JSON.parse(cleanedKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert(serviceAccount) });
      return getFirestore();
    } catch (e: any) {
      console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    }
  }

  // 3. Fallback to Project ID
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'grab-go-za',
  });
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CRITICAL: YOCO_WEBHOOK_SECRET is missing on server.');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    const rawBody = await req.text();
    const webhookId = req.headers.get('webhook-id') || '';
    const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
    const webhookSignature = req.headers.get('webhook-signature') || '';

    // Svix Signature Verification
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const secretBytes = webhookSecret.startsWith('whsec_')
      ? Buffer.from(webhookSecret.slice(6), 'base64')
      : Buffer.from(webhookSecret, 'utf8');

    const expectedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const signatures = webhookSignature.split(' ').map(sig => {
      const parts = sig.split(',');
      return parts.length > 1 ? parts[1] : parts[0];
    });

    const isValid = signatures.some(sig => {
      try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
      } catch {
        return false;
      }
    });

    if (!isValid && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const db = initAdminDb();

    if (event.type === 'payment.succeeded') {
      const paymentObj = event.payload || {};
      const orderId = paymentObj.metadata?.orderId;

      if (!orderId) {
        return NextResponse.json({ received: true, note: 'No orderId in payment metadata' });
      }

      const orderRef = db.collection('orders').doc(orderId);

      // Atomic Settlement & Inventory Decrement (All Reads Before All Writes)
      const result = await db.runTransaction(async (transaction) => {
        // --- PHASE 1: READS ---
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists) {
          return { status: 404, body: { error: 'Order not found' } };
        }

        const orderData = orderSnap.data() || {};
        if (orderData.status === 'paid') {
          return { status: 200, body: { received: true, note: 'Order already settled' } };
        }

        const items = orderData.items || [];
        const productReads: Array<{
          ref: FirebaseFirestore.DocumentReference;
          snap: FirebaseFirestore.DocumentSnapshot;
          qty: number;
        }> = [];

        for (const item of items) {
          if (!item.productId) continue;
          const productRef = db.collection('products').doc(item.productId);
          const productSnap = await transaction.get(productRef);
          productReads.push({
            ref: productRef,
            snap: productSnap,
            qty: Number(item.quantity || 1),
          });
        }

        // --- PHASE 2: WRITES ---
        transaction.update(orderRef, {
          status: 'paid',
          yocoPaymentId: paymentObj.id || null,
          paidAt: FieldValue.serverTimestamp(),
        });

        for (const { ref, snap, qty } of productReads) {
          if (snap.exists) {
            const productData = snap.data() || {};
            const currentStock = Number(productData.stockQuantity || 0);
            const newStock = Math.max(0, currentStock - qty);

            transaction.update(ref, {
              stockQuantity: newStock,
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }

        const outboxRef = db.collection('notifications_outbox').doc();
        transaction.set(outboxRef, {
          type: 'ORDER_PAID',
          orderId,
          customerEmail: orderData.customer?.email || '',
          createdAt: FieldValue.serverTimestamp(),
          status: 'pending',
        });

        return { status: 200, body: { received: true, settled: true } };
      });

      if (result.status !== 200) {
        return NextResponse.json(result.body, { status: result.status });
      }

      console.log(`Successfully settled order ${orderId} and updated inventory.`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
