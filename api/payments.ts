// api/payments.ts
// Handles: POST ?action=yoco | ?action=order-success
import nodemailer from 'nodemailer';

const CORS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token,X-Requested-With,Accept,Content-Type,Date',
};
function setcors(res: any) { Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v)); }

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendWhatsApp(phone: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return;
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '27' + clean.substring(1);
  try {
    await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: clean, type: 'text', text: { body: message } }),
    });
  } catch (e: any) { console.error('WhatsApp:', e.message); }
}

const LOGO = 'https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png';

function customerEmailHtml(order: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#111;color:#fff;padding:40px;border:1px solid #222;">
  <img src="${LOGO}" alt="Grab & Go" style="height:40px;filter:brightness(0) invert(1);margin-bottom:24px;" />
  <h1 style="font-size:22px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Order Confirmed!</h1>
  <p style="color:#aaa;font-size:13px;">Hi <strong style="color:#fff;">${order.firstName}</strong>, your order has been received.</p>
  <div style="background:#1a1a1a;padding:20px;margin:20px 0;border:1px solid #333;">
    <p style="margin:0 0 8px;font-size:10px;color:#555;text-transform:uppercase;letter-spacing:3px;">Order Summary</p>
    <p style="margin:4px 0;font-size:13px;"><strong>Order #:</strong> ${order.id?.toUpperCase()}</p>
    <p style="margin:4px 0;font-size:13px;"><strong>Total:</strong> R${order.total}</p>
    <p style="margin:4px 0;font-size:13px;"><strong>Delivery:</strong> ${order.deliveryMethod === 'pickup' ? 'Studio Pickup — Midrand' : order.deliveryMethod === 'bobgo' ? `Bob Go Pickup — ${order.bobGoPickupPoint?.name || 'PUDO Point'}` : order.deliveryMethod === 'international' ? `International — ${order.country}` : 'Standard Delivery'}</p>
  </div>
  ${(order.items || []).map((item: any) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #222;font-size:13px;">
      <span style="color:#ccc;">${item.quantity}× ${item.name}</span>
      <span style="color:#fff;">R${item.price * item.quantity}</span>
    </div>`).join('')}
  <p style="color:#555;font-size:11px;margin-top:30px;text-transform:uppercase;letter-spacing:2px;">We'll send tracking details when your order ships!</p>
  <p style="color:#333;font-size:10px;">© 2026 Grab & Go Studio • South Africa</p>
</div></body></html>`;
}

function businessEmailHtml(order: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px;">
  <h1 style="font-size:20px;border-bottom:2px solid #000;padding-bottom:10px;">🛍️ New Order: #${order.id?.toUpperCase()}</h1>
  <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
  <p><strong>Email:</strong> ${order.email}</p>
  <p><strong>Phone:</strong> ${order.phone}</p>
  <p><strong>Total:</strong> R${order.total}</p>
  <p><strong>Delivery:</strong> ${order.deliveryMethod}</p>
  ${order.deliveryMethod === 'standard' || order.deliveryMethod === 'international' ? `
  <p><strong>Address:</strong> ${order.address}, ${order.city}, ${order.province}, ${order.postalCode}</p>` : ''}
  ${order.bobGoPickupPoint ? `<p><strong>Bob Go Point:</strong> ${order.bobGoPickupPoint.name} — ${order.bobGoPickupPoint.address}</p>` : ''}
  <hr/>
  <h3>Items:</h3>
  ${(order.items || []).map((item: any) => `<p>• ${item.quantity}× ${item.name} — R${item.price * item.quantity}</p>`).join('')}
</div></body></html>`;
}

export default async function handler(req: any, res: any) {
  setcors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action as string;

  // ── Yoco payment ────────────────────────────────────────────────────────────
  if (action === 'yoco' || req.url?.includes('create-yoco-payment')) {
    const { amount, currency, metadata } = req.body || {};
    if (!amount || !currency) return res.status(400).json({ error: 'amount and currency required' });
    if (!process.env.YOCO_SECRET_KEY) return res.status(500).json({ error: 'Payment gateway not configured' });
    if (!process.env.APP_URL) return res.status(500).json({ error: 'APP_URL not configured' });

    try {
      const response = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(Number(amount) * 100),
          currency: currency.toUpperCase(),
          cancelUrl: `${process.env.APP_URL}/?status=cancelled`,
          successUrl: `${process.env.APP_URL}/order-success?id=${metadata?.orderId || 'unknown'}`,
          metadata: { ...metadata, timestamp: new Date().toISOString() },
        }),
      });
      const text = await response.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!response.ok) return res.status(response.status).json({ error: 'Payment checkout failed', details: data.message || data.error });
      return res.status(200).json({ success: true, redirectUrl: data.redirectUrl, checkoutId: data.id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Order success — send confirmation emails + WhatsApp ─────────────────────
  if (action === 'order-success') {
    const { order } = req.body || {};
    if (!order) return res.status(400).json({ error: 'order required' });

    try {
      const transporter = makeTransport();

      await Promise.all([
        transporter.sendMail({
          from: `"Grab & Go" <${process.env.SMTP_USER}>`,
          to: order.email,
          subject: `Order Confirmed: #${order.id?.toUpperCase()}`,
          html: customerEmailHtml(order),
        }),
        transporter.sendMail({
          from: `"Grab & Go Orders" <${process.env.SMTP_USER}>`,
          to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
          subject: `NEW ORDER: #${order.id?.toUpperCase()} — ${order.firstName} ${order.lastName} — R${order.total}`,
          html: businessEmailHtml(order),
        }),
      ]);

      // WhatsApp — non-blocking
      if (order.phone) {
        sendWhatsApp(order.phone, `Hi ${order.firstName}! Your Grab & Go order #${order.id?.toUpperCase()} is confirmed ✅ Total: R${order.total}. We'll notify you when it ships!`).catch(() => {});
      }
      sendWhatsApp(
        process.env.BUSINESS_PHONE || '0691630778',
        `🛍️ NEW ORDER: #${order.id?.toUpperCase()} — ${order.firstName} ${order.lastName} — R${order.total} — ${order.deliveryMethod}`
      ).catch(() => {});

      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Order success error:', err.message);
      // Don't fail — order is already saved in Firestore
      return res.status(200).json({ success: true, warning: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}. Use ?action=yoco|order-success` });
}
