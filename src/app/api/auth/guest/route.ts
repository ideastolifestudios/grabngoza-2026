import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const guestRateLimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
      prefix: 'ratelimit:guest_auth',
    })
  : null;

async function signToken(val: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(val));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${val}.${b64Sig}`;
}

export async function POST(req: NextRequest) {
  try {
    if (guestRateLimit) {
      const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
      const { success } = await guestRateLimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const { code } = body;
    const validCode = process.env.GUEST_ACCESS_CODE || 'cbr2026launch';

    if (!code || code !== validCode) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const secret = process.env.STORE_SESSION_SECRET || 'fallback_secret';
    const signedToken = await signToken(String(expiresAt), secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'gg_guest_session',
      value: signedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(expiresAt),
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
