import nodemailer from 'nodemailer';

// WhatsApp helper
async function sendWhatsApp(phone: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn('⚠️  WhatsApp not configured, skipping message');
    return;
  }

  try {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '27' + cleanPhone.substring(1);
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      console.error('WhatsApp API error:', await response.text());
    }
  } catch (error) {
    console.error('WhatsApp send failed:', error);
    // Don't throw - WhatsApp is optional
  }
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order } = req.body;

    if (!order) {
      return res.status(400).json({ error: 'Order data required' });
    }

    // Validate SMTP config
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ SMTP not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const logoUrl = 'https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png';

    // Email HTML (shortened for brevity - use your existing template)
    const customerHtml = generateCustomerEmail(order, logoUrl);
    const businessHtml = generateBusinessEmail(order, logoUrl);

    // Send emails
    await Promise.all([
      transporter.sendMail({
        from: `"Grab & Go" <${process.env.SMTP_USER}>`,
        to: order.email,
        subject: `Order Confirmed: #${order.id?.toUpperCase() || 'UNKNOWN'}`,
        html: customerHtml,
      }),
      transporter.sendMail({
        from: `"Grab & Go Orders" <${process.env.SMTP_USER}>`,
        to: process.env.BUSINESS_EMAIL || process.env.SMTP_USER,
        subject: `NEW ORDER: #${order.id?.toUpperCase()} — ${order.firstName} ${order.lastName} — R${order.total}`,
        html: businessHtml,
      }),
    ]);

    // Send WhatsApp messages (non-blocking)
    if (order.phone) {
      const customerMsg = `Hi ${order.firstName}! Your Grab & Go order #${order.id?.toUpperCase()} has been confirmed. Total: R${order.total}. We will notify you when it ships!`;
      sendWhatsApp(order.phone, customerMsg).catch(err => 
        console.error('Customer WhatsApp failed:', err)
      );
    }

    const bizMsg = `NEW ORDER: #${order.id?.toUpperCase()} - ${order.firstName} ${order.lastName} - R${order.total} - ${order.deliveryMethod}`;
    sendWhatsApp(process.env.BUSINESS_PHONE || '0691630778', bizMsg).catch(err =>
      console.error('Business WhatsApp failed:', err)
    );

    return res.json({ 
      success: true, 
      message: 'Order confirmation sent' 
    });

  } catch (err: any) {
    console.error('Order success endpoint error:', err);
    return res.status(500).json({ 
      error: 'Failed to send confirmation',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

// Email template generators
function generateCustomerEmail(order: any, logoUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:20px;">
        <img src="${logoUrl}" alt="Grab & Go" style="height:40px;margin-bottom:20px;"/>
        <h1>Order Confirmed!</h1>
        <p>Hi ${order.firstName},</p>
        <p>Your order has been received and is being processed.</p>
        <p><strong>Order #:</strong> ${order.id?.toUpperCase()}</p>
        <p><strong>Total:</strong> R${order.total}</p>
        <hr/>
        <p style="font-size:12px;color:#666;">We'll send tracking details when your order ships!</p>
      </div>
    </body>
    </html>
  `;
}

function generateBusinessEmail(order: any, logoUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:20px;">
        <img src="${logoUrl}" alt="Grab & Go" style="height:40px;margin-bottom:20px;"/>
        <h1>New Order Alert</h1>
        <p><strong>Order #:</strong> ${order.id?.toUpperCase()}</p>
        <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total:</strong> R${order.total}</p>
        <p><strong>Delivery:</strong> ${order.deliveryMethod}</p>
        <hr/>
        <h3>Items:</h3>
        ${order.items?.map((item: any) => `
          <p>• ${item.quantity}x ${item.name} - R${item.price * item.quantity}</p>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}