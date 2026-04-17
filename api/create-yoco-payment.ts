export default async function handler(req: any, res: any) {
  // Set CORS headers
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
    const { amount, currency, metadata } = req.body;

    // Validation
    if (!amount || !currency) {
      return res.status(400).json({ error: 'Amount and currency required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const yocoSecretKey = process.env.YOCO_SECRET_KEY;
    if (!yocoSecretKey) {
      console.error('❌ YOCO_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      console.error('❌ APP_URL not configured');
      return res.status(500).json({ error: 'Application URL not configured' });
    }

    // Create Yoco checkout
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yocoSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // Convert to cents
        currency: currency.toUpperCase(),
        cancelUrl: `${appUrl}/?status=cancelled`,
        successUrl: `${appUrl}/order-success?id=${metadata?.orderId || 'unknown'}`,
        metadata: {
          orderId: metadata?.orderId,
          timestamp: new Date().toISOString(),
          ...metadata
        }
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('Yoco API error:', data);
      return res.status(response.status).json({ 
        error: 'Payment checkout failed',
        details: data.message || data.error || 'Unknown error'
      });
    }

    // Success
    return res.status(200).json({ 
      success: true, 
      redirectUrl: data.redirectUrl,
      checkoutId: data.id
    });

  } catch (err: any) {
    console.error('Payment endpoint error:', err);
    return res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}