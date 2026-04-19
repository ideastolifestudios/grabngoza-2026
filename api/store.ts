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

function makeTransport() {
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

    try {
      await makeTransport().sendMail({
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

    try {
      const transporter = makeTransport();
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
              <div style="background:#1a1a1a;padding:20px;margin:20px 0;border:1px solid #333;">
                <p style="margin:5px 0;font-size:13px;"><strong>Method:</strong> ${returnMethod === 'instore' ? 'In-Store (Free)' : 'Online (R120 fee)'}</p>
                <p style="margin:5px 0;font-size:13px;"><strong>Reason:</strong> ${returnReason}</p>
              </div>
              ${returnMethod === 'instore'
                ? '<p style="color:#aaa;font-size:13px;">Please bring your item to our studio in original condition with tags attached.</p>'
                : '<p style="color:#aaa;font-size:13px;">We will email shipping instructions within 1–2 business days. A R120 fee will be deducted from your refund.</p>'}
              <p style="color:#333;font-size:10px;margin-top:30px;">© 2026 Grab & Go Studio</p>
            </div>`,
        }),
        // Business email
        transporter.sendMail({
          from: `"Grab & Go Returns" <${process.env.SMTP_USER}>`,
          to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
          subject: `RETURN REQUEST: Order #${orderId.toUpperCase()}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;">
              <h2>↩️ New Return Request</h2>
              <p><strong>Order ID:</strong> #${orderId.toUpperCase()}</p>
              <p><strong>Customer Email:</strong> ${email}</p>
              <p><strong>Return Method:</strong> ${returnMethod === 'instore' ? 'In-Store (Free)' : 'Online (R120)'}</p>
              <p><strong>Reason:</strong> ${returnReason}</p>
            </div>`,
        }),
      ]);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}. Use ?action=health|send-product|return` });
}
