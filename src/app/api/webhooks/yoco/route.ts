import { NextResponse } from "next/server";
import crypto from "crypto";
import * as admin from 'firebase-admin';
import { fulfillOrderInventory } from "@/lib/os/order-fulfillment";
import { sendOrderConfirmationEmail } from "@/lib/os/email-service";

function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("webhook-signature") || "";
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("YOCO_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // 1. Verify Yoco signature format: t=timestamp,v1=signature
    const elements = signatureHeader.split(",");
    const timestampElem = elements.find(el => el.startsWith("t="));
    const signatureElem = elements.find(el => el.startsWith("v1="));

    if (!timestampElem || !signatureElem) {
      return NextResponse.json({ error: "Invalid signature headers" }, { status: 400 });
    }

    const timestamp = timestampElem.split("=")[1];
    const receivedSignature = signatureElem.split("=")[1];

    // Prevent replay attacks (tolerance: 5 minutes)
    const toleranceSeconds = 300;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > toleranceSeconds) {
      return NextResponse.json({ error: "Webhook timestamp out of tolerance" }, { status: 400 });
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // 2. Make Payment Webhook Idempotent
    const db = getDb();
    const eventId = event.id || `${event.type}_${event.payload?.id || Date.now()}`;
    const idempotencyRef = db.collection("webhook_events").doc(eventId);

    let alreadyProcessed = false;
    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(idempotencyRef);
      if (eventDoc.exists) {
        alreadyProcessed = true;
        return;
      }
      transaction.set(idempotencyRef, {
        type: event.type,
        createdAt: new Date().toISOString(),
        status: "processing",
      });
    });

    if (alreadyProcessed) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // 3. Handle Successful Payment & Trigger Fulfillment + Email
    if (event.type === "payment.succeeded" || event.type === "charge.succeeded") {
      const paymentData = event.payload || event.data;
      const orderId = paymentData?.metadata?.orderId || paymentData?.reference;

      if (orderId) {
        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          const items = orderData?.items || [];

          // Atomically deduct inventory & update order status
          await fulfillOrderInventory(orderId, items);

          // Mark order as paid
          await orderRef.update({
            paymentStatus: "paid",
            paymentDetails: paymentData,
            updatedAt: new Date().toISOString(),
          });

          // Trigger duplicate-safe confirmation email
          await sendOrderConfirmationEmail(orderId);
        }
      }
    }

    // Finalize idempotency status
    await idempotencyRef.update({ status: "completed" });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Yoco Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
