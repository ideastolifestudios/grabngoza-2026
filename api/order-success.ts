import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

async function sendWhatsApp(phone: string, message: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return;
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '27' + cleanPhone.substring(1);
  await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: message } }),
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { order } = req.body;
  if (!order) return res.status(400).json({ error: 'Order required' });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const logoUrl = 'https://res.cloudinary.com/dggitwduo/image/upload/v1774084848/GRAB_GO_WEB_LOGO_as09yx.png';

  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;max-width:600px;width:100%;border:1px solid #222222;">
            <tr>
              <td style="padding:35px 40px;text-align:center;border-bottom:1px solid #222222;">
                <img src="${logoUrl}" alt="Grab & Go" style="height:45px;width:auto;display:block;margin:0 auto;filter:brightness(0) invert(1);" />
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px;text-align:center;border-bottom:1px solid #222222;">
                <p style="color:#ffffff;margin:0;font-size:10px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">✓ &nbsp; Order Confirmed</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <p style="font-size:22px;color:#ffffff;margin:0 0 6px;font-weight:900;text-transform:uppercase;">Hi ${order.firstName},</p>
                <p style="font-size:12px;color:#666666;margin:0 0 35px;line-height:1.8;letter-spacing:1px;text-transform:uppercase;">Your order has been received and is being processed.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222222;margin-bottom:30px;">
                  <tr>
                    <td style="padding:16px 20px;border-bottom:1px solid #222222;border-right:1px solid #222222;">
                      <p style="margin:0;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;">Order Number</p>
                      <p style="margin:6px 0 0;font-size:13px;font-weight:900;color:#ffffff;">#${order.id?.toUpperCase()}</p>
                    </td>
                    <td style="padding:16px 20px;border-bottom:1px solid #222222;">
                      <p style="margin:0;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;">Date</p>
                      <p style="margin:6px 0 0;font-size:13px;font-weight:900;color:#ffffff;">${new Date().toLocaleDateString('en-ZA', { dateStyle: 'long' })}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;border-right:1px solid #222222;">
                      <p style="margin:0;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;">Delivery</p>
                      <p style="margin:6px 0 0;font-size:13px;font-weight:900;color:#ffffff;text-transform:capitalize;">${order.deliveryMethod || 'Standard'}</p>
                    </td>
                    <td style="padding:16px 20px;">
                      <p style="margin:0;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;">Payment</p>
                      <p style="margin:6px 0 0;font-size:13px;font-weight:900;color:#ffffff;">Yoco Secure</p>
                    </td>
                  </tr>
                </table>
                <p style="font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;margin:0 0 20px;padding-bottom:12px;border-bottom:1px solid #222222;">Items Ordered</p>
                ${order.items?.map((item: any) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #1a1a1a;">
                    <tr>
                      <td width="60"><img src="${item.image}" width="55" height="70" style="display:block;object-fit:cover;border:1px solid #222222;" /></td>
                      <td style="padding-left:16px;">
                        <p style="margin:0;font-size:12px;font-weight:900;text-transform:uppercase;color:#ffffff;">${item.name}</p>
                        <p style="margin:5px 0 0;font-size:10px;color:#444444;text-transform:uppercase;letter-spacing:1px;">Qty: ${item.quantity}</p>
                      </td>
                      <td align="right" style="vertical-align:top;">
                        <p style="margin:0;font-size:13px;font-weight:900;color:#ffffff;">R${item.price * item.quantity}</p>
                      </td>
                    </tr>
                  </table>
                `).join('') || ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:1px solid #222222;padding-top:20px;">
                  <tr>
                    <td><p style="margin:0 0 16px;font-size:10px;color:#444444;text-transform:uppercase;letter-spacing:1px;">Shipping</p></td>
                    <td align="right"><p style="margin:0 0 16px;font-size:10px;color:#444444;">${order.shippingCost === 0 ? 'Free' : 'R' + order.shippingCost}</p></td>
                  </tr>
                  <tr style="border-top:1px solid #222222;">
                    <td style="padding-top:16px;"><p style="margin:0;font-size:14px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:2px;">Total</p></td>
                    <td align="right" style="padding-top:16px;"><p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;">R${order.total}</p></td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:30px;border:1px solid #222222;">
                  <tr>
                    <td style="padding:20px;border-bottom:1px solid #222222;">
                      <p style="margin:0;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;">Shipping Status</p>
                      <p style="margin:8px 0 0;font-size:12px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:1px;">⏳ &nbsp; Being Prepared</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px;">
                      <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Tracking Number</p>
                      <p style="margin:8px 0 0;font-size:12px;color:#555555;">${order.trackingNumber || 'Will be updated once your order ships'}</p>
                      ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="display:inline-block;margin-top:12px;background:#ffffff;color:#000000;text-decoration:none;padding:12px 30px;font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Track Order</a>` : ''}
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                  <tr>
                    <td align="center">
                      <a href="${process.env.APP_URL}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:16px 48px;font-size:10px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">Track My Order</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:25px 40px;text-align:center;border-top:1px solid #222222;">
                <p style="margin:0 0 8px;font-size:9px;color:#333333;letter-spacing:3px;text-transform:uppercase;">© 2026 Grab & Go Studio • South Africa</p>
                <p style="margin:0;font-size:9px;color:#333333;">Questions? <a href="https://wa.me/27691630778" style="color:#555555;font-weight:bold;">WhatsApp Us</a></p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const businessHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#111111;max-width:600px;width:100%;border:1px solid #222222;">
            <tr>
              <td style="padding:30px 40px;border-bottom:1px solid #222222;">
                <img src="${logoUrl}" alt="Grab & Go" style="height:35px;width:auto;display:block;margin:0 0 10px;filter:brightness(0) invert(1);" />
                <p style="margin:0;font-size:9px;color:#444444;letter-spacing:3px;text-transform:uppercase;">New Order Alert</p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:14px 40px;border-bottom:1px solid #222222;">
                <p style="color:#000000;margin:0;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">New Order: #${order.id?.toUpperCase()} — R${order.total}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:35px 40px;">
                <p style="font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid #222222;">Customer Details</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
                  <tr><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Name</p>
                    <p style="margin:5px 0 0;font-size:13px;font-weight:900;color:#ffffff;">${order.firstName} ${order.lastName}</p>
                  </td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Email</p>
                    <p style="margin:5px 0 0;font-size:13px;color:#ffffff;">${order.email}</p>
                  </td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Phone</p>
                    <p style="margin:5px 0 0;font-size:13px;color:#ffffff;">${order.phone}</p>
                  </td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #1a1a1a;">
                    <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Delivery</p>
                    <p style="margin:5px 0 0;font-size:13px;font-weight:900;color:#ffffff;text-transform:capitalize;">${order.deliveryMethod || 'Standard'}</p>
                  </td></tr>
                  ${order.address ? `<tr><td style="padding:10px 0;">
                    <p style="margin:0;font-size:9px;color:#444444;text-transform:uppercase;letter-spacing:2px;">Address</p>
                    <p style="margin:5px 0 0;font-size:13px;color:#ffffff;">${order.address}, ${order.city}, ${order.province} ${order.postalCode}</p>
                  </td></tr>` : ''}
                </table>
                <p style="font-size:9px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#444444;margin:0 0 16px;padding-bottom:10px;border-bottom:1px solid #222222;">Items</p>
                ${order.items?.map((item: any) => `
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #1a1a1a;">
                    <tr>
                      <td><p style="margin:0;font-size:12px;font-weight:900;color:#ffffff;text-transform:uppercase;">${item.quantity}x ${item.name}</p></td>
                      <td align="right"><p style="margin:0;font-size:12px;font-weight:900;color:#ffffff;">R${item.price * item.quantity}</p></td>
                    </tr>
                  </table>
                `).join('') || ''}
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#ffffff;padding:18px 20px;">
                  <tr>
                    <td><p style="margin:0;font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#000000;">Order Total</p></td>
                    <td align="right"><p style="margin:0;font-size:20px;font-weight:900;color:#000000;">R${order.total}</p></td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:25px;">
                  <tr>
                    <td align="center">
                      <a href="${process.env.APP_URL}" style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;padding:16px 48px;font-size:10px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">View Dashboard</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;text-align:center;border-top:1px solid #222222;">
                <p style="margin:0;font-size:9px;color:#333333;letter-spacing:3px;text-transform:uppercase;">© 2026 Grab & Go Studio</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Grab & Go" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Order Confirmed: #${order.id?.toUpperCase()}`,
      html: customerHtml,
    });

    await transporter.sendMail({
      from: `"Grab & Go Orders" <${process.env.SMTP_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      subject: `NEW ORDER: #${order.id?.toUpperCase()} — ${order.firstName} ${order.lastName} — R${order.total}`,
      html: businessHtml,
    });

    // WhatsApp to customer
    if (order.phone) {
      const customerMsg = `Hi ${order.firstName}! Your Grab & Go order #${order.id?.toUpperCase()} has been confirmed. Total: R${order.total}. We will notify you when it ships!`;
      await sendWhatsApp(order.phone, customerMsg).catch(err => console.error('Customer WhatsApp failed:', err));
    }

    // WhatsApp to business
    const bizMsg = `NEW ORDER: #${order.id?.toUpperCase()} - ${order.firstName} ${order.lastName} - R${order.total} - ${order.deliveryMethod}`;
    await sendWhatsApp('0691630778', bizMsg).catch(err => console.error('Business WhatsApp failed:', err));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}