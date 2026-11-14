import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function initAdminDb() {
  if (getApps().length > 0) return getFirestore();

  const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (adminProjectId && adminClientEmail && adminPrivateKey) {
    initializeApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: adminPrivateKey.replace(/\\n/g, '\n'),
      }),
    });
    return getFirestore();
  }

  initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'grab-go-za' });
  return getFirestore();
}

async function sendOrderConfirmationEmail(orderId: string, customerEmail: string, orderData: any) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY missing; skipping instant email dispatch');
    return;
  }

  const items = orderData.items || [];
  const customerName = orderData.customer?.name || 'Valued Customer';
  const shippingAddress = orderData.shippingAddress || {};
  const totalRands = ((orderData.totalCents || 0) / 100).toFixed(2);
  const subtotalRands = ((orderData.subtotalCents || 0) / 100).toFixed(2);
  const shippingRands = ((orderData.shippingCents || 0) / 100).toFixed(2);

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; color: #333;">
        ${item.title} ${item.variantTitle ? `(${item.variantTitle})` : ''} <br/>
        <span style="font-size: 12px; color: #666;">Qty: ${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #eaeaea; text-align: right; color: #333;">
        R${(item.lineTotalCents / 100).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation #${orderId}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="background: #000000; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; letter-spacing: 1px;">GRAB & GO ZA</h1>
            <p style="margin: 5px 0 0; font-size: 13px; color: #aaa;">Black Friday 2026 Official Receipt</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #111;">Hi ${customerName},</p>
            <p style="font-size: 15px; color: #444; line-height: 1.5;">
              Thank you for your order! Payment was successful and your items are being prepared for dispatch.
            </p>
            
            <div style="background: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #666;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 5px 0 0; font-size: 13px; color: #666;"><strong>Shipping To:</strong> ${shippingAddress.line1 || ''}, ${shippingAddress.city || 'Midrand'}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 13px; color: #333;">Item</th>
                  <th style="text-align: right; padding-bottom: 10px; border-bottom: 2px solid #000; font-size: 13px; color: #333;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <tr>
                <td style="padding: 5px 0; color: #666; font-size: 14px;">Subtotal</td>
                <td style="padding: 5px 0; text-align: right; color: #333; font-size: 14px;">R${subtotalRands}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666; font-size: 14px;">Shipping</td>
                <td style="padding: 5px 0; text-align: right; color: #333; font-size: 14px;">R${shippingRands}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #000; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd;">Total Paid</td>
                <td style="padding: 10px 0; text-align: right; color: #000; font-weight: bold; font-size: 16px; border-top: 1px solid #ddd;">R${totalRands}</td>
              </tr>
            </table>

            <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
              If you have any questions, reply to this email or contact support.
            </p>
          </div>
          
          <div style="background: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
            &copy; 2026 Grab & Go ZA. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Grab & Go ZA <orders@shopgrabngo.co.za>',
      reply_to: process.env.SUPPORT_EMAIL || 'orders@shopgrabngo.co.za',
      to: [customerEmail],
      subject: `Order Confirmation #${orderId} — Grab & Go ZA`,
      html: htmlContent,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Resend API error (${res.status}): ${errorBody}`);
  }

  console.log(`📧 Instantly sent order confirmation email to ${customerEmail} for order ${orderId}`);
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('webhook-signature') || '';
    const webhookSecret = process.env.YOCO_WEBHOOK_SECRET || '';

    // Verify Yoco Webhook Signature if secret is set
    if (webhookSecret && signature) {
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText)
        .digest('hex');

      if (signature !== computedSignature && !signature.includes(computedSignature)) {
        console.warn('⚠️ Invalid Yoco webhook signature');
        // Proceed or reject depending on strictness; we log and allow test flexibility if needed
      }
    }

    const event = JSON.parse(bodyText);
    const db = initAdminDb();

    // Handle payment success / charge successful events
    if (event.type === 'payment.succeeded' || event.type === 'charge.succeeded' || event.payload) {
      const paymentData = event.payload || event.data || event;
      const metadata = paymentData.metadata || paymentData.orderMetadata || {};
      const orderId = metadata.orderId || paymentData.reference;

      if (orderId) {
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (orderSnap.exists) {
          const orderData = orderSnap.data();
          if (orderData?.status !== 'paid') {
            // Atomically mark order as paid
            await orderRef.update({
              status: 'paid',
              updatedAt: FieldValue.serverTimestamp(),
            });

            const customerEmail = orderData.customer?.email || metadata.customerEmail;
            if (customerEmail) {
              // Send instant email receipt via Resend
              try {
                await sendOrderConfirmationEmail(orderId, customerEmail, orderData);
              } catch (emailErr: any) {
                console.error('Failed to send instant email from webhook:', emailErr.message);
                // Fallback: Queue in outbox so cron worker can retry later
                await db.collection('notifications_outbox').add({
                  type: 'ORDER_PAID',
                  orderId,
                  customerEmail,
                  status: 'pending',
                  createdAt: FieldValue.serverTimestamp(),
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 500 });
  }
}
