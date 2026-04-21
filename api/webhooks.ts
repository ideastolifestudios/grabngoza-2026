/**
 * api/webhooks.ts — Webhook receiver (Vercel Serverless)
 *
 * Single endpoint handling webhooks from multiple sources.
 * Routes via ?source= query parameter.
 *
 * URLs to register with external services:
 *   Zoho:      POST https://yoursite.vercel.app/api/webhooks?source=zoho
 *   Yoco:      POST https://yoursite.vercel.app/api/webhooks?source=yoco
 *   ShipLogic: POST https://yoursite.vercel.app/api/webhooks?source=shiplogic
 *
 * Security: each source has its own token check via WEBHOOK_SECRET_<SOURCE>.
 * Set these in Vercel env vars when you register the webhook.
 *
 * Function count: 7/12 on Hobby plan.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Security ───────────────────────────────────────────────────

function verifyWebhookToken(source: string, req: VercelRequest): boolean {
  const expectedToken = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];

  // If no secret is set for this source, allow in dev (log warning)
  if (!expectedToken) {
    console.warn(`[webhooks/${source}] ⚠️ No WEBHOOK_SECRET_${source.toUpperCase()} set — accepting all requests (set this in production!)`);
    return true;
  }

  // Check Authorization header
  const authHeader = req.headers.authorization || '';
  if (authHeader === `Bearer ${expectedToken}`) return true;

  // Check X-Webhook-Token header (Zoho style)
  const tokenHeader = req.headers['x-webhook-token'] || req.headers['x-hook-secret'] || '';
  if (tokenHeader === expectedToken) return true;

  // Check query param fallback
  if (req.query.token === expectedToken) return true;

  return false;
}

// ─── Logger ─────────────────────────────────────────────────────

function logWebhook(source: string, event: string, data?: any) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [webhook/${source}] ${event}`, data ? JSON.stringify(data).slice(0, 500) : '');
}

// ─── Handler ────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS (some webhook senders do preflight)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Token, X-Hook-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const source = (req.query.source as string || '').toLowerCase();
  if (!source) {
    return res.status(400).json({ error: 'Missing ?source= parameter. Use: zoho|yoco|shiplogic' });
  }

  // ── Security check ────────────────────────────────────────────
  if (!verifyWebhookToken(source, req)) {
    logWebhook(source, 'REJECTED — invalid token');
    return res.status(401).json({ error: 'Invalid webhook token' });
  }

  const body = req.body || {};
  logWebhook(source, 'Received', { keys: Object.keys(body) });

  try {
    switch (source) {

      // ══════════════════════════════════════════════════════════
      // ZOHO — inventory updates, order status, CRM changes
      // ══════════════════════════════════════════════════════════
      case 'zoho': {
        const eventType = body.event_type || body.module || body.action || 'unknown';
        const module    = body.module || body.resource || '';
        const recordId  = body.id || body.record_id || body.data?.id || '';

        logWebhook('zoho', `Event: ${eventType}`, { module, recordId });

        // Route by event type
        switch (eventType) {
          case 'SalesOrders.update':
          case 'salesorder_update': {
            const status = body.data?.status || body.status || '';
            logWebhook('zoho', `Sales order ${recordId} → ${status}`);
            // TODO: Update local order status based on Zoho SO status
            // await orderService.updateOrder(localOrderId, { status: mapZohoStatus(status) });
            break;
          }

          case 'Items.update':
          case 'item_update': {
            const itemId = body.data?.item_id || recordId;
            const stock  = body.data?.stock_on_hand ?? body.stock_on_hand;
            logWebhook('zoho', `Item ${itemId} stock → ${stock}`);
            // TODO: Update local product stock from Zoho
            // await productService.updateStock(localProductId, '_default', stock);
            break;
          }

          case 'Contacts.create':
          case 'Contacts.update': {
            logWebhook('zoho', `CRM contact ${eventType}: ${recordId}`);
            // TODO: Sync CRM contact changes back to local customers
            break;
          }

          default:
            logWebhook('zoho', `Unhandled event: ${eventType}`, body);
        }

        return res.status(200).json({ received: true, source: 'zoho', event: eventType });
      }

      // ══════════════════════════════════════════════════════════
      // YOCO — payment confirmations
      // ══════════════════════════════════════════════════════════
      case 'yoco': {
        const eventType = body.type || body.event || 'unknown';
        const paymentId = body.payload?.id || body.id || '';
        const status    = body.payload?.status || body.status || '';
        const metadata  = body.payload?.metadata || body.metadata || {};

        logWebhook('yoco', `${eventType}: payment=${paymentId} status=${status}`, { metadata });

        if (eventType === 'payment.succeeded' || status === 'succeeded') {
          const orderId = metadata.orderId;
          if (orderId) {
            logWebhook('yoco', `Payment confirmed for order ${orderId} → confirming...`);
            // TODO: Uncomment when ready to auto-confirm
            // const result = await orderService.confirmOrder(orderId, paymentId);
            // logWebhook('yoco', `Order ${orderId} confirmed`, { crm: result?.crm.success, zoho: result?.zoho.success });
          }
        }

        if (eventType === 'payment.failed' || status === 'failed') {
          const orderId = metadata.orderId;
          if (orderId) {
            logWebhook('yoco', `Payment failed for order ${orderId} → cancelling...`);
            // TODO: Uncomment when ready
            // await orderService.cancelOrder(orderId, `Yoco payment failed: ${paymentId}`);
          }
        }

        return res.status(200).json({ received: true, source: 'yoco', event: eventType });
      }

      // ══════════════════════════════════════════════════════════
      // SHIPLOGIC — delivery status updates
      // ══════════════════════════════════════════════════════════
      case 'shiplogic': {
        const trackingRef = body.tracking_reference || body.trackingNumber || '';
        const status      = body.status || body.event || '';
        const shipmentId  = body.shipment_id || body.id || '';

        logWebhook('shiplogic', `Shipment ${shipmentId} tracking=${trackingRef} → ${status}`);

        // TODO: Update order delivery status
        // Map ShipLogic statuses: collected, in_transit, out_for_delivery, delivered
        // if (status === 'delivered') await orderService.updateOrder(orderId, { status: 'delivered' });

        return res.status(200).json({ received: true, source: 'shiplogic', status });
      }

      // ══════════════════════════════════════════════════════════
      // UNKNOWN SOURCE
      // ══════════════════════════════════════════════════════════
      default:
        logWebhook(source, 'Unknown source — logging raw body', body);
        return res.status(200).json({ received: true, source, warning: 'Unknown source — logged only' });
    }
  } catch (err: any) {
    console.error(`[webhooks/${source}] ERROR:`, err);
    // Always return 200 to webhooks (prevent retries on our errors)
    return res.status(200).json({ received: true, error: err.message });
  }
}
