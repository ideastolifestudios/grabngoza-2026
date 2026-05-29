import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({ redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'), analytics: true })
  : null;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin protection — lightweight cookie check only.
  // Full Firebase token verification happens in src/app/admin/(auth)/layout.tsx
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!req.cookies.get('gg_admin_session')?.value) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // API rate limiting — fixed IP detection (x-real-ip not spoofable)
  if (pathname.startsWith('/api') && ratelimit) {
    const ip = req.headers.get('x-real-ip')
      ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? '127.0.0.1';
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    if (!success) return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(reset),
      }});
  }

  return NextResponse.next();
}

export const config = { matcher: ['/api/:path*', '/admin/:path*'] };
