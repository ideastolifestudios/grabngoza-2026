/**
 * middleware/verifyYocoWebhook.ts
 * Verifies Yoco webhook HMAC-SHA256 signatures.
 *
 * Yoco sends: X-Yoco-Signature: sha256=<hex>
 * We recompute it from the raw body and compare with timing-safe equality.
 *
 * IMPORTANT: Mount this BEFORE express.json() on the webhook route so the
 * raw body is preserved. See server.ts usage example below.
 *
 * Usage in server.ts:
 *   import { rawBodyMiddleware, verifyYocoWebhook } from './middleware/verifyYocoWebhook';
 *   app.post('/api/yoco-webhook',
 *     rawBodyMiddleware,        // captures raw bytes
 *     verifyYocoWebhook,        // verifies HMAC
 *     express.json(),           // now safe to parse
 *     webhookHandler
 *   );
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extends Express Request with rawBody field
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * Captures the raw request body as a Buffer before any body parsing.
 * Must be mounted BEFORE express.json() on webhook routes.
 */
export function rawBodyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  req.on('error', next);
}

/**
 * Verifies the Yoco HMAC-SHA256 webhook signature.
 * Returns 401 on any mismatch or missing signature.
 */
export function verifyYocoWebhook(req: Request, res: Response, next: NextFunction): void {
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] YOCO_WEBHOOK_SECRET is not set — rejecting all webhook calls');
    res.status(500).json({ success: false, error: 'Webhook secret not configured' });
    return;
  }

  const signature = req.headers['x-yoco-signature'] as string | undefined;

  if (!signature) {
    console.warn('[Webhook] Missing X-Yoco-Signature header');
    res.status(401).json({ success: false, error: 'Missing webhook signature' });
    return;
  }

  if (!req.rawBody) {
    console.error('[Webhook] rawBody not captured — ensure rawBodyMiddleware is mounted first');
    res.status(500).json({ success: false, error: 'Internal configuration error' });
    return;
  }

  // Yoco sends "sha256=<hex>" format
  const [algo, provided] = signature.split('=');
  if (algo !== 'sha256' || !provided) {
    console.warn('[Webhook] Malformed signature format:', signature);
    res.status(401).json({ success: false, error: 'Invalid signature format' });
    return;
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.rawBody)
    .digest('hex');

  // Timing-safe comparison prevents timing attacks
  try {
    const providedBuf = Buffer.from(provided, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      console.warn('[Webhook] Signature mismatch — possible spoofed request');
      res.status(401).json({ success: false, error: 'Invalid webhook signature' });
      return;
    }
  } catch {
    console.error('[Webhook] Signature comparison failed');
    res.status(401).json({ success: false, error: 'Signature verification failed' });
    return;
  }

  console.log('[Webhook] Signature verified ✓');
  next();
}
