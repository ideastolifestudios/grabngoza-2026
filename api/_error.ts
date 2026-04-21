// api/_error.ts — Consistent error responses across all API endpoints
import type { VercelResponse } from '@vercel/node';

export function apiError(
  res: VercelResponse,
  status: number,
  message: string,
  details?: string
) {
  return res.status(status).json({
    ok: false,
    error: message,
    details: details || undefined,
    status,
  });
}
