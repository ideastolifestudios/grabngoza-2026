import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, email, returnMethod, returnReason } = req.body;

  if (!orderId || !email || !returnMethod || !returnReason) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Email to customer
    await transporter.sendMail({
      from: `"Grab & Go" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Return Request Received: Order #${orderId.toUpperCase()}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#111;color:#fff;padding:40px;border:1px solid #222;">
          <img src="https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png" style="height:40px;filter:brightness(0) invert(1);margin-bottom:20px;" />
          <h2 style="text-transform:uppercase;letter-spacing:2px;font-size:16px;">Return Request Received</h2>
          <p style="color:#aaa;font-size:13px;">Hi, we've received your return request for order <strong style="color:#fff;">#${orderId.toUpperCase()}</strong>.</p>
          
          <div style="background:#1a1a1a;padding:20px;margin:20px 0;border:1px solid #333;">
            <p style="margin:0 0 10px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:2px;">Return Details</p>
            <p style="margin:5px 0;font-size:13px;color:#fff;"><strong>Method:</strong> ${returnMethod === 'instore' ? 'In-Store (Free)' : 'Online (R120 fee)'}</p>
            <p style="margin:5px 0;font-size:13px;color:#fff;"><strong>Reason:</strong> ${returnReason}</p>
          </div>

          ${returnMethod === 'instore' 
            ? '<p style="color:#aaa;font-size:13px;">Please bring your item to our studio in its original condition with tags attached.</p>'
            : '<p style="color:#aaa;font-size:13px;">We will email you shipping instructions within 1-2 business days. A R120 fee will be deducted from your refund.</p>'
          }

          <p style="color:#555;font-size:11px;margin-top:30px;text-transform:uppercase;letter-spacing:2px;">© 2026 Grab & Go Studio</p>
        </div>
      `,
    });

    // Email to business
    await transporter.sendMail({
      from: `"Grab & Go Returns" <${process.env.SMTP_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      subject: `RETURN REQUEST: Order #${orderId.toUpperCase()}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;">
          <h2>New Return Request</h2>
          <p><strong>Order ID:</strong> #${orderId.toUpperCase()}</p>
          <p><strong>Customer Email:</strong> ${email}</p>
          <p><strong>Return Method:</strong> ${returnMethod === 'instore' ? 'In-Store (Free)' : 'Online (R120)'}</p>
          <p><strong>Reason:</strong> ${returnReason}</p>
        </div>
      `,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}