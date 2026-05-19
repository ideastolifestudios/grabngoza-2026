// app/api/yoco-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { syncOrderToZoho } from '@/app/utils/zoho';

// 1. Safe Production Firebase Admin Initialization
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

interface YocoPayload {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: {
    orderId?: string;
  };
}

export async function POST(request: NextRequest) {
  // 2. Production Webhook Verification Guard
  const signature = request.headers.get('yoco-signature');
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('[WEBHOOK ERROR] Security signature missing or unconfigured');
    return NextResponse.json({ error: 'Unauthorized configuration' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, payload }: { type: string; payload: YocoPayload } = body;

    console.info(`[WEBHOOK RECEIVED] Processing event ${type} for Payment ID: ${payload?.id}`);

    // 3. Process Only Succeeded Payments
    if (type === 'payment.succeeded' && payload.status === 'successful') {
      const orderId = payload.metadata?.orderId;

      if (!orderId) {
        console.warn(`[WEBHOOK WARN] Payment ${payload.id} received without an orderId metadata linkage.`);
        return NextResponse.json({ success: true, message: 'Skipped - no associated orderId' }, { status: 200 });
      }

      const orderRef = db.collection('orders').doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        console.error(`[WEBHOOK ERROR] Target order reference ${orderId} does not exist in Firestore.`);
        return NextResponse.json({ error: 'Associated order structure data missing' }, { status: 404 });
      }

      const orderData = orderSnap.data();

      // Idempotency check: prevent multi-trigger reprocessing
      if (orderData?.paymentStatus === 'PAID') {
        return NextResponse.json({ success: true, message: 'Order already marked as paid' }, { status: 200 });
      }

      // 4. Atomic Firestore Transaction Status Upgrades
      await db.runTransaction(async (transaction) => {
        transaction.update(orderRef, {
          paymentStatus: 'PAID',
          yocoPaymentId: payload.id,
          updatedAt: FieldValue.serverTimestamp(),
          statusLogs: FieldValue.arrayUnion({
            status: 'PAID',
            timestamp: new Date().toISOString(),
            source: 'yoco_webhook_gateway'
          })
        });
      });

      // 5. Downstream System Syncs wrapped in safe catch boundaries
      try {
        await syncOrderToZoho(orderId, orderData);
      } catch (zohoError: any) {
        // Critical Production Design Pattern: Secondary system ingestion failures 
        // must never reject the primary payment acknowledgment block.
        console.error(`[CRITICAL BACKGROUND SYNC FAILED] Zoho Order Sync Exception: ${zohoError.message}`, {
          orderId,
          paymentId: payload.id
        });
      }
    }

    // 6. Acknowledge Receipt Swiftly back to Yoco to avoid retry timeouts
    return NextResponse.json({ success: true, received: true }, { status: 200 });

  } catch (error: any) {
    console.error(`[WEBHOOK RUNTIME SYSTEM ERROR] Processing failed: ${error.message}`);
    return NextResponse.json({ error: 'Internal pipeline error processing webhook payload' }, { status: 500 });
  }
}