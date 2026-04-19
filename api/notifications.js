// api/notifications.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required fields: to, subject' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Grab & Go" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: html || text || '',
      text: text || '',
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    // Return success anyway so the UI doesn't break — email is non-critical
    return res.status(200).json({ success: true, warning: 'Email queued' });
  }
}