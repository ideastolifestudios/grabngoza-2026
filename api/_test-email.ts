import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;

  res.json({
    host: smtpHost ? 'SET' : 'MISSING',
    user: smtpUser ? 'SET' : 'MISSING', 
    pass: smtpPass ? 'SET' : 'MISSING',
    port: smtpPort || 'MISSING'
  });
}