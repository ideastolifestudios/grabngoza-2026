// @ts-nocheck
/**
 * api/support-chat.ts — Grab & Go AI Support Assistant
 * POST /api/support-chat  Body: { message, history? }  Returns: { reply, escalate? }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const SUPPORT_EMAIL = 'shopgrabngo.online@gmail.com';
const SUPPORT_WA = '+27 76 808 8390';

const SYSTEM_PROMPT = `You are the official AI support assistant for Grab & Go (shopgrabngo.co.za), a South African online fashion store.

## STORE INFO
- Website: https://shopgrabngo.co.za
- Support Email: ${SUPPORT_EMAIL} | WhatsApp: ${SUPPORT_WA}
- Location: Sandton, Johannesburg, South Africa | Currency: ZAR (R)

## PRODUCTS
Fashion clothing (Men, Women, Kids, Unisex), accessories, lifestyle products. Multiple brands. Variants (sizes/colors). Prices in Rand.

## PAYMENT
Yoco gateway. Visa, Mastercard, Apple Pay, Google Pay, SnapScan. PCI-DSS Level 1. Card details never stored.

## SHIPPING
- Standard (ShipLogic): 3-5 business days, from R99
- Express: 1-2 business days, from R149
- Bob Go Pickup (PUDO): 2-4 days, select at checkout
- Studio Pickup: Free, 10 Studio Lane, Sandton
- International Standard: 7-14 days, from R399
- International Express: 3-7 days, from R699
- Customs/duties: buyer's responsibility (DDU)
- Tracking via email + WhatsApp after dispatch

## RETURNS
14-day return window. Unworn, tags attached. Request via Account > My Orders > Request Return. Courier pickup or studio drop-off. Refund in 5-7 business days to original payment method.

## RULES
1. ONLY answer from knowledge above. NEVER invent policies/prices/timelines.
2. Short, clear, friendly responses. Max 1 emoji per message.
3. Guide toward checkout when relevant. Remove friction.
4. If you don't know: "I don't have that exact info. Email ${SUPPORT_EMAIL} or WhatsApp ${SUPPORT_WA} for help."
5. For order-specific questions, direct to Account > My Orders.
6. Never pushy, always helpful.`;

function err(res: VercelResponse, s: number, m: string) { return res.status(s).json({ error: m }); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return err(res, 405, 'Method not allowed');
  if (!API_KEY) return err(res, 503, 'AI not configured');

  const { message, history = [] } = req.body || {};
  if (!message) return err(res, 400, 'Missing message');

  const contents = [
    ...history.slice(-10).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  try {
    const r = await fetch(GEMINI_URL + '?key=' + API_KEY, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 500, topP: 0.8 },
      }),
    });
    const d = await r.json();
    if (!r.ok) return res.status(200).json({ reply: 'I\'m having trouble. Email ' + SUPPORT_EMAIL + ' for help.', escalate: true });
    const reply = d?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const escalate = reply.toLowerCase().includes('connect you') || reply.toLowerCase().includes(SUPPORT_EMAIL.toLowerCase());
    return res.status(200).json({ reply, escalate });
  } catch (e: any) {
    return res.status(200).json({ reply: 'Sorry, technical issue. Email ' + SUPPORT_EMAIL + '.', escalate: true });
  }
}
