/**
 * api/payments.ts — Grab & Go Payments API (Vercel Serverless)
 *
 * Actions:
 *   POST ?action=yoco         — Create Yoco checkout session, return redirectUrl
 *   POST ?action=order-success — Called after payment confirmed:
 *                                 1. Verify payment with Yoco
 *                                 2. Update order status in Firestore
 *                                 3. Trigger shipment creation + stock deduction
 *                                 4. Send confirmation email
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

// ─── Config ─────────────────────────────────────────────────────────────────
const YOCO_SECRET_KEY   = process.env.YOCO_SECRET_KEY   || '';
const YOCO_API_BASE     = 'https://payments.yoco.com/api';
const BASE_URL          = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.BASE_URL || 'https://grabngoza-2026.vercel.app');

function err(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({ error: message, details: details || '' });
}

// ─── Main handler ────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;
  if (!action) return err(res, 400, 'Missing action parameter');

  try {
    switch (action) {

      // ── Create Yoco checkout session ─────────────────────────────────
      case 'yoco': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

        const { amount, currency = 'ZAR', metadata = {} } = req.body || {};
        if (!amount || amount <= 0) return err(res, 400, 'Invalid amount');

        if (!YOCO_SECRET_KEY) {
          console.error('[payments/yoco] YOCO_SECRET_KEY not set');
          return err(res, 503, 'Payment service not configured');
        }

        const amountCents = Math.round(amount * 100); // Yoco uses cents

        const checkoutPayload = {
          amount:   amountCents,
          currency: currency.toUpperCase(),
          successUrl:  `${BASE_URL}/order-success?id=${metadata.orderId || ''}`,
          cancelUrl:   `${BASE_URL}/?status=cancelled`,
          failureUrl:  `${BASE_URL}/?status=cancelled`,
          metadata: {
            orderId:     metadata.orderId || '',
            checkoutId:  `GG-${Date.now()}`,
          },
        };

        const yocoRes = await fetch(`${YOCO_API_BASE}/checkouts`, {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
            'Content-Type':  'application/json',
            // FIX: Stable idempotency key — ties to orderId, not timestamp
            'Idempotency-Key': metadata.orderId || `GG-${Date.now()}`,
          },
          body: JSON.stringify(checkoutPayload),
        });

        const yocoData = await yocoRes.json();

        if (!yocoRes.ok) {
          console.error('[payments/yoco] Yoco error:', yocoRes.status, yocoData);
          return err(res, yocoRes.status, yocoData.message || 'Payment initialization failed', JSON.stringify(yocoData));
        }

        // Save checkout ID to Firestore order for verification later
        if (metadata.orderId && yocoData.id) {
          await db.collection('orders').doc(metadata.orderId).update({
            yocoCheckoutId: yocoData.id,
            paymentStatus:  'pending',
          }).catch(e => console.error('[payments/yoco] Firestore update failed:', e));
        }

        return res.status(200).json({
          redirectUrl: yocoData.redirectUrl,
          checkoutId:  yocoData.id,
        });
      }

      // ── Order success — post-payment processing ──────────────────────
      case 'order-success': {
        if (req.method !== 'POST') return err(res, 405, 'Method not allowed');

        const { order } = req.body || {};
        if (!order?.id) return err(res, 400, 'Missing order.id');

        const orderId = order.id;
        const results: Record<string, any> = {};

        // ─── SECURITY: Verify payment with Yoco before processing ─────
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) return err(res, 404, 'Order not found');

        const orderData = orderDoc.data()!;
        const checkoutId = orderData.yocoCheckoutId;

        if (!checkoutId) {
          console.error(`[payments/order-success] No yocoCheckoutId for order ${orderId}`);
          return err(res, 400, 'No checkout ID linked to this order');
        }

        // Call Yoco API to verify checkout status
        const verifyRes = await fetch(`${YOCO_API_BASE}/checkouts/${checkoutId}`, {
          headers: { 'Authorization': `Bearer ${YOCO_SECRET_KEY}` },
        });
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || verifyData.status !== 'completed') {
          console.error(`[payments/order-success] Payment NOT verified for ${orderId}:`, verifyData);
          return err(res, 402, 'Payment not verified', `Checkout status: ${verifyData.status || 'unknown'}`);
        }

        // ─── IDEMPOTENCY: Skip if already processed ──────────────────
        if (orderData.paymentStatus === 'paid') {
          console.log(`[payments/order-success] Order ${orderId} already processed — skipping`);
          return res.status(200).json({ ok: true, orderId, alreadyProcessed: true });
        }

        // ── 1. Update order status in Firestore ──────────────────────
        try {
          await db.collection('orders').doc(orderId).update({
            status:        'pending',
            paymentStatus: 'paid',
            paidAt:        new Date().toISOString(),
            yocoPaymentId: verifyData.paymentId || verifyData.id || '',
          });
          results.orderUpdated = true;
        } catch (e: any) {
          console.error('[payments/order-success] Firestore update failed:', e);
          results.orderUpdated = false;
          results.orderError   = e.message;
        }

        // ── 2. Create ShipLogic shipment + deduct stock ──────────────
        try {
          const shipRes = await fetch(`${BASE_URL}/api/create-shipment`, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
            },
            body: JSON.stringify({ orderId, order }),
          });
          const shipData = await shipRes.json();
          results.shipment = shipData;
        } catch (e: any) {
          console.error('[payments/order-success] create-shipment failed:', e);
          results.shipmentError = e.message;
        }

        // ── 3. Send confirmation email via Resend ────────────────────
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          try {
            const emailRes = await fetch('https://api.resend.com/emails', {
              method:  'POST',
              headers: {
                'Authorization': `Bearer ${resendKey}`,
                'Content-Type':  'application/json',
              },
              body: JSON.stringify({
                from:    'Grab & Go <orders@grabandgo.co.za>',
                to:      [order.email],
                subject: `Order Confirmed — #${orderId.slice(-8).toUpperCase()}`,
                html:    buildOrderConfirmationEmail(order, orderId),
              }),
            });
            results.emailSent = emailRes.ok;
          } catch (e: any) {
            console.error('[payments/order-success] email failed:', e);
            results.emailError = e.message;
          }
        }

        console.log(`[payments/order-success] ✅ Order ${orderId} processed`, results);
        return res.status(200).json({ ok: true, orderId, results });
      }

      default:
        return err(res, 400, `Unknown action: ${action}`);
    }

  } catch (error: any) {
    console.error('[payments] Unhandled error:', error);
    return err(res, 500, 'Internal server error', error.message);
  }
}

// ─── Order confirmation email template ──────────────────────────────────────
function buildOrderConfirmationEmail(order: any, orderId: string): string {
  const itemsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <strong>${item.name}</strong>
        ${item.selectedVariants ? `<br><small style="color:#888">${Object.entries(item.selectedVariants).map(([k,v]) => `${k}: ${v}`).join(', ')}</small>` : ''}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">R${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `).join('');

  const refId = orderId.slice(-8).toUpperCase();

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e8e8e8;">
    
    <!-- Header -->
    <div style="background:#000;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:4px;text-transform:uppercase;">GRAB &amp; GO</h1>
      <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Order Confirmed</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <p style="color:#333;font-size:14px;">Hi ${order.firstName},</p>
      <p style="color:#333;font-size:14px;">Your order has been placed and is being prepared. Here's your summary:</p>

      <div style="background:#f9f9f9;padding:16px 20px;margin:24px 0;border-left:3px solid #000;">
        <p style="margin:0;font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;">Order Reference</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;color:#000;letter-spacing:2px;">#${refId}</p>
      </div>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333;">
        <thead>
          <tr style="border-bottom:2px solid #000;">
            <th style="padding:8px 0;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Item</th>
            <th style="padding:8px 0;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 0;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 0 4px;font-size:12px;color:#888;">Shipping</td>
            <td style="padding:12px 0 4px;text-align:right;font-size:12px;color:#888;">R${(order.shippingCost || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:8px 0;font-size:16px;font-weight:bold;color:#000;border-top:2px solid #000;">Total</td>
            <td style="padding:8px 0;text-align:right;font-size:16px;font-weight:bold;color:#000;border-top:2px solid #000;">R${(order.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Delivery -->
      <div style="margin:32px 0;padding:20px;border:1px solid #e8e8e8;">
        <p style="margin:0 0 8px;font-size:10px;color:#888;letter-spacing:2px;text-transform:uppercase;">Delivering to</p>
        ${order.deliveryMethod === 'bobgo' && order.bobGoPickupPoint
          ? `<p style="margin:0;font-size:13px;color:#333;"><strong>${order.bobGoPickupPoint.name}</strong><br>${order.bobGoPickupPoint.address}, ${order.bobGoPickupPoint.suburb}, ${order.bobGoPickupPoint.city}</p>`
          : order.deliveryMethod === 'pickup'
          ? `<p style="margin:0;font-size:13px;color:#333;"><strong>Studio Pickup</strong><br>10 Studio Lane, Sandton, Johannesburg</p>`
          : `<p style="margin:0;font-size:13px;color:#333;">${order.address}, ${order.city}, ${order.province} ${order.postalCode}, ${order.country || 'ZA'}</p>`
        }
      </div>

      <p style="color:#666;font-size:12px;line-height:1.6;">You'll receive a tracking number once your order has been dispatched. Estimated delivery: <strong>3–5 business days</strong> for standard shipping.</p>

      <p style="color:#666;font-size:12px;">Questions? Reply to this email or WhatsApp us at <strong>${process.env.STUDIO_WHATSAPP || '+27000000000'}</strong>.</p>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
      <p style="margin:0;font-size:10px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 Grab &amp; Go · South Africa</p>
    </div>
  </div>
</body>
</html>`;
}
