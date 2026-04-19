// api/shipping/index.ts
import express from 'express';
import { getRates, getPickupPoints } from '../../src/lib/shipping';

const router = express.Router();

// GET /api/shipping/rates
router.get('/rates', async (req, res) => {
  try {
    const { to = '', from = '', weight = '' } = req.query;
    const rates = await getRates({ to: String(to), from: String(from), weight: String(weight) });
    return res.json({ success: true, rates });
  } catch (err) {
    console.error('[shipping GET /rates] error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// GET /api/shipping/pickup-points
router.get('/pickup-points', async (req, res) => {
  try {
    const { lat = '', lng = '', radius = '10' } = req.query;
    const points = await getPickupPoints({ lat: String(lat), lng: String(lng), radius: String(radius) });
    return res.json({ success: true, points });
  } catch (err) {
    console.error('[shipping GET /pickup-points] error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /api/shipping/rates
router.post('/rates', express.json(), async (req, res) => {
  try {
    const { to = '', from = '', weight = '' } = req.body ?? {};
    const rates = await getRates({ to: String(to), from: String(from), weight: String(weight) });
    return res.json({ success: true, rates });
  } catch (err) {
    console.error('[shipping POST /rates] error', err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
