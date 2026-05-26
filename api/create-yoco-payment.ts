// @ts-nocheck
/**
 * api/create-yoco-payment.ts — Yoco checkout session initiator
 * Imports logger from ../internal/lib/logger
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createLogger } from "./_logger";

const log = createLogger("[YOCO-INIT]");

const MIN_CENTS = 100;
const MAX_CENTS = 10_000_000;

function sanitize(val: unknown, max = 200): string | null {
  if (typeof val !== "string") return null;
  const s = val.trim().slice(0, max);
  return s.length > 0 ? s : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    log.error("YOCO_SECRET_KEY not set");
    return res.status(500).json({ error: "Payment gateway not configured" });
  }

  const { amount, currency, metadata } = req.body ?? {};

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < MIN_CENTS || amountNum > MAX_CENTS) {
    return res.status(400).json({ error: `Amount must be ${MIN_CENTS}–${MAX_CENTS} cents` });
  }

  const curr = sanitize(currency) ?? "ZAR";
  if (curr !== "ZAR") return res.status(400).json({ error: "Only ZAR supported" });

  const orderId = sanitize(metadata?.orderId);
  if (!orderId) return res.status(400).json({ error: "metadata.orderId required" });

  const email = sanitize(metadata?.email);
  if (!email || !email.includes("@")) return res.status(400).json({ error: "metadata.email required" });

  let itemsString = "[]";
  try { itemsString = JSON.stringify(metadata?.items ?? []).slice(0, 2000); } catch { /* keep default */ }

  const baseUrl = (process.env.SITE_URL ?? `https://${req.headers.host}`).replace(/\/$/, "");

  try {
    const response = await fetch("https://online.yoco.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amountNum),
        currency: curr,
        cancelUrl: `${baseUrl}/?status=cancelled`,
        successUrl: `${baseUrl}/order-success?id=${encodeURIComponent(orderId)}`,
        failureUrl: `${baseUrl}/?status=failed`,
        metadata: { orderId, email, items: itemsString },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      log.error("Yoco API error", { status: response.status, data });
      return res.status(response.status).json({ error: "Payment gateway error" });
    }
    if (!data.redirectUrl) {
      log.error("No redirectUrl in Yoco response");
      return res.status(502).json({ error: "Invalid gateway response" });
    }

    log.info("Checkout created", orderId);
    return res.status(200).json({ redirectUrl: data.redirectUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Fetch error", msg);
    return res.status(500).json({ error: "Failed to reach payment gateway" });
  }
}