import type { NextApiRequest, NextApiResponse } from 'next';
import { getRates, getPickupPoints } from '../../../src/lib/shipping';

type Data = { success: boolean; [k: string]: any };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
    if (!action) return res.status(400).json({ success: false, error: 'Missing action' });

    // Normalize method and action mapping
    const method = req.method ?? 'GET';

    if (action === 'rates' && method === 'GET') {
      const { to, weight, from } = req.query;
      const rates = await getRates({ to: String(to ?? ''), from: String(from ?? ''), weight: String(weight ?? '') });
      return res.status(200).json({ success: true, rates });
    }

    if (action === 'pickup-points' && method === 'GET') {
      const { lat, lng, radius } = req.query;
      const points = await getPickupPoints({ lat: String(lat ?? ''), lng: String(lng ?? ''), radius: String(radius ?? '10') });
      return res.status(200).json({ success: true, points });
    }

    // Example: allow POST for rates calculation if you need body input
    if (action === 'rates' && method === 'POST') {
      const { to, from, weight } = req.body;
      const rates = await getRates({ to, from, weight });
      return res.status(200).json({ success: true, rates });
    }

    return res.status(404).json({ success: false, error: 'Action not found' });
  } catch (err) {
    console.error('shipping router error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
