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
    const { deliveryAddress, items } = req.body;

    if (!deliveryAddress || !items || items.length === 0) {
      return res.status(400).json({ error: 'deliveryAddress and items are required' });
    }

    // Calculate total weight and determine parcel size from cart items
    const totalWeight = items.reduce((sum: number, item: any) => {
      const weight = item.weight || 0.5; // default 0.5kg per item
      return sum + (weight * (item.quantity || 1));
    }, 0);

    const totalItems = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    // Dynamic parcel sizing based on item count
    const parcel = {
      weight: Math.max(totalWeight, 0.5),
      dimensions: {
        length: Math.min(10 + (totalItems * 5), 60), // 10-60cm
        width: Math.min(10 + (totalItems * 3), 40),   // 10-40cm
        height: Math.min(5 + (totalItems * 3), 30),    // 5-30cm
      }
    };

    // Get standard rates
    const ratesResponse = await fetch(`${baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination_address: {
          street1: deliveryAddress.address,
          street2: deliveryAddress.address2 || '',
          city: deliveryAddress.city,
          state_province: deliveryAddress.province,
          postal_code: deliveryAddress.postalCode,
          country_code: deliveryAddress.country || 'ZA',
        },
        parcel,
      }),
    });

    const ratesData = await ratesResponse.json() as any;

    if (!ratesResponse.ok) {
      console.error('ShipLogic rates error:', JSON.stringify(ratesData));
      return res.status(500).json({ error: 'Failed to get shipping rates', details: ratesData });
    }

    // Also try opt-in rates (Pargo lockers, etc.)
    let optInRates: any[] = [];
    try {
      const optInResponse = await fetch(`${baseUrl}/rates/opt-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination_address: {
            street1: deliveryAddress.address,
            street2: deliveryAddress.address2 || '',
            city: deliveryAddress.city,
            state_province: deliveryAddress.province,
            postal_code: deliveryAddress.postalCode,
            country_code: deliveryAddress.country || 'ZA',
          },
          parcel,
        }),
      });

      if (optInResponse.ok) {
        const optInData = await optInResponse.json() as any;
        optInRates = optInData.rates || [];
      }
    } catch (err) {
      // Opt-in rates are optional, don't fail the whole request
      console.warn('Opt-in rates failed:', err);
    }

    // Format rates for frontend
    const rates = (ratesData.rates || []).map((rate: any) => ({
      serviceLevel: rate.service_level,
      estimatedDelivery: rate.estimated_delivery,
      amount: rate.cost?.amount || rate.rate || 0,
      currency: rate.cost?.currency || 'ZAR',
      carrier: rate.carrier || 'The Courier Guy',
      type: 'standard',
    }));

    const optIn = optInRates.map((rate: any) => ({
      serviceLevel: rate.service_level,
      estimatedDelivery: rate.estimated_delivery,
      amount: rate.cost?.amount || rate.rate || 0,
      currency: rate.cost?.currency || 'ZAR',
      carrier: rate.carrier || 'Pargo',
      type: 'opt-in',
    }));

    res.json({
      success: true,
      rates: [...rates, ...optIn],
      parcelDetails: parcel,
    });

  } catch (err: any) {
    console.error('Shipping rates error:', err);
    res.status(500).json({ error: err.message || 'Failed to get rates' });
  }
}
