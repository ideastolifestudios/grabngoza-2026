#!/bin/bash
# ================================================================
# GRAB N GO ZA — Phase 1: Admin Route + Auth Guard
# Run from repo root after Phase 0 is complete and build is green
# Usage: bash phase-1-admin-auth.sh
# ================================================================
set -e
GREEN='\033[0;32m'; AMBER='\033[0;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo ""
echo "================================================================"
echo " G&G ZA — Phase 1: Admin Route + Auth Guard"
echo "================================================================"

if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
  echo "ERROR: Run from repo root (where package.json lives)"
  exit 1
fi

# ── STEP 1: Ensure @/* tsconfig path alias ──────────────────────
echo -e "${AMBER}[1/9] Checking tsconfig @/* path alias...${NC}"
node -e "
const fs = require('fs');
const c = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
if (!c.compilerOptions) c.compilerOptions = {};
if (!c.compilerOptions.baseUrl) c.compilerOptions.baseUrl = '.';
const p = c.compilerOptions.paths || {};
if (!p['@/*']) {
  p['@/*'] = ['./src/*'];
  c.compilerOptions.paths = p;
  fs.writeFileSync('tsconfig.json', JSON.stringify(c, null, 2));
  console.log('tsconfig.json: Added @/* -> ./src/*');
} else { console.log('tsconfig.json: @/* already set'); }
"

# ── STEP 2: Create directories ──────────────────────────────────
echo -e "${AMBER}[2/9] Creating directory structure...${NC}"
mkdir -p src/app/admin/'(auth)'/orders
mkdir -p src/app/admin/login
mkdir -p src/app/api/auth/session
mkdir -p src/lib
mkdir -p scripts

