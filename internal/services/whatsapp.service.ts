/**
 * api/_services/whatsapp.service.ts — Twilio WhatsApp notifications
 *
 * Sends admin alerts on new orders via Twilio WhatsApp API.
 * Non-blocking — failures are logged but never crash the caller.
 *
 * Env vars:
 *   TWILIO_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_NUMBER    (e.g. whatsapp:+14155238886)
 *   ADMIN_WHATSAPP_NUMBER     (e.g. whatsapp:+27821234567)
 */

import type { Order } from '../_lib/types';
import { createLogger } from '../_logger';

const log = createLogger('whatsapp');

interface WhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send new-order alert to admin via Twilio WhatsApp.
 * Returns result — never throws.
 */
export async function sendOrderAlert(order: Order): Promise<WhatsAppResult> {
  const sid       = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from      = process.env.TWILIO_WHATSAPP_NUMBER;
  const to        = process.env.ADMIN_WHATSAPP_NUMBER;

  if (!sid || !authToken || !from || !to) {
    log.warn('send', 'WhatsApp not configured — skipping notification', {
      hasSid: !!sid, hasAuth: !!authToken, hasFrom: !!from, hasTo: !!to,
    });
    return { success: false, error: 'WhatsApp not configured — missing env vars' };
  }

  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const amountDisplay = `R${(order.total || 0).toFixed(2)}`;

  const message = [
    `🛒 *New Order: ${order.id}*`,
    ``,
    `📧 Email: ${order.email}`,
    `💰 Amount: ${amountDisplay}`,
    `📦 Items: ${itemCount}`,
    `👤 ${order.firstName} ${order.lastName}`,
    `📱 ${order.phone || 'No phone'}`,
    ``,
    `🚚 Delivery: ${order.deliveryMethod || 'standard'}`,
  ].join('\n');

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const auth = Buffer.from(`${sid}:${authToken}`).toString('base64');

    const body = new URLSearchParams({
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      To:   to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = await response.json();

    if (response.ok && data.sid) {
      log.info('sent', `WhatsApp alert sent for ${order.id}`, { messageSid: data.sid });
      return { success: true, messageSid: data.sid };
    }

    log.error('failed', `WhatsApp send failed: ${data.message || response.status}`, {
      orderId: order.id, status: response.status,
    });
    return { success: false, error: data.message || `HTTP ${response.status}` };

  } catch (err: any) {
    log.error('exception', `WhatsApp exception: ${err.message}`, { orderId: order.id });
    return { success: false, error: err.message };
  }
}