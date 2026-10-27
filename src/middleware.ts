import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, '10 s'), analytics: true })
  : null;

async function verifyGuestCookie(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const [val, sig] = token.split('.');
    if (!val || !sig) return false;
    const expiresAt = parseInt(val, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const secret = process.env.STORE_SESSION_SECRET || 'fallback_secret';
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedSig = await crypto.subtle.sign('HMAC', key, enc.encode(val));
    const b64Sig = btoa(String.fromCharCode(...new Uint8Array(expectedSig)));
    return b64Sig === sig;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const launchMode = (process.env.STORE_LAUNCH_MODE || 'PRIVATE').toUpperCase();

  // 1. Always allow webhooks, feeds, payment callbacks, guest auth API, and static assets
  if (
    pathname.startsWith('/api/feeds') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/yoco') ||
    pathname.startsWith('/api/auth/guest') ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // 2. Admin Protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!req.cookies.get('gg_admin_session')?.value) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 3. Maintenance Mode Check
  if (launchMode === 'MAINTENANCE') {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
      return new NextResponse(
        '<!DOCTYPE html><html><head><title>Under Maintenance</title><style>body{font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;}h1{color:#18A374;font-size:24px;}</style></head><body><div><h1>Scheduled Maintenance</h1><p>We are updating Grab & Go ZA. Please check back shortly.</p></div></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html' } }
      );
    }
  }

  const requestHeaders = new Headers(req.headers);

  // 4. Private Launch Mode Check
  if (launchMode === 'PRIVATE') {
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isAuthRoute = pathname.startsWith('/api/auth');

    if (!isAdminRoute && !isAuthRoute) {
      const adminCookie = req.cookies.get('gg_admin_session')?.value;
      const guestCookie = req.cookies.get('gg_guest_session')?.value;
      const isValidGuest = await verifyGuestCookie(guestCookie);

      if (!adminCookie && !isValidGuest) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Private store access required' }, { status: 401 });
        }
        if (pathname !== '/') {
          return NextResponse.redirect(new URL('/', req.url));
        }
        requestHeaders.set('x-store-access', 'gated');
      } else {
        requestHeaders.set('x-store-access', 'granted');
      }
    }
  } else {
    requestHeaders.set('x-store-access', 'granted');
  }

  // 5. API Rate limiting
  if (pathname.startsWith('/api') && ratelimit) {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
