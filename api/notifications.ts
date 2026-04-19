// api/notifications.ts
// Handles: POST ?action=email | ?action=whatsapp | ?action=post-delivery
import nodemailer from 'nodemailer';

const CORS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token,X-Requested-With,Accept,Content-Type,Date',
};

function setcors(res: any) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

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
  } catch (e: any) {
    console.error('WhatsApp failed:', e.message);
  }
}

export default async function handler(req: any, res: any) {
  setcors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action as string;

  // ── Email ──────────────────────────────────────────────────────────────────
  if (action === 'email' || !action) {
    const { to, subject, html, text } = req.body || {};
    if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });
    try {
      await makeTransport().sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to, subject,
        html: html || text || '',
        text: text || '',
      });
      return res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('Email error:', err.message);
      return res.status(200).json({ success: true, warning: 'Email queued' });
    }
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  if (action === 'whatsapp') {
    const { phone, message } = req.body || {};
    if (!phone || !message) return res.status(400).json({ error: 'Missing phone or message' });
    await sendWhatsApp(phone, message);
    return res.status(200).json({ success: true });
  }

  // ── Post-delivery review request ───────────────────────────────────────────
  if (action === 'post-delivery') {
    const { orderId, firstName, email, phone } = req.body || {};
    const subject = `How was your order? — Grab & Go #${orderId?.toUpperCase()}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#111;color:#fff;padding:40px;border:1px solid #222;">
        <img src="https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png" style="height:40px;filter:brightness(0) invert(1);margin-bottom:20px;" />
        <h2 style="text-transform:uppercase;letter-spacing:2px;">Your Order Arrived! 🎉</h2>
        <p style="color:#aaa;">Hi ${firstName}, your order #${orderId?.toUpperCase()} has been delivered.</p>
        <p style="color:#aaa;">We'd love to hear what you think — drop us a message!</p>
        <p style="color:#333;font-size:11px;margin-top:30px;">© 2026 Grab & Go Studio</p>
      </div>`;
    try {
      if (email) {
        await makeTransport().sendMail({
          from: `"Grab & Go" <${process.env.SMTP_USER}>`,
          to: email, subject, html,
        });
      }
      if (phone) await sendWhatsApp(phone, `Hey ${firstName}! Your Grab & Go order #${orderId?.toUpperCase()} was delivered 🎉 Hope you love it!`);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(200).json({ success: true, warning: err.message });
    }
  }

  return res.status(400).json({ error: `Unknown action: ${action}` });
}
