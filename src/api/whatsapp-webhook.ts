// @ts-nocheck
/**
 * api/whatsapp-webhook.ts — WhatsApp AI Support Bot
 * GET  — Meta webhook verification
 * POST — Incoming messages → AI reply → send back via WhatsApp
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_VERIFY = process.env.WHATSAPP_VERIFY_TOKEN || 'grabngoza_verify_2026';
const BASE_URL = process.env.BASE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://shopgrabngo.co.za');

async function sendReply(to: string, text: string) {
  let phone = to.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '27' + phone.substring(1);
  await fetch('https://graph.facebook.com/v21.0/' + WA_PHONE_ID + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: text } }),
  });
}

async function markRead(id: string) {
  await fetch('https://graph.facebook.com/v21.0/' + WA_PHONE_ID + '/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: id }),
  }).catch(() => {});
}

async function getAIReply(message: string): Promise<string> {
  try {
    const r = await fetch(BASE_URL + '/api/support-chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const d = await r.json();
    return d.reply || 'Sorry, please email shopgrabngo.online@gmail.com for help.';
  } catch { return 'Hi! Technical issue. Email shopgrabngo.online@gmail.com or try again shortly.'; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;
    if (mode === 'subscribe' && token === WA_VERIFY) return res.status(200).send(challenge);
    return res.status(403).send('Forbidden');
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  res.status(200).json({ status: 'ok' }); // Respond immediately (Meta requires)

  try {
    const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== 'text') return;
    const from = msg.from;
    await markRead(msg.id);
    const reply = await getAIReply(msg.text?.body || '');
    await sendReply(from, reply);
    console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'whatsapp-bot', from, reply: reply.substring(0, 80) }));
  } catch (e: any) {
    console.error('[whatsapp-webhook]', e.message);
  }
}
