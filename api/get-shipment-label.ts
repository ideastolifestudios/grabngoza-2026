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
    const { shipmentId, type } = req.query;

    if (!shipmentId) {
      return res.status(400).json({ error: 'shipmentId query parameter required' });
    }

    const labelType = type === 'sticker' ? 'sticker' : 'label';
    const response = await fetch(`${baseUrl}/shipments/${shipmentId}/${labelType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      return res.status(response.status).json({ error: 'Label fetch failed', details: errorData });
    }

    // Forward the PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=shipment-${shipmentId}-${labelType}.pdf`);
    
    const buffer = await response.buffer();
    res.send(buffer);

  } catch (err: any) {
    console.error('Get label error:', err);
    res.status(500).json({ error: err.message || 'Failed to get label' });
  }
}
