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
        submitted_length_cm: Math.min(10 + (totalItems * 5), 60),
        submitted_width_cm: Math.min(10 + (totalItems * 3), 40),
        submitted_height_cm: Math.min(5 + (totalItems * 3), 30),
        submitted_weight_kg: Math.max(totalWeight, 0.5)
      };
    })();

    const response = await fetch(`${baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection_address: {
          type: 'business',
          company: 'IDEAS TO LIFE STUDIOS',
          street_address: process.env.BUSINESS_ADDRESS || '1104 Tugela Street',
          local_area: process.env.BUSINESS_CITY || 'Klipfontein View',
          city: process.env.BUSINESS_CITY || 'Midrand',
          zone: process.env.BUSINESS_PROVINCE || 'Gauteng',
          country: 'ZA',
          code: process.env.BUSINESS_POSTAL_CODE || '1685',
        },
        delivery_address: {
          type: 'residential',
          company: `${order.firstName} ${order.lastName}`,
          street_address: order.address,
          local_area: order.city,
          city: order.city,
          zone: order.province,
          country: order.country || 'ZA',
          code: order.postalCode,
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
