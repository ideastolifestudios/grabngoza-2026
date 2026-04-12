import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency, metadata } = req.body;

  if (!amount || !currency) {
    return res.status(400).json({ error: 'Amount and currency required' });
  }

  const yocoSecretKey = process.env.YOCO_SECRET_KEY;

  if (!yocoSecretKey) {
    return res.status(500).json({ error: 'Yoco not configured' });
  }

  try {
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yocoSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100),
        currency,
        cancelUrl: `${process.env.APP_URL}/checkout`,
        successUrl: `${process.env.APP_URL}/order-success?id=${metadata?.orderId}`,
        metadata
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return res.status(500).json({ error: 'Yoco payment failed', details: data.message });
    }

    res.json({ success: true, redirectUrl: data.redirectUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}