# ── STEP 3: Firebase Admin SDK singleton ────────────────────────
echo -e "${AMBER}[3/9] Creating src/lib/firebase-admin.ts...${NC}"
cat > src/lib/firebase-admin.ts << 'EOF'
/**
 * Firebase Admin SDK — Singleton
 * Server-only: auth verification, session cookies, custom claims.
 * NEVER import in client components or edge files.
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function createAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY not set');
  return initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey:  key.replace(/\\n/g, '\n'),
    }),
  });
}

const app = createAdminApp();
export const adminAuth      = getAuth(app);
export const adminDb        = getFirestore(app);
EOF

# ── STEP 4: Session API route ────────────────────────────────────
echo -e "${AMBER}[4/9] Creating /api/auth/session route...${NC}"
cat > src/app/api/auth/session/route.ts << 'EOF'
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
EOF

# ── STEP 5: Admin auth guard layout (inside route group) ─────────
echo -e "${AMBER}[5/9] Creating (auth)/layout.tsx — server-side auth guard...${NC}"
cat > "src/app/admin/(auth)/layout.tsx" << 'EOF'
/**
 * Admin Auth Guard — Server Component
 * Applies ONLY to pages inside (auth)/ route group.
 * /admin/login is OUTSIDE this group — no redirect loop possible.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const session = jar.get('gg_admin_session')?.value;
  if (!session) redirect('/admin/login');

  try {
    const claims = await adminAuth.verifySessionCookie(session, true);
    if (!claims.admin) redirect('/admin/login?error=unauthorized');
  } catch {
    redirect('/admin/login?error=session-expired');
  }

  return <div className="min-h-screen bg-[#0a0a0a] text-white">{children}</div>;
}
EOF

# ── STEP 6: Admin Hub page ──────────────────────────────────────
echo -e "${AMBER}[6/9] Creating admin hub + orders pages...${NC}"
cat > "src/app/admin/(auth)/page.tsx" << 'EOF'
import Link from 'next/link';

const SECTIONS = [
  { href: '/admin/orders',    label: 'Orders',      desc: 'Manage & dispatch',         color: '#f59e0b', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/products',  label: 'Products',    desc: 'Inventory & listings',        color: '#18A374', d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
  { href: '/admin/customers', label: 'Customers',   desc: 'Profiles & order history',    color: '#3b82f6', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/analytics', label: 'Analytics',   desc: 'Revenue & performance',       color: '#8b5cf6', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/admin/promotions',label: 'Promotions',  desc: 'Discounts & campaigns',       color: '#ec4899', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/admin/activity',  label: 'Activity Log',desc: 'Audit trail',                color: '#6b7280', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
] as const;

export default function AdminHub() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#18A374] mb-2 font-mono">
          Grab &amp; Go ZA
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white mb-1">Operations Hub</h1>
        <p className="text-[#555] text-xs font-mono mb-8">Select a section</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map(({ href, label, desc, color, d }) => (
            <Link key={href} href={href}
              className="block bg-[#111] border border-[#1e1e1e] rounded-lg p-5 hover:border-[#333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <svg className="w-4 h-4" fill="none" stroke={color} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={d}/>
                  </svg>
                </div>
                <span className="font-bold text-sm text-white">{label}</span>
              </div>
              <p className="text-[10px] text-[#555] font-mono">{desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 pt-5 border-t border-[#1e1e1e]">
          <a href="/api/auth/session"
            onClick={async (e) => {
              e.preventDefault();
              await fetch('/api/auth/session', { method: 'DELETE' });
              window.location.href = '/admin/login';
            }}
            className="text-[10px] font-mono tracking-[2px] uppercase text-[#444] hover:text-[#888]">
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}
EOF

cat > "src/app/admin/(auth)/orders/page.tsx" << 'EOF'
'use client';
import AdminDashboard from '../../../../components/admin/AdminDashboard';
export default function AdminOrdersPage() {
  return <AdminDashboard />;
}
EOF

# ── STEP 7: Admin login page ───────────────────────────────────
echo -e "${AMBER}[7/9] Creating /admin/login page...${NC}"
cat > src/app/admin/login/page.tsx << 'EOF'
'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';

function LoginForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push(sp.get('redirect') || '/admin');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(
        msg.includes('invalid-credential') || msg.includes('wrong-password')
          ? 'Invalid email or password'
          : msg.includes('not an admin')
          ? 'This account has no admin access'
          : msg
      );
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width:'100%', background:'#111', border:'1px solid #222', borderRadius:6,
    padding:'10px 14px', color:'#fff', fontSize:13, outline:'none'
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>

          <p style={{ fontSize:9, fontWeight:700, letterSpacing:3, textTransform:'uppercase',
            color:'#18A374', marginBottom:8, fontFamily:'monospace' }}>Grab &amp; Go ZA</p>

          <h1 style={{ fontSize:22, fontWeight:900, color:'#fff' }}>Admin Access</h1>
          <p style={{ color:'#444', fontSize:11, marginTop:4, fontFamily:'monospace' }}>
            Authorised personnel only
          </p>
        </div>
        {sp.get('error') === 'session-expired' && (
          <div style={{ background:'#78350f18', border:'1px solid #78350f', borderRadius:6,

            padding:'10px 14px', color:'#fcd34d', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
            Session expired — please sign in again

          </div>
        )}
        {sp.get('error') === 'unauthorized' && (

          <div style={{ background:'#7f1d1d18', border:'1px solid #7f1d1d', borderRadius:6,
            padding:'10px 14px', color:'#fca5a5', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
            This account does not have admin access
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom:16 }}>

            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:2,
              textTransform:'uppercase', color:'#555', marginBottom:6, fontFamily:'monospace' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" style={inp}/>
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:10, fontWeight:700, letterSpacing:2,
              textTransform:'uppercase', color:'#555', marginBottom:6, fontFamily:'monospace' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" style={inp}/>
          </div>
          {error && (
            <div style={{ background:'#7f1d1d18', border:'1px solid #7f1d1d', borderRadius:6,
              padding:'10px 14px', color:'#fca5a5', fontSize:11, marginBottom:16, fontFamily:'monospace' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width:'100%', background: loading ? '#1a3a2a' : '#18A374', border:'none',
            borderRadius:6, padding:12, color:'#fff', fontSize:11, fontWeight:800,
            letterSpacing:2, textTransform:'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily:'monospace'
          }}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:20, fontSize:10, color:'#333', fontFamily:'monospace' }}>
          Not an admin?{' '}
          <a href="/" style={{ color:'#18A374', textDecoration:'none' }}>Back to store</a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
EOF

# ── STEP 8: Update middleware.ts ──────────────────────────────
echo -e "${AMBER}[8/9] Updating middleware.ts...${NC}"
cat > middleware.ts << 'EOF'
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
EOF

# ── STEP 9: set-admin-claim.js ─────────────────────────────────
echo -e "${AMBER}[9/9] Creating scripts/set-admin-claim.js...${NC}"
cat > scripts/set-admin-claim.js << 'EOF'
#!/usr/bin/env node
/**
 * G&G ZA — Set Firebase Admin Custom Claim
 * Run ONCE per admin user to grant /admin access.
 *
 * Requires: .env.local with FIREBASE_ADMIN_* variables
 *
 * Grant:  node scripts/set-admin-claim.js grant  you@email.com
 * Revoke: node scripts/set-admin-claim.js revoke you@email.com
 */
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;
if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('\nERROR: Missing FIREBASE_ADMIN_* in .env.local\n'); process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert({
  projectId:   FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey:  FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
})});

