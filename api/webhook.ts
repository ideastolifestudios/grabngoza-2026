/**
 * api/webhook.ts — Yoco Payment Webhook (SOP-compliant)
 *
 * SOP: Yoco webhook is the SOLE source of truth for order creation.
 * Flow: webhook hit → HMAC validate → idempotency check → store order → Zoho → WhatsApp
 *
 * All failures in non-critical paths (Zoho, WhatsApp) are caught and logged
 * but NEVER propagate back to Yoco. Yoco needs a 200 or it retries.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";
import { Redis } from "@upstash/redis";

// ─── Types ───────────────────────────────────────────────────────────────────

interface YocoWebhookPayload {
  id: string;
  type: string;
  createdDate: string;
  payload: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: {
      orderId?: string;
      email?: string;
      items?: string; // JSON-stringified
    };
  };
}

interface StoredOrder {
  id: string;
  email: string;
  items: unknown[];
  amount: number;
  paymentId: string;
  status: string;
  createdAt: string;
}

// ─── Redis client (lazy-init, safe for Vercel cold starts) ───────────────────

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis env vars not configured");
  }
  return new Redis({ url, token });
}

// ─── HMAC signature validation ────────────────────────────────────────────────

function validateYocoSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  try {
    const expected = createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");
    // timingSafeEqual prevents timing attacks
    const a = Buffer.from(signatureHeader, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Zoho CRM sync (non-blocking, non-fatal) ─────────────────────────────────

async function syncToZoho(order: StoredOrder): Promise<void> {
  const token = process.env.ZOHO_ACCESS_TOKEN;
  const domain = process.env.ZOHO_DOMAIN ?? "crm.zoho.com";
  if (!token) {
    console.warn("[ZOHO] ZOHO_ACCESS_TOKEN not set — skipping sync");
    return;
  }

  const contactPayload = {
    data: [
      {
        Email: order.email,
        Last_Name: order.email.split("@")[0],
        Lead_Source: "Grab n Go Online Store",
      },
    ],
    duplicate_check_fields: ["Email"],
  };

  const contactRes = await fetch(
    `https://${domain}/crm/v3/Contacts/upsert`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactPayload),
    }
  );
  if (!contactRes.ok) {
    const err = await contactRes.text();
    console.error("[ZOHO] Contact upsert failed:", contactRes.status, err);
  } else {
    console.log("[ZOHO] Contact synced:", order.email);
  }

  const dealPayload = {
    data: [
      {
        Deal_Name: `Order ${order.id}`,
        Amount: order.amount / 100,
        Stage: "Closed Won",
        Contact_Email: order.email,
        Description: `PaymentId: ${order.paymentId} | Items: ${order.items.length}`,
      },
    ],
  };

  const dealRes = await fetch(`https://${domain}/crm/v3/Deals`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dealPayload),
  });
  if (!dealRes.ok) {
    const err = await dealRes.text();
    console.error("[ZOHO] Deal creation failed:", dealRes.status, err);
  } else {
    console.log("[ZOHO] Deal created for order:", order.id);
  }
}

// ─── WhatsApp notification via Meta Cloud API (non-blocking, non-fatal) ───────

async function sendWhatsAppNotification(order: StoredOrder): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_ADMIN_NUMBER; // admin's number to notify
  if (!token || !phoneNumberId || !recipient) {
    console.warn(
      "[WHATSAPP] Missing env vars (WHATSAPP_ACCESS_TOKEN | WHATSAPP_PHONE_NUMBER_ID | WHATSAPP_ADMIN_NUMBER) — skipping"
    );
    return;
  }

  const message = [
    `🛍 *New Grab n Go Order*`,
    `Order ID: ${order.id}`,
    `Customer: ${order.email}`,
    `Amount: R${(order.amount / 100).toFixed(2)}`,
    `Items: ${order.items.length}`,
    `Payment Ref: ${order.paymentId}`,
    `Time: ${new Date(order.createdAt).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`,
  ].join("\n");

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[WHATSAPP] Send failed:", res.status, err);
  } else {
    console.log("[WHATSAPP] Notification sent for order:", order.id);
  }
}

// ─── Order persistence in Redis ───────────────────────────────────────────────

const ORDERS_KEY = "grabngoza:orders";

async function saveOrder(redis: Redis, order: StoredOrder): Promise<void> {
  // Store order as individual key AND push to list for sorted retrieval
  await redis.set(`grabngoza:order:${order.id}`, JSON.stringify(order));
  // lpush keeps newest first
  await redis.lpush(ORDERS_KEY, order.id);
}

// ─── Main webhook handler ─────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only accept POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("[WEBHOOK] Hit received");

  // ── 1. Read raw body for HMAC ──────────────────────────────────────────────
  const rawBody =
    typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // ── 2. HMAC signature validation ───────────────────────────────────────────
  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[WEBHOOK] YOCO_WEBHOOK_SECRET not set — rejecting");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const signature = req.headers["x-yoco-signature"] as string | undefined;
  if (!validateYocoSignature(rawBody, signature, webhookSecret)) {
    console.warn("[WEBHOOK] Invalid HMAC signature — rejected");
    return res.status(401).json({ error: "Invalid signature" });
  }
  console.log("[WEBHOOK] Signature verified");

  // ── 3. Parse payload ───────────────────────────────────────────────────────
  let body: YocoWebhookPayload;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    console.error("[WEBHOOK] Malformed JSON body");
    return res.status(400).json({ error: "Malformed payload" });
  }

  // Only handle successful payment events
  if (body.type !== "payment.succeeded" || body.payload?.status !== "successful") {
    console.log("[WEBHOOK] Non-success event — ignoring:", body.type, body.payload?.status);
    return res.status(200).json({ received: true });
  }

  const paymentId = body.payload.id;
  if (!paymentId) {
    console.error("[WEBHOOK] Missing payload.id");
    return res.status(400).json({ error: "Missing payment ID" });
  }

  // ── 4. Redis idempotency check ─────────────────────────────────────────────
  let redis: Redis;
  try {
    redis = getRedis();
  } catch (err) {
    console.error("[WEBHOOK] Redis init failed:", err);
    // Redis failure must not silently swallow the order — return 500 so Yoco retries
    return res.status(500).json({ error: "Storage unavailable" });
  }

  const idempotencyKey = `grabngoza:processed:${paymentId}`;
  const alreadyProcessed = await redis.get(idempotencyKey);
  if (alreadyProcessed) {
    console.log("[WEBHOOK] Duplicate blocked — paymentId:", paymentId);
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Mark as processing immediately (TTL 24h)
  await redis.set(idempotencyKey, "1", { ex: 86400 });
  console.log("[WEBHOOK] Payment verified — creating order for:", paymentId);

  // ── 5. Build and persist order ────────────────────────────────────────────
  const metadata = body.payload.metadata ?? {};
  let items: unknown[] = [];
  try {
    items = metadata.items ? JSON.parse(metadata.items) : [];
  } catch {
    items = [];
  }

  const order: StoredOrder = {
    id: metadata.orderId ?? `ORD-${Date.now()}`,
    email: metadata.email ?? "unknown@grabngoza.co.za",
    items,
    amount: body.payload.amount,
    paymentId,
    status: "paid",
    createdAt: new Date().toISOString(),
  };

  try {
    await saveOrder(redis, order);
    console.log("[WEBHOOK] Order created:", order.id);
  } catch (err) {
    console.error("[WEBHOOK] Order storage failed:", err);
    // Clear idempotency key so Yoco retry can re-attempt
    await redis.del(idempotencyKey).catch(() => {});
    return res.status(500).json({ error: "Order storage failed" });
  }

  // ── 6. Zoho CRM sync (non-fatal) ──────────────────────────────────────────
  try {
    await syncToZoho(order);
    console.log("[ZOHO] Sync complete");
  } catch (err) {
    console.error("[ZOHO] Sync error (non-fatal):", err);
  }

  // ── 7. WhatsApp notification (non-fatal) ──────────────────────────────────
  try {
    await sendWhatsAppNotification(order);
    console.log("[WHATSAPP] Notification sent");
  } catch (err) {
    console.error("[WHATSAPP] Notification error (non-fatal):", err);
  }

  return res.status(200).json({ received: true, orderId: order.id });
}

// ─── Vercel config: raw body required for HMAC ────────────────────────────────
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};