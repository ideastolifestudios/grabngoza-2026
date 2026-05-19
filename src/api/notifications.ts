import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ---- Firebase Admin (lazy init for invoice action) ----
let dbAdmin: any = null;
function getDb() {
  if (!dbAdmin) {
    if (!getApps().length) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    dbAdmin = getFirestore();
  }
  return dbAdmin;
}

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendWhatsApp(phone: string, message: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || !phone) return;
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '27' + clean.substring(1);
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: clean, type: 'text', text: { body: message } }),
  }).catch(e => console.error('[WhatsApp Error]', e.message));
}

const LOGO = 'https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png';
const BASE = () => process.env.APP_URL || 'https://grabngoza-2026.vercel.app';

function emailWrap(emoji: string, title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111;max-width:600px;width:100%;border:1px solid #222;">
<tr><td style="padding:30px 40px;text-align:center;border-bottom:1px solid #222;">
<img src="${LOGO}" alt="Grab & Go" style="height:40px;filter:brightness(0) invert(1);" /></td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:8px;">${emoji}</div>
<h2 style="color:#fff;margin:0 0 6px;font-size:20px;text-transform:uppercase;letter-spacing:2px;">${title}</h2>
</td></tr>
<tr><td style="padding:0 40px 40px;">${body}</td></tr>
<tr><td style="padding:20px 40px;text-align:center;border-top:1px solid #222;">
<p style="color:#333;font-size:9px;">\u00a9 2026 Grab & Go Studio \u2022 South Africa</p>
</td></tr></table></td></tr></table></body></html>`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || req.body?.action || 'email';

  try {
    // ================================================================
    // ACTION: email (original)
    // ================================================================
    if (action === 'email' && req.method === 'POST') {
      const { to, subject, html, text } = req.body;
      if (!to || !subject) return res.status(400).json({ error: 'Missing: to, subject' });
      const t = getTransporter();
      if (!t) return res.status(500).json({ error: 'Email service not configured' });
      await t.sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to, subject, html: html || undefined, text: text || undefined,
      });
      return res.json({ success: true, message: 'Email sent' });
    }

    // ================================================================
    // ACTION: whatsapp (original)
    // ================================================================
    if (action === 'whatsapp' && req.method === 'POST') {
      const { phone, message } = req.body;
      if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
      await sendWhatsApp(phone, message);
      return res.json({ success: true });
    }

    // ================================================================
    // ACTION: invoice (GET — returns printable HTML invoice)
    // ================================================================
    if (action === 'invoice' && req.method === 'GET') {
      const { orderId } = req.query;
      if (!orderId) return res.status(400).json({ error: 'orderId required' });

      const db = getDb();
      const doc = await db.collection('orders').doc(orderId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

      const order = doc.data() as any;
      const invNum = `GNG-${doc.id.slice(0, 8).toUpperCase()}`;
      const date = order.date?.toDate ? order.date.toDate() : new Date(order.date);
      const dateStr = date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
      const isVat = !!process.env.VAT_NUMBER;
      const vatNum = process.env.VAT_NUMBER || '';

      const rows = (order.items || []).map((i: any) => {
        const t = (i.price || 0) * (i.quantity || 1);
        const v = i.selectedVariants ? Object.values(i.selectedVariants).join(', ') : '';
        return `<tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;">${i.name}${v ? ` (${v})` : ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:12px;">${i.quantity||1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;font-family:monospace;">R${(i.price||0).toFixed(2)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:12px;font-family:monospace;font-weight:bold;">R${t.toFixed(2)}</td></tr>`;
      }).join('');

      const sub = (order.items||[]).reduce((s:number,i:any)=>s+(i.price||0)*(i.quantity||1),0);
      const ship = order.shippingCost||0;
      const total = order.total||sub+ship;
      const vat = isVat ? total-(total/1.15) : 0;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invNum}</title>
<style>@media print{body{margin:0}@page{margin:15mm}}</style></head>
<body style="margin:0;padding:40px;font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#111;">
<div style="max-width:700px;margin:0 auto;">
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:3px solid #000;padding-bottom:20px;">
<div><img src="${LOGO}" alt="Grab & Go" style="height:36px;margin-bottom:12px;" />
<p style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:2px;">Ideas to Life Studios</p>
<p style="font-size:10px;color:#999;">${process.env.BUSINESS_ADDRESS||'1104 Tugela Street'}, ${process.env.BUSINESS_CITY||'Midrand'}</p>
<p style="font-size:10px;color:#999;">${process.env.BUSINESS_PROVINCE||'Gauteng'} ${process.env.BUSINESS_POSTAL_CODE||'1685'}</p>
${isVat?`<p style="font-size:10px;color:#999;">VAT: ${vatNum}</p>`:''}</div>
<div style="text-align:right;"><h1 style="font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:3px;margin:0;">Invoice</h1>
<p style="font-size:11px;color:#666;margin-top:8px;"><strong>${invNum}</strong></p>
<p style="font-size:11px;color:#999;">${dateStr}</p></div></div>
<div style="display:flex;justify-content:space-between;margin-bottom:32px;">
<div><p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:8px;">Bill To</p>
<p style="font-size:13px;font-weight:700;">${order.firstName} ${order.lastName}</p>
<p style="font-size:11px;color:#666;">${order.email}</p>
<p style="font-size:11px;color:#666;">${order.phone||''}</p></div>
<div style="text-align:right;"><p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:#999;margin-bottom:8px;">Ship To</p>
<p style="font-size:11px;color:#666;">${order.address||''}</p>
<p style="font-size:11px;color:#666;">${order.city||''}, ${order.province||''} ${order.postalCode||''}</p></div></div>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
<thead><tr style="background:#f8f9fa;">
<th style="padding:10px 12px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;">Item</th>
<th style="padding:10px 12px;text-align:center;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;">Qty</th>
<th style="padding:10px 12px;text-align:right;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;">Price</th>
<th style="padding:10px 12px;text-align:right;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#999;">Total</th>
</tr></thead><tbody>${rows}</tbody></table>
<div style="display:flex;justify-content:flex-end;"><div style="width:250px;">
<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#666;"><span>Subtotal</span><span style="font-family:monospace;">R${sub.toFixed(2)}</span></div>
<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#666;"><span>Shipping</span><span style="font-family:monospace;">${ship>0?'R'+ship.toFixed(2):'FREE'}</span></div>
${isVat?`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#666;"><span>VAT (15%)</span><span style="font-family:monospace;">R${vat.toFixed(2)}</span></div>`:``}
<div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;font-weight:900;border-top:2px solid #000;margin-top:8px;"><span>Total</span><span style="font-family:monospace;">R${total.toFixed(2)}</span></div>
</div></div>
<div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
<p style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:3px;">Thank you for shopping with Grab & Go</p></div>
</div></body></html>`;

      if (req.query.format === 'json') return res.json({ success: true, invoiceNumber: invNum, html });
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    }

    // ================================================================
    // ACTION: mark-shipped (POST — admin manual ship notification)
    // ================================================================
    if (action === 'mark-shipped' && req.method === 'POST') {
      const { order, trackingNumber, trackingUrl } = req.body;
      if (!order?.email) return res.status(400).json({ error: 'order with email required' });
      const trackLink = trackingUrl || `${BASE()}/track-order?id=${order.id}&email=${encodeURIComponent(order.email)}`;
      const t = getTransporter();
      if (t) {
        await t.sendMail({
          from: `"Grab & Go" <${process.env.SMTP_USER}>`,
          to: order.email,
          subject: `\u{1F4E6} Your order #${(order.id||'').slice(0,8).toUpperCase()} has shipped!`,
          html: emailWrap('\u{1F4E6}', 'Your Order Has Shipped',
            `<p style="color:#ccc;font-size:14px;">Hi ${order.firstName||'there'},</p>
<p style="color:#999;font-size:13px;line-height:1.7;">Great news! Your Grab & Go order is on its way.</p>
${trackingNumber?`<p style="color:#999;font-size:13px;">Tracking: <strong style="color:#fff;font-family:monospace;">${trackingNumber}</strong></p>`:''}
<div style="text-align:center;margin-top:24px;">
<a href="${trackLink}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 40px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Track Your Order</a></div>`),
        });
      }
      if (order.phone) {
        await sendWhatsApp(order.phone, `\u{1F4E6} *Your Order Has Shipped!*\n\nHi ${order.firstName}! Order #${(order.id||'').slice(0,8).toUpperCase()} is on its way.${trackingNumber?`\nTracking: ${trackingNumber}`:``}\n\nTrack: ${trackLink}`);
      }
      return res.json({ success: true, message: 'Ship notification sent' });
    }

    // ================================================================
    // ACTION: post-delivery (POST — follow-up review request)
    // ================================================================
    if (action === 'post-delivery' && req.method === 'POST') {
      const { orderId, firstName, email, phone } = req.body;
      if (!email || !firstName) return res.status(400).json({ error: 'email and firstName required' });
      const t = getTransporter();
      if (t) {
        await t.sendMail({
          from: `"Grab & Go" <${process.env.SMTP_USER}>`,
          to: email,
          subject: `How was your order${orderId?` #${orderId.slice(0,8).toUpperCase()}`:''}? \u2b50`,
          html: emailWrap('\u2b50', 'How Was Your Order?',
            `<p style="color:#ccc;font-size:14px;">Hi ${firstName},</p>
<p style="color:#999;font-size:13px;line-height:1.7;">We hope you're loving your Grab & Go gear! Your feedback helps us improve.</p>
<div style="text-align:center;margin-top:24px;">
<a href="${BASE()}/helpdesk" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 40px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Share Feedback</a></div>
<p style="color:#555;font-size:11px;text-align:center;margin-top:16px;">Or reply directly to this email</p>`),
        });
      }
      if (phone) await sendWhatsApp(phone, `Hi ${firstName}! \u2b50\n\nWe hope you're enjoying your Grab & Go order! We'd love to hear your feedback.\n\nReply here or visit ${BASE()}/helpdesk\n\n\u2014 The Grab & Go Team`);
      return res.json({ success: true, message: 'Follow-up sent' });
    }

    // ================================================================
    // ACTION: abandoned-cart (POST — cart recovery email)
    // ================================================================
    if (action === 'abandoned-cart' && req.method === 'POST') {
      const { email, firstName, cartItems, cartTotal } = req.body;
      if (!email) return res.status(400).json({ error: 'email required' });
      const name = firstName || 'there';
      const itemsHtml = (cartItems||[]).slice(0,5).map((i:any)=>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #222;color:#ccc;font-size:12px;">${i.name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #222;color:#fff;font-size:12px;text-align:right;font-family:monospace;">R${((i.price||0)*(i.quantity||1)).toFixed(2)}</td></tr>`
      ).join('');
      const t = getTransporter();
      if (!t) return res.status(500).json({ error: 'Email not configured' });
      await t.sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${name}, you left something behind \u{1F440}`,
        html: emailWrap('\u{1F440}', 'You Left Something Behind',
          `<p style="color:#ccc;font-size:14px;">Hi ${name},</p>
<p style="color:#999;font-size:13px;line-height:1.7;">Your Grab & Go cart is waiting. Don't let these fresh picks slip away.</p>
${itemsHtml?`<table style="width:100%;margin:20px 0;">${itemsHtml}</table>`:''}
${cartTotal?`<p style="color:#fff;font-size:16px;font-weight:900;text-align:right;font-family:monospace;">Total: R${Number(cartTotal).toFixed(2)}</p>`:''}
<div style="text-align:center;margin-top:24px;">
<a href="${BASE()}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 40px;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Complete Your Order</a></div>`),
      });
      return res.json({ success: true, message: 'Recovery email sent' });
    }

    return res.status(400).json({ error: 'Invalid action. Use: email, whatsapp, invoice, mark-shipped, post-delivery, abandoned-cart' });
  } catch (err: any) {
    console.error('Notification error:', err);
    res.status(500).json({ error: err.message || 'Failed' });
  }
}