const [,, action, email] = process.argv;
if (!['grant','revoke'].includes(action) || !email) {
  console.error('\nUsage:\n  node scripts/set-admin-claim.js grant  user@example.com\n  node scripts/set-admin-claim.js revoke user@example.com\n');
  process.exit(1);
}

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, action === 'grant' ? { admin: true } : {});
    console.log(`\n✓ Admin ${action === 'grant' ? 'GRANTED' : 'REVOKED'} for: ${email} (${user.uid})`);
    console.log('  ⚠  User must sign out and sign back in for change to take effect.\n');
    process.exit(0);
  } catch (e) { console.error(`\nError: ${e.message}\n`); process.exit(1); }
})();
EOF
echo -e "${GREEN}✓ All files created${NC}"

# ── COMMIT & PUSH ─────────────────────────────────────────────
git add -A
git commit -m "feat(admin): protected /admin route with Firebase session auth

Phase 1 - Admin Route + Auth Guard:
- src/lib/firebase-admin.ts              Firebase Admin singleton
- src/app/api/auth/session/route.ts      ID token → session cookie
- src/app/admin/(auth)/layout.tsx        Server auth guard (route group)
- src/app/admin/(auth)/page.tsx          Admin hub
- src/app/admin/(auth)/orders/page.tsx   Orders (wraps AdminDashboard)
- src/app/admin/login/page.tsx           Admin login (outside auth group)
- scripts/set-admin-claim.js             Grant/revoke admin claim
- middleware.ts                          /admin/* cookie check + IP fix
- tsconfig.json                          Added @/* path alias

Security: session cookies not Firestore role, custom claims not doc read,
route group prevents login redirect loop, x-real-ip not spoofable"
git push origin main

echo ""
echo -e "${GREEN}================================================================"
echo -e " Phase 1 pushed!"
echo "================================================================${NC}"
echo ""
echo -e "${AMBER}NEXT STEPS (do these BEFORE going to /admin):${NC}"
echo ""
echo -e "  1. Wait for Vercel build to complete (~3-5 min)"
echo ""
echo -e "  2. Grant your account admin access:"
echo -e "     ${BLUE}node scripts/set-admin-claim.js grant your@email.com${NC}"
echo ""
echo -e "  3. Sign OUT on the live site (clears old Firebase token)"
echo ""
echo -e "  4. Go to: https://shopgrabngo.co.za/admin/login"
echo -e "     Sign in with your admin email + password"
echo ""
echo -e "  5. If it redirected to /admin — Phase 1 is working!"
echo -e "     Tell Cody to start Phase 2 (Products)."
echo ""
