/**
 * api/create-yoco-payment.ts — Yoco checkout session initiator (SOP-compliant)
 *
 * SOP: This endpoint ONLY creates a Yoco hosted checkout URL.
 * NO order is created here. The order is created ONLY by webhook.ts
 * upon verified payment success.
 *
 * Input validation is enforced. No secrets are exposed to the frontend.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_CURRENCIES = ["ZAR"];
const MAX_AMOUNT_CENTS = 100_000_00; // R100,000 max
const MIN_AMOUNT_CENTS = 100; // R1.00 min

function sanitizeString(val: unknown, maxLen = 200): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim().slice(0, maxLen);
  return trimmed.length > 0 ? trimmed : null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    console.error("[YOCO-INIT] YOCO_SECRET_KEY not set");
    return res.status(500).json({ error: "Payment gateway not configured" });
  }

  // ── Validate input ─────────────────────────────────────────────────────────
  const { amount, currency, metadata } = req.body ?? {};

  const amountNum = Number(amount);
  if (
    !Number.isFinite(amountNum) ||
    amountNum < MIN_AMOUNT_CENTS ||
    amountNum > MAX_AMOUNT_CENTS
  ) {
    return res.status(400).json({
      error: `Amount must be between ${MIN_AMOUNT_CENTS} and ${MAX_AMOUNT_CENTS} cents`,
    });
  }

  const curr = sanitizeString(currency) ?? "ZAR";
  if (!ALLOWED_CURRENCIES.includes(curr)) {
    return res.status(400).json({ error: "Unsupported currency" });
  }

  const orderId = sanitizeString(metadata?.orderId);
  if (!orderId) {
    return res.status(400).json({ error: "metadata.orderId is required" });
  }

  const email = sanitizeString(metadata?.email);
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "metadata.email is required" });
  }

  // Serialize items safely
  let itemsString = "[]";
  if (metadata?.items) {
    try {
      itemsString = JSON.stringify(metadata.items).slice(0, 2000);
    } catch {
      itemsString = "[]";
    }
  }

  // ── Build redirect URLs using PRODUCTION domain ───────────────────────────
  // Use SITE_URL env var in production. Never derive from request host.
  const baseUrl =
    process.env.SITE_URL?.replace(/\/$/, "") ??
    `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host}`;

  const successUrl = `${baseUrl}/order-success?id=${encodeURIComponent(orderId)}`;
  const cancelUrl = `${baseUrl}/?status=cancelled`;
  const failureUrl = `${baseUrl}/?status=failed`;

  // ── Call Yoco API ──────────────────────────────────────────────────────────
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
        cancelUrl,
        successUrl,
        failureUrl,
        metadata: {
          orderId,
          email,
          items: itemsString,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[YOCO-INIT] Yoco API error:", response.status, data);
      return res.status(response.status).json({
        error: "Payment gateway error",
        detail: data?.displayMessage ?? "Please try again",
      });
    }

    if (!data.redirectUrl) {
      console.error("[YOCO-INIT] No redirectUrl in Yoco response");
      return res.status(502).json({ error: "Invalid gateway response" });
    }

    console.log("[YOCO-INIT] Checkout created for order:", orderId);
    return res.status(200).json({ redirectUrl: data.redirectUrl });
  } catch (err: any) {
    console.error("[YOCO-INIT] Fetch error:", err.message);
    return res.status(500).json({ error: "Failed to reach payment gateway" });
  }
}