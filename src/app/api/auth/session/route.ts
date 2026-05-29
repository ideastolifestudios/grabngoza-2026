/**
 * POST /api/auth/session  — Exchange Firebase ID token → session cookie
 * DELETE /api/auth/session — Clear session (logout)
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
const SESSION_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json() as { idToken?: string };
    if (!idToken) return NextResponse.json({ error: 'ID token required' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.admin) return NextResponse.json(
      { error: 'Access denied — not an admin account' }, { status: 403 });

    const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MS });
    const res = NextResponse.json({ success: true });
    res.cookies.set('gg_admin_session', cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MS / 1000,
      path: '/',
    });
    return res;
  } catch (e: unknown) {
    console.error('[session POST]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Auth failed' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('gg_admin_session', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 0, path: '/',
  });
  return res;
}
