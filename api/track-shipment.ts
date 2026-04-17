import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SHIPLOGIC_API_KEY;
  const baseUrl = process.env.SHIPLOGIC_BASE_URL || 'https://api.shiplogic.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'ShipLogic not configured' });
  }

  try {
    const { trackingNumber } = req.query;

    if (!trackingNumber) {
      return res.status(400).json({ error: 'trackingNumber query parameter required' });
    }

    const response = await fetch(`${baseUrl}/tracking/${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Tracking lookup failed', details: data });
    }

    res.json({
      success: true,
      trackingNumber: data.tracking_number,
      status: data.status,
      events: (data.events || []).map((event: any) => ({
        timestamp: event.timestamp,
        location: event.location,
        description: event.description,
      })),
    });

  } catch (err: any) {
    console.error('Track shipment error:', err);
    res.status(500).json({ error: err.message || 'Failed to track shipment' });
  }
}
