import fetch from 'node-fetch';
import https from 'https';

const agent = process.env.SHIPLOGIC_TEST_MODE === 'true' 
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { order } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'Order required' });
  }

  const apiKey = process.env.SHIPLOGIC_API_KEY;
  const baseUrl = process.env.SHIPLOGIC_BASE_URL || 'https://api.shiplogic.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'ShipLogic not configured' });
  }

  try {
    const response = await fetch(`${baseUrl}/shipments`, {
      method: 'POST',
      agent: agent,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection_address: {
          type: 'business',
          company: 'Grab & Go Studio',
          street_address: process.env.BUSINESS_ADDRESS || '123 Studio Lane',
          local_area: 'Woodstock',
          city: process.env.BUSINESS_CITY || 'Cape Town',
          zone: process.env.BUSINESS_PROVINCE || 'Western Cape',
          country: 'ZA',
          code: process.env.BUSINESS_POSTAL_CODE || '7925',
          lat: '-33.9249',
          lng: '18.4241'
        },
        delivery_address: {
          type: 'residential',
          company: `${order.firstName} ${order.lastName}`,
          street_address: order.address,
          local_area: order.city,
          city: order.city,
          zone: order.province,
          country: 'ZA',
          code: order.postalCode,
        },
        parcels: [
          {
            submitted_length_cm: 30,
            submitted_width_cm: 20,
            submitted_height_cm: 10,
            submitted_weight_kg: 1
          }
        ],
        opt_in_rates: [],
        opt_in_time_based_rates: []
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return res.status(500).json({ error: 'ShipLogic error', details: data });
    }

    res.json({ 
      success: true, 
      trackingNumber: data.tracking_reference,
      trackingUrl: `https://myshipments.co.za/track?referenceNumber=${data.tracking_reference}`,
      shipmentId: data.id
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}