import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action || req.body.action || 'email';

  try {
    // ---- EMAIL action ----
    if (action === 'email') {
      const { to, subject, html, text } = req.body;
      if (!to || !subject) return res.status(400).json({ error: 'Missing: to, subject' });
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(500).json({ error: 'Email service not configured' });
      }
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to, subject,
        html: html || undefined,
        text: text || undefined,
      });
      return res.json({ success: true, message: 'Email sent' });
    }

    // ---- WHATSAPP action ----
    if (action === 'whatsapp') {
      const { phone, message } = req.body;
      if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!accessToken || !phoneNumberId) {
        return res.status(500).json({ error: 'WhatsApp not configured' });
      }
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '27' + cleanPhone.substring(1);

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: message },
          }),
        }
      );
      const data = await response.json() as any;
      if (!response.ok) return res.status(500).json({ error: data.error?.message || 'WhatsApp failed' });
      return res.json({ success: true, messageId: data.messages?.[0]?.id });
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=email or ?action=whatsapp' });
  } catch (err: any) {
    console.error('Notification error:', err);
    return res.status(500).json({ error: err.message });
  }
}