/**
 * internal/lib/logger.ts
 *
 * Lightweight structured logger for Vercel serverless functions.
 * All methods accept exactly (message: string, data?: unknown).
 * This signature is TS-safe — no TS2554 "expected 1-2, got 3" possible.
 *
 * Usage:
 *   import { logger } from "../internal/lib/logger";
 *   logger.info("Order created", { orderId });
 *   logger.error("Redis failed", err);
 *   logger.warn("Zoho skipped — token missing");
 */

type LogData = unknown;

function write(level: string, prefix: string, message: string, data?: LogData): void {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level} ${prefix} ${message}`;
  if (data !== undefined) {
    if (level === "ERROR") {
      console.error(base, data);
    } else if (level === "WARN") {
      console.warn(base, data);
    } else {
      console.log(base, data);
    }
  } else {
    if (level === "ERROR") {
      console.error(base);
    } else if (level === "WARN") {
      console.warn(base);
    } else {
      console.log(base);
    }
  }
}

export function createLogger(prefix: string) {
  return {
    info: (message: string, data?: LogData) => write("INFO ", prefix, message, data),
    warn: (message: string, data?: LogData) => write("WARN ", prefix, message, data),
    error: (message: string, data?: LogData) => write("ERROR", prefix, message, data),
  };
}

/** Default root logger (no prefix) */
export const logger = createLogger("");
