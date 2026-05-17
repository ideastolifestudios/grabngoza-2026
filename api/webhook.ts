/**
 * api/webhook.ts — Yoco Payment Webhook (SOP-compliant)
 *
 * Flow: webhook hit → HMAC → idempotency → order → Zoho → WhatsApp
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";
import { Redis } from "@upstash/redis";

// 1. Updated Import to point to the new internal folder structure
import { sendOrderNotification } from "../internal/services/whatsapp.service";
import { createLogger } from "../internal/lib/logger";

// 2. Initialize the logger with the specific prefix
const log = createLogger("[WEBHOOK]");

// ─── Redis Init (Required for Idempotency) ───────────────────────────────────
// Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are in Vercel
const redis = Redis.fromEnv();

// ─── Types ───────────────────────────────────────────────────────────────────
// ... rest of your code ...
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
      items?: string;
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

// ─── Redis ───────────────────────────────────────────────────────────────────

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis env vars not configured");
  return new Redis({ url, token });
}

// ─── HMAC validation ─────────────────────────────────────────────────────────

function validateSignature(rawBody: string, header: string | undefined, secret: string): boolean {
  if (!header) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const a = Buffer.from(header.replace(/^sha256=/, ""), "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Zoho sync ───────────────────────────────────────────────────────────────

async function syncToZoho(order: StoredOrder): Promise<void> {
  const token = process.env.ZOHO_ACCESS_TOKEN;
  const domain = process.env.ZOHO_DOMAIN ?? "crm.zoho.com";
  if (!token) {
    log.warn("ZOHO_ACCESS_TOKEN not set — skipping");
    return;
  }

  const upsertRes = await fetch(`https://${domain}/crm/v3/Contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{ Email: order.email, Last_Name: order.email.split("@")[0], Lead_Source: "Grab n Go" }],
      duplicate_check_fields: ["Email"],
    }),
  });

  if (!upsertRes.ok) {
    log.error("Contact upsert failed", await upsertRes.text().catch(() => upsertRes.status));
  } else {
    log.info("Contact synced", order.email);
  }

  const dealRes = await fetch(`https://${domain}/crm/v3/Deals`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Deal_Name: `Order ${order.id}`,
        Amount: order.amount / 100,
        Stage: "Closed Won",
        Description: `PaymentId: ${order.paymentId}`,
      }],
    }),
  });

  if (!dealRes.ok) {
    log.error("Deal creation failed", await dealRes.text().catch(() => dealRes.status));
  } else {
    log.info("Deal created", order.id);
  }
}

// ─── Order storage ────────────────────────────────────────────────────────────

async function saveOrder(redis: Redis, order: StoredOrder): Promise<void> {
  await redis.set(`grabngoza:order:${order.id}`, JSON.stringify(order));
  await redis.lpush("grabngoza:orders", order.id);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  log.info("Hit received");

  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // 1. HMAC validation
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) {
    log.error("YOCO_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const sig = req.headers["x-yoco-signature"] as string | undefined;
  if (!validateSignature(rawBody, sig, secret)) {
    log.warn("Invalid signature — rejected");
    return res.status(401).json({ error: "Invalid signature" });
  }
  log.info("Signature verified");

  // 2. Parse body
  let body: YocoWebhookPayload;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    log.error("Malformed JSON body");
    return res.status(400).json({ error: "Malformed payload" });
  }

  // 3. Only handle successful payments
  if (body.type !== "payment.succeeded" || body.payload?.status !== "successful") {
    log.info("Non-success event — ignoring", { type: body.type, status: body.payload?.status });
    return res.status(200).json({ received: true });
  }

  const paymentId = body.payload.id;
  if (!paymentId) {
    log.error("Missing payload.id");
    return res.status(400).json({ error: "Missing payment ID" });
  }

  // 4. Redis idempotency
  let redis: Redis;
  try {
    redis = getRedis();
  } catch (err) {
    log.error("Redis init failed", err);
    return res.status(500).json({ error: "Storage unavailable" });
  }

  const idempKey = `grabngoza:processed:${paymentId}`;
  const already = await redis.get(idempKey);
  if (already) {
    log.info("Duplicate blocked", paymentId);
    return res.status(200).json({ received: true, duplicate: true });
  }

  await redis.set(idempKey, "1", { ex: 86400 });
  log.info("Payment verified — creating order", paymentId);

  // 5. Build order
  const meta = body.payload.metadata ?? {};
  let items: unknown[] = [];
  try { items = meta.items ? JSON.parse(meta.items) : []; } catch { items = []; }

  const order: StoredOrder = {
    id: meta.orderId ?? `ORD-${Date.now()}`,
    email: meta.email ?? "unknown@grabngoza.co.za",
    items,
    amount: body.payload.amount,
    paymentId,
    status: "paid",
    createdAt: new Date().toISOString(),
  };

  // 6. Persist order
  try {
    await saveOrder(redis, order);
    log.info("Order created", order.id);
  } catch (err) {
    log.error("Order storage failed", err);
    await redis.del(idempKey).catch(() => {});
    return res.status(500).json({ error: "Order storage failed" });
  }

  // 7. Zoho (non-fatal)
  try {
    await syncToZoho(order);
  } catch (err) {
    log.error("Zoho sync error (non-fatal)", err);
  }

  // 8. WhatsApp (non-fatal)
  try {
    await sendOrderNotification({
      orderId: order.id,
      email: order.email,
      amount: order.amount,
      createdAt: order.createdAt,
    });
  } catch (err) {
    log.error("WhatsApp error (non-fatal)", err);
  }

  return res.status(200).json({ received: true, orderId: order.id });
}

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};