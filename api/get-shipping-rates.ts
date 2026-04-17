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

    const totalWeight = items.reduce((sum: number, item: any) => {
      const weight = item.weight || 0.5;
      return sum + (weight * (item.quantity || 1));
    }, 0);

    const totalItems = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    const parcel = {
      submitted_length_cm: Math.min(10 + (totalItems * 5), 60),
      submitted_width_cm: Math.min(10 + (totalItems * 3), 40),
      submitted_height_cm: Math.min(5 + (totalItems * 3), 30),
      submitted_weight_kg: Math.max(totalWeight, 0.5),
    };

    const collectionAddress = {
      type: 'business',
      company: 'IDEAS TO LIFE STUDIOS',
      street_address: process.env.BUSINESS_ADDRESS || '1104 Tugela Street',
      local_area: process.env.BUSINESS_CITY || 'Klipfontein View',
      city: process.env.BUSINESS_CITY || 'Midrand',
      zone: process.env.BUSINESS_PROVINCE || 'Gauteng',
      country: 'ZA',
      code: process.env.BUSINESS_POSTAL_CODE || '1685',
    };

    const destinationAddress = {
      type: 'residential',
      company: '',
      street_address: deliveryAddress.address,
      local_area: deliveryAddress.city,
      city: deliveryAddress.city,
      zone: deliveryAddress.province,
      country: deliveryAddress.country || 'ZA',
      code: deliveryAddress.postalCode,
    };

    const ratesResponse = await fetch(`${baseUrl}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection_address: collectionAddress,
        destination_address: destinationAddress,
        parcels: [parcel],
      }),
    });

    const ratesText = await ratesResponse.text();
    let ratesData: any;
    try { ratesData = JSON.parse(ratesText); } catch { ratesData = { error: ratesText }; }

    if (!ratesResponse.ok) {
      console.error('ShipLogic rates error:', ratesText);
      return res.status(500).json({ error: 'Failed to get shipping rates', details: ratesData });
    }

    let optInRates: any[] = [];
    try {
      const optInResponse = await fetch(`${baseUrl}/rates/opt-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_address: collectionAddress,
          destination_address: destinationAddress,
          parcels: [parcel],
        }),
      });

      if (optInResponse.ok) {
        const optInText = await optInResponse.text();
        try {
          const optInData = JSON.parse(optInText);
          optInRates = optInData.rates || [];
        } catch {}
      }
    } catch (err) {
      console.warn('Opt-in rates failed:', err);
    }

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