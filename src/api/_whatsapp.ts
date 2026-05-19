// internal/services/whatsapp.service.ts
// Sends WhatsApp order notifications (admin + customer)

const WA_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN    || '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const ADMIN_PHONE = process.env.WHATSAPP_ADMIN_NUMBER           || '';

function normalisePhone(raw: string): string {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('0')) p = '27' + p.substring(1);
  return p;
}

async function sendWA(to: string, text: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID || !to) return;
  await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to:   normalisePhone(to),
      type: 'text',
      text: { body: text },
    }),
  }).catch(e => console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', service: '[WA]', event: 'send_failed', error: e.message })));
}

export interface OrderNotification {
  orderId:    string;
  email:      string;
  firstName?: string;
  phone?:     string;
  amount:     number;          // in cents
  items?:     Array<{ name: string; quantity: number }>;
}

export async function sendOrderNotification(order: OrderNotification): Promise<void> {
  const ref   = order.orderId.slice(-8).toUpperCase();
  const rand  = (order.amount / 100).toFixed(2);
  const items = (order.items || []).map(i => `  • ${i.quantity}x ${i.name}`).join('\n');

  // ── Admin alert ──
  if (ADMIN_PHONE) {
    const adminMsg = [
      `🛒 *NEW ORDER #${ref}*`,
      `Customer: ${order.firstName || order.email}`,
      `Amount: R${rand}`,
      items ? `\nItems:\n${items}` : '',
      `\n📧 ${order.email}`,
    ].filter(Boolean).join('\n');
    await sendWA(ADMIN_PHONE, adminMsg);
  }

  // ── Customer confirmation ──
  if (order.phone) {
    const custMsg = [
      `Hi ${order.firstName || 'there'}! 🎉`,
      `Your Grab & Go order *#${ref}* is confirmed.`,
      `Total: *R${rand}*`,
      items ? `\nYour items:\n${items}` : '',
      `\nYou'll get a tracking update once dispatched. Thanks for shopping with us! 🛍️`,
    ].filter(Boolean).join('\n');
    await sendWA(order.phone, custMsg);
  }
}
