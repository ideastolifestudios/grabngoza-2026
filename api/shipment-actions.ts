import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  const apiKey = process.env.SHIPLOGIC_API_KEY;
  const baseUrl = process.env.SHIPLOGIC_BASE_URL || 'https://api.shiplogic.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'ShipLogic not configured' });
  }

  const { action } = req.query;

  try {
    // GET /api/shipment-actions?action=label&shipmentId=xxx&type=label|sticker
    if (action === 'label' && req.method === 'GET') {
      const { shipmentId, type } = req.query;
      if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });

      const labelType = type === 'sticker' ? 'sticker' : 'label';
      const response = await fetch(`${baseUrl}/shipments/${shipmentId}/${labelType}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        return res.status(response.status).json({ error: 'Label fetch failed', details: errorData });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=shipment-${shipmentId}-${labelType}.pdf`);
      const buffer = await response.buffer();
      return res.send(buffer);
    }

    // POST /api/shipment-actions?action=cancel  body: { shipmentId }
    if (action === 'cancel' && req.method === 'POST') {
      const { shipmentId } = req.body;
      if (!shipmentId) return res.status(400).json({ error: 'shipmentId required' });

      const response = await fetch(`${baseUrl}/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json() as any;
      if (!response.ok) return res.status(response.status).json({ error: 'Cancel failed', details: data });

      return res.json({ success: true, message: data.message || 'Shipment cancelled' });
    }

    return res.status(400).json({ error: 'Invalid action. Use ?action=label or ?action=cancel' });

  } catch (err: any) {
    console.error('Shipment action error:', err);
    res.status(500).json({ error: err.message || 'Action failed' });
  }
}