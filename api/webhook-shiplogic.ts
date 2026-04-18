import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

// ---- Firebase Admin ----
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}
const db = getFirestore();

// ---- Status map: ShipLogic → Firebase ----
const STATUS_MAP: Record<string, { label: string; emoji: string; fbStatus: string }> = {
  'submitted':           { label: 'Order Placed',       emoji: '📋', fbStatus: 'confirmed' },
  'collection-assigned': { label: 'Pickup Scheduled',   emoji: '📅', fbStatus: 'pickup-scheduled' },
  'collected':           { label: 'Collected by Courier', emoji: '📦', fbStatus: 'collected' },
  'at-hub':              { label: 'At Sorting Hub',     emoji: '🏭', fbStatus: 'in-transit' },
  'in-transit':          { label: 'In Transit',         emoji: '🚚', fbStatus: 'in-transit' },
  'out-for-delivery':    { label: 'Out for Delivery',   emoji: '🛵', fbStatus: 'out-for-delivery' },
  'delivered':           { label: 'Delivered',          emoji: '✅', fbStatus: 'delivered' },
  'failed-delivery':     { label: 'Delivery Failed',    emoji: '❌', fbStatus: 'failed-delivery' },
  'returned':            { label: 'Returned',           emoji: '↩️', fbStatus: 'returned' },
};
function mapStatus(s: string) {
  return STATUS_MAP[s] || { label: s.replace(/-/g, ' '), emoji: '📍', fbStatus: s };
}

// ---- Handler ----
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const payload = req.body;
    console.log('[ShipLogic Webhook]', JSON.stringify(payload).slice(0, 400));

    // Tracking event webhook
    if (payload.custom_tracking_reference && payload.status && payload.tracking_events) {
      return await handleTracking(payload, res);
    }
    // Admin webhook (full shipment)
    if (payload.custom_tracking_reference && payload.parcels) {
      return await handleAdmin(payload, res);
    }
    // Shipment note
    if (payload.shipment_id && payload.message) {
      console.log(`[Note] shipment=${payload.shipment_id}: ${payload.message}`);
      return res.json({ received: true, type: 'note' });
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook Error]', err);
    return res.status(200).json({ error: 'Failed', message: err.message });
  }
}

async function handleTracking(event: any, res: any) {
  const ref = event.custom_tracking_reference;
  const { label, emoji, fbStatus } = mapStatus(event.status);
  console.log(`[Tracking] ${ref} → ${emoji} ${label}`);

  // Find order
  const snap = await db.collection('orders')
    .where('trackingReference', '==', ref).limit(1).get();

  if (snap.empty) {
    console.warn(`[Tracking] No order for: ${ref}`);
    return res.json({ received: true, matched: false });
  }

  const doc = snap.docs[0];
  const order = doc.data();
  const latest = event.tracking_events?.[0];

  // Update Firebase
  await doc.ref.update({
    status: fbStatus,
    lastTrackingUpdate: new Date().toISOString(),
    trackingHistory: FieldValue.arrayUnion({
      slStatus: event.status,
      message: latest?.message || label,
      location: latest?.location || '',
      timestamp: event.event_time || new Date().toISOString(),
    }),
  });

  // Notifications (fire-and-forget)
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.APP_URL || 'https://grabngoza-2026.vercel.app';

  const estDate = event.shipment_estimated_delivery_from
    ? new Date(event.shipment_estimated_delivery_from).toLocaleDateString('en-ZA', {
        weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  // Email
  if (order.email) {
    fire(`${base}/api/notifications?action=email`, {
      to: order.email,
      subject: `${emoji} ${label} — Order #${doc.id.toUpperCase()}`,
      html: statusEmailHtml({
        name: order.firstName, orderId: doc.id, ref, label, emoji, estDate,
        location: latest?.location, msg: latest?.message, base,
      }),
    });
  }
  // WhatsApp
  if (order.phone) {
    fire(`${base}/api/notifications?action=whatsapp`, {
      phone: order.phone,
      message: [
        `${emoji} *${label}*`,
        '',
        `Hi ${order.firstName}! Your Grab & Go order #${doc.id.toUpperCase()} is now *${label.toLowerCase()}*.`,
        latest?.location ? `📍 Location: ${latest.location}` : '',
        estDate ? `📅 Est. delivery: ${estDate}` : '',
        '',
        `Track: ${base}/track?ref=${ref}`,
      ].filter(Boolean).join('\n'),
    });
  }

  return res.json({ received: true, matched: true, orderId: doc.id, status: fbStatus });
}

async function handleAdmin(payload: any, res: any) {
  const ref = payload.custom_tracking_reference;
  const { fbStatus } = mapStatus(payload.status);

  const snap = await db.collection('orders')
    .where('trackingReference', '==', ref).limit(1).get();

  if (!snap.empty) {
    await snap.docs[0].ref.update({
      status: fbStatus,
      lastTrackingUpdate: new Date().toISOString(),
      shiplogicShipmentId: payload.id,
      trackingHistory: FieldValue.arrayUnion({
        slStatus: payload.status,
        message: `Admin: ${payload.status}`,
        timestamp: payload.time_modified || new Date().toISOString(),
      }),
    });
  }
  return res.json({ received: true, type: 'admin' });
}

function fire(url: string, body: any) {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(e => console.error('[Notify Error]', e.message));
}

function statusEmailHtml(d: any) {
  const logo = 'https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111;max-width:600px;width:100%;border:1px solid #222;">
<tr><td style="padding:30px 40px;text-align:center;border-bottom:1px solid #222;">
<img src="${logo}" alt="Grab & Go" style="height:40px;filter:brightness(0) invert(1);" />
</td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:8px;">${d.emoji}</div>
<h2 style="color:#fff;margin:0 0 6px;font-size:20px;text-transform:uppercase;letter-spacing:2px;">${d.label}</h2>
<p style="color:#444;font-size:10px;letter-spacing:3px;text-transform:uppercase;">Order #${d.orderId.toUpperCase()}</p>
</td></tr>
<tr><td style="padding:0 40px 40px;">
<p style="color:#ccc;font-size:14px;">Hi ${d.name},</p>
<p style="color:#999;font-size:13px;line-height:1.7;">Your order is now <strong style="color:#fff;">${d.label.toLowerCase()}</strong>.</p>
${d.location ? `<p style="color:#999;font-size:13px;">📍 Location: <strong style="color:#fff;">${d.location}</strong></p>` : ''}
${d.msg ? `<p style="color:#999;font-size:13px;">💬 ${d.msg}</p>` : ''}
${d.estDate ? `<p style="color:#999;font-size:13px;">📅 Est. delivery: <strong style="color:#fff;">${d.estDate}</strong></p>` : ''}
<div style="text-align:center;margin-top:24px;">
<a href="${d.base}/track?ref=${d.ref}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 40px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Track Order</a>
</div>
</td></tr>
<tr><td style="padding:20px 40px;text-align:center;border-top:1px solid #222;">
<p style="color:#333;font-size:9px;letter-spacing:3px;text-transform:uppercase;">Tracking: ${d.ref}</p>
<p style="color:#333;font-size:9px;">© 2026 Grab & Go Studio • South Africa</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}