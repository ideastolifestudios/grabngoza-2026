import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'Order required' });
  }

  // Send confirmation email
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

    // Email to customer
    await transporter.sendMail({
      from: `"Grab & Go" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Order Confirmed: #${order.id}`,
      html: `
        <h1>Order Confirmed!</h1>
        <p>Hi ${order.firstName}, thank you for your order.</p>
        <p><strong>Order ID:</strong> #${order.id}</p>
        <p><strong>Total:</strong> R${order.total}</p>
        <p>We will notify you when your order ships.</p>
      `,
    });

    // Email to business
    await transporter.sendMail({
      from: `"Grab & Go Orders" <${process.env.SMTP_USER}>`,
      to: process.env.BUSINESS_EMAIL,
      subject: `NEW ORDER: #${order.id} - ${order.firstName} ${order.lastName}`,
      html: `
        <h1>New Order Received!</h1>
        <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Total:</strong> R${order.total}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${order.items?.map((item: any) => `<li>${item.quantity}x ${item.name} - R${item.price * item.quantity}</li>`).join('')}
        </ul>
        <p><strong>Address:</strong> ${order.address}, ${order.city}, ${order.province}</p>
      `,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}