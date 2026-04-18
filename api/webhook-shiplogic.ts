import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

// ---- Firebase Admin init ----
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
const db = getFirestore();

// ---- Status mapping: ShipLogic → friendly ----
const STATUS_MAP: Record<string, { label: string; emoji: string; fbStatus: string }> = {
  'submitted':           { label: 'Order Placed',       emoji: '📋', fbStatus: 'confirmed' },
  'collection-assigned': { label: 'Pickup Scheduled',   emoji: '📅', fbStatus: 'pickup-scheduled' },
  'collected':           { label: 'Collected',          emoji: '📦', fbStatus: 'collected' },
  'at-hub':              { label: 'At Sorting Hub',     emoji: '🏭', fbStatus: 'in-transit' },
  'in-transit':          { label: 'In Transit',         emoji: '🚚', fbStatus: 'in-transit' },
  'out-for-delivery':    { label: 'Out for Delivery',   emoji: '🛵', fbStatus: 'out-for-delivery' },
  'delivered':           { label: 'Delivered',          emoji: '✅', fbStatus: 'delivered' },
  'failed-delivery':     { label: 'Delivery Failed',    emoji: '❌', fbStatus: 'failed-delivery' },
  'returned':            { label: 'Returned',           emoji: '↩️', fbStatus: 'returned' },
};

function mapStatus(slStatus: string) {
  return STATUS_MAP[slStatus] || {
    label: slStatus.replace(/-/g, ' '),
    emoji: '📍',
    fbStatus: slStatus,
  };
}

// ---- Main handler ----
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const payload = req.body;
    console.log('[ShipLogic Webhook] received:', JSON.stringify(payload).slice(0, 500));

    // ---- TRACKING EVENT webhook ----
    if (payload.custom_tracking_reference && payload.status && payload.tracking_events) {
      return await handleTrackingEvent(payload, res);
    }

    // ---- ADMIN webhook (full shipment object) ----
    if (payload.custom_tracking_reference && payload.parcels) {
      return await handleAdminWebhook(payload, res);
    }

    // ---- SHIPMENT NOTE webhook ----
    if (payload.shipment_id && payload.message && payload.type) {
      console.log(`[ShipLogic Note] shipment=${payload.shipment_id}: ${payload.message}`);
      return res.json({ received: true, type: 'note' });
    }

    console.warn('[ShipLogic] Unknown webhook shape:', Object.keys(payload));
    return res.json({ received: true });
  } catch (err: any) {
    console.error('[ShipLogic Webhook Error]', err);
    // Return 200 so ShipLogic doesn't retry endlessly
    return res.status(200).json({ error: 'Processing failed', message: err.message });
  }
}

