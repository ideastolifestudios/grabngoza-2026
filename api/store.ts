// api/store.ts
// Handles: POST ?action=send-product | ?action=return | GET ?action=health
import nodemailer from 'nodemailer';

const CORS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
  'Access-Control-Allow-Headers': 'X-CSRF-Token,Content-Type,Accept',
};
function setcors(res: any) { Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v)); }

// FIX: Guard SMTP config — return null if not configured
function makeTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export default async function handler(req: any, res: any) {
  setcors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string;

  // ── Health check ─────────────────────────────────────────────────────────────
  if (action === 'health' || req.method === 'GET') {
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Send product details via email ───────────────────────────────────────────
  if (action === 'send-product') {
    const { email, product } = req.body || {};
    if (!email || !product) return res.status(400).json({ error: 'email and product required' });

    // FIX: Check transport before attempting send
    const transport = makeTransport();
    if (!transport) {
      return res.status(503).json({ error: 'Email service not configured — check SMTP_HOST, SMTP_USER, SMTP_PASS' });
    }

    try {
      await transport.sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Product Details: ${product.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;">
            <h2 style="text-transform:uppercase;">${product.name}</h2>
            ${product.image ? `<img src="${product.image}" width="300" style="margin:16px 0;" />` : ''}
            <p>${product.description || ''}</p>
            <p><strong>Price: R${product.price}</strong></p>
            ${product.category ? `<p>Category: ${product.category}</p>` : ''}
            <a href="${process.env.APP_URL || 'https://grabngoza-2026.vercel.app'}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;font-weight:bold;text-transform:uppercase;font-size:12px;margin-top:16px;">View on Site</a>
          </div>`,
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── Submit return request ────────────────────────────────────────────────────
  if (action === 'return') {
    const { orderId, email, returnMethod, returnReason } = req.body || {};
    if (!orderId || !email || !returnMethod || !returnReason) {
      return res.status(400).json({ error: 'orderId, email, returnMethod and returnReason required' });
    }

    // FIX: Check transport before attempting send
    const transporter = makeTransport();
    if (!transporter) {
      return res.status(503).json({ error: 'Email service not configured — check SMTP_HOST, SMTP_USER, SMTP_PASS' });
    }

    try {
      await Promise.all([
        // Customer email
        transporter.sendMail({
          from: `"Grab & Go" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `Return Request Received: Order #${orderId.toUpperCase()}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#111;color:#fff;padding:40px;border:1px solid #222;">
              <img src="https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png" style="height:40px;filter:brightness(0) invert(1);margin-bottom:20px;" />
              <h2 style="text-transform:uppercase;letter-spacing:2px;font-size:16px;">Return Request Received</h2>
              <p style="color:#aaa;">Hi, we've received your return request for order <strong style="color:#fff;">#${orderId.toUpperCase()}</strong>.</p>
              <div style="background:#1a1a1a;padding:20px;margin:20px 0;border:1px solid #222;">
                <p style="margin:0 0 8px;color:#888;font-size:10px;letter-spacing:1px;text-transform:uppercase;">Method</p>
                <p style="margin:0;color:#fff;">${returnMethod === 'courier' ? 'Courier Pickup' : 'Drop Off at Studio'}</p>
                <p style="margin:12px 0 8px 0;color:#888;font-size:10px;letter-spacing:1px;text-transform:uppercase;">Reason</p>
                <p style="margin:0;color:#fff;">${returnReason}</p>
              </div>
              <p style="color:#888;font-size:12px;">Our team will contact you within 24 hours with return instructions.</p>
            </div>`,
        }),
        // Admin notification
        process.env.BUSINESS_EMAIL ? transporter.sendMail({
          from: `"Grab & Go Returns" <${process.env.SMTP_USER}>`,
          to: process.env.BUSINESS_EMAIL,
          subject: `[RETURN] Order #${orderId.toUpperCase()} — ${returnMethod}`,
          html: `<div style="font-family:sans-serif;padding:20px;">
            <h3>Return Request</h3>
            <p><strong>Order:</strong> ${orderId}</p>
            <p><strong>Customer:</strong> ${email}</p>
            <p><strong>Method:</strong> ${returnMethod}</p>
            <p><strong>Reason:</strong> ${returnReason}</p>
          </div>`,
        }) : Promise.resolve(),
      ]);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
