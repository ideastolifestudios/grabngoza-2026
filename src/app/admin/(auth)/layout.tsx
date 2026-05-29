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