// ---- Handle tracking event ----
async function handleTrackingEvent(event: any, res: any) {
  const trackingRef = event.custom_tracking_reference;
  const { label, emoji, fbStatus } = mapStatus(event.status);

  console.log(`[Tracking] ${trackingRef} → ${emoji} ${label}`);

  // 1. Find order in Firebase by trackingReference
  const snapshot = await db
    .collection('orders')
    .where('trackingReference', '==', trackingRef)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(`[Tracking] No order for ref: ${trackingRef}`);
    return res.json({ received: true, matched: false });
  }

  const orderDoc = snapshot.docs[0];
  const order = orderDoc.data();
  const orderId = orderDoc.id;

  // 2. Update order status + append tracking history
  const latestEvent = event.tracking_events?.[0];
  await orderDoc.ref.update({
    status: fbStatus,
    lastTrackingUpdate: new Date().toISOString(),
    trackingHistory: FieldValue.arrayUnion({
      slStatus: event.status,
      message: latestEvent?.message || label,
      location: latestEvent?.location || '',
      timestamp: event.event_time || new Date().toISOString(),
    }),
  });

  console.log(`[Tracking] Updated order ${orderId} → ${fbStatus}`);

  // 3. Send notifications (fire-and-forget)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://grabngoza-2026.vercel.app';

  const customerName = `${order.firstName} ${order.lastName}`;
  const estimatedDelivery = event.shipment_estimated_delivery_from
    ? new Date(event.shipment_estimated_delivery_from).toLocaleDateString('en-ZA', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : null;

  // Email notification
  if (order.email) {
    sendNotification(`${baseUrl}/api/send-email`, {
      to: order.email,
      subject: `${emoji} ${label} — Order #${orderId}`,
      html: buildEmailHtml({
        customerName,
        orderId,
        trackingRef,
        statusLabel: label,
        emoji,
        estimatedDelivery,
        location: latestEvent?.location,
        message: latestEvent?.message,
      }),
    });
  }

  // WhatsApp notification
  if (order.phone) {
    sendNotification(`${baseUrl}/api/send-whatsapp`, {
      phone: order.phone,
      message: [
        `${emoji} *${label}*`,
        ``,
        `Hi ${order.firstName}! Your Grab & Go order #${orderId} is now *${label.toLowerCase()}*.`,
        latestEvent?.location ? `📍 Location: ${latestEvent.location}` : '',
        estimatedDelivery ? `📅 Estimated delivery: ${estimatedDelivery}` : '',
        ``,
        `Track: ${baseUrl}/track?ref=${trackingRef}`,
      ].filter(Boolean).join('\n'),
    });
  }

  return res.json({ received: true, matched: true, orderId, newStatus: fbStatus });
}

// ---- Handle admin webhook (full shipment) ----
async function handleAdminWebhook(payload: any, res: any) {
  const trackingRef = payload.custom_tracking_reference;
  const status = payload.status;
  console.log(`[Admin Webhook] ${trackingRef} status=${status}`);

  const { fbStatus } = mapStatus(status);

  const snapshot = await db
    .collection('orders')
    .where('trackingReference', '==', trackingRef)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      status: fbStatus,
      lastTrackingUpdate: new Date().toISOString(),
      shiplogicShipmentId: payload.id,
      trackingHistory: FieldValue.arrayUnion({
        slStatus: status,
        message: `Admin update: ${status}`,
        timestamp: payload.time_modified || new Date().toISOString(),
      }),
    });
  }

  return res.json({ received: true, type: 'admin' });
}

// ---- Helper: fire-and-forget notification ----
function sendNotification(url: string, body: any) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((err) => console.error('[Notification Error]', url, err.message));
}

// ---- Helper: email HTML template ----
function buildEmailHtml(data: {
  customerName: string;
  orderId: string;
  trackingRef: string;
  statusLabel: string;
  emoji: string;
  estimatedDelivery: string | null;
  location?: string;
  message?: string;
}) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 28px; margin: 0;">Grab & Go</h1>
        <p style="color: #666; font-size: 14px;">Shipping Update</p>
      </div>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">${data.emoji}</div>
        <h2 style="margin: 0 0 8px 0; font-size: 22px;">${data.statusLabel}</h2>
        <p style="color: #666; margin: 0;">Order #${data.orderId}</p>
      </div>

      <div style="padding: 24px 0;">
        <p>Hi ${data.customerName},</p>
        <p>Your order is now <strong>${data.statusLabel.toLowerCase()}</strong>.</p>
        ${data.location ? `<p>📍 Location: <strong>${data.location}</strong></p>` : ''}
        ${data.message ? `<p>💬 ${data.message}</p>` : ''}
        ${data.estimatedDelivery ? `<p>📅 Estimated delivery: <strong>${data.estimatedDelivery}</strong></p>` : ''}
      </div>

      <div style="text-align: center; padding: 16px 0;">
        <a href="https://grabngoza-2026.vercel.app/track?ref=${data.trackingRef}"
           style="background: #000; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Track Your Order
        </a>
      </div>

      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
        <p>Tracking ref: ${data.trackingRef}</p>
        <p>Grab & Go • Premium Streetwear</p>
      </div>
    </div>
  `;
}