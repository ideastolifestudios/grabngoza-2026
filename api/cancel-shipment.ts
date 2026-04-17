import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SHIPLOGIC_API_KEY;
  const baseUrl = process.env.SHIPLOGIC_BASE_URL || 'https://api.shiplogic.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'ShipLogic not configured' });
  }

  try {
    const { order, serviceLevel, parcelDetails } = req.body;

    if (!order) {
      return res.status(400).json({ error: 'Order required' });
    }

    // Calculate parcel from order items if not provided
    const parcel = parcelDetails || (() => {
      const totalWeight = (order.items || []).reduce((sum: number, item: any) => {
        const weight = item.weight || 0.5;
        return sum + (weight * (item.quantity || 1));
      }, 0);
      const totalItems = (order.items || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      return {
        weight: Math.max(totalWeight, 0.5),
        dimensions: {
          length: Math.min(10 + (totalItems * 5), 60),
          width: Math.min(10 + (totalItems * 3), 40),
          height: Math.min(5 + (totalItems * 3), 30),
        }
      };
    })();

    const response = await fetch(`${baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin_address: {
          street1: process.env.BUSINESS_ADDRESS || '123 Studio Lane',
          city: process.env.BUSINESS_CITY || 'Cape Town',
          state_province: process.env.BUSINESS_PROVINCE || 'Western Cape',
          postal_code: process.env.BUSINESS_POSTAL_CODE || '7925',
          country_code: 'ZA',
        },
        destination_address: {
          street1: order.address,
          city: order.city,
          state_province: order.province,
          postal_code: order.postalCode,
          country_code: order.country || 'ZA',
        },
        parcel,
        service_level: serviceLevel || 'standard',
        reference: `GNG-${order.id || Date.now()}`,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('ShipLogic shipment error:', JSON.stringify(data));
      return res.status(500).json({ error: 'ShipLogic error', details: data });
    }

    res.json({
      success: true,
      shipmentId: data.shipment_id,
      trackingNumber: data.tracking_number,
      status: data.status,
    });

  } catch (err: any) {
    console.error('Create shipment error:', err);
    res.status(500).json({ error: err.message || 'Failed to create shipment' });
  }
}
