/**
 * api/_lib/response.ts — Consistent JSON response helpers
 */
import type { VercelResponse } from '@vercel/node';

export function success(res: VercelResponse, data: any, status: number = 200) {
  return res.status(status).json({ ok: true, ...data });
}

export function error(res: VercelResponse, status: number, message: string, details?: string) {
  return res.status(status).json({
    ok: false,
    error: message,
    details: details || undefined,
    status,
  });
}
