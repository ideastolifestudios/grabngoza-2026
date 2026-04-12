import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, product } = req.body;

  if (!email || !product) {
    return res.status(400).json({ error: 'Email and product required' });
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
    await transporter.sendMail({
      from: `"Grab & Go" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Product Details: ${product.name}`,
      html: `
        <h2>${product.name}</h2>
        <img src="${product.image}" width="300" />
        <p>${product.description}</p>
        <p><strong>Price: R${product.price}</strong></p>
        <p>Category: ${product.category}</p>
        <a href="${process.env.APP_URL}">View on Site</a>
      `,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}