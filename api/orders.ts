/**
 * api/orders.ts — Admin order retrieval
 * GET /api/orders          — list, newest first (requires x-admin-key header)
 * GET /api/orders?id=XYZ   — single order lookup
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";
import { createLogger } from "./_logger";

const log = createLogger("[ORDERS]");

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis env vars not configured");
  return new Redis({ url, token });
}

function authOk(req: VercelRequest, res: VercelResponse): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) { res.status(503).json({ error: "Admin access not configured" }); return false; }
  if (req.headers["x-admin-key"] !== key) { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "no-store");

  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method ?? "")) {
    return res.status(405).json({ error: "Orders are created exclusively via the Yoco webhook" });
  }
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!authOk(req, res)) return;

  let redis: Redis;
  try { redis = getRedis(); }
  catch (err) { log.error("Redis init failed", err); return res.status(503).json({ error: "Storage unavailable" }); }

  const { id, limit = "50" } = req.query;

  if (id && typeof id === "string") {
    try {
      const raw = await redis.get(`grabngoza:order:${id}`);
      if (!raw) return res.status(404).json({ error: "Order not found" });
      const order = typeof raw === "string" ? JSON.parse(raw) : raw;
      return res.status(200).json({ order });
    } catch (err) {
      log.error("Single lookup error", err);
      return res.status(500).json({ error: "Failed to retrieve order" });
    }
  }

  const take = Math.min(parseInt(limit as string) || 50, 200);
  try {
    const ids = await redis.lrange("grabngoza:orders", 0, take - 1);
    if (!ids || ids.length === 0) return res.status(200).json({ orders: [], total: 0 });

    const raws = await redis.mget<string[]>(...ids.map((i) => `grabngoza:order:${i}`));
    const orders = raws
      .filter(Boolean)
      .map((r) => { try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; } })
      .filter(Boolean);

    return res.status(200).json({ orders, total: orders.length });
  } catch (err) {
    log.error("List error", err);
    return res.status(500).json({ error: "Failed to retrieve orders" });
  }
}