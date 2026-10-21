import { headers, cookies } from 'next/headers';
import ComingSoonGate from '@/components/ComingSoonGate';
import App from '@/App';

export default async function NextHomeGraftPage() {
  const headersList = await headers();
  const cookieStore = await cookies();

  const access = headersList.get('x-store-access');
  const launchMode = (process.env.STORE_LAUNCH_MODE || 'PRIVATE').toUpperCase();
  const adminCookie = cookieStore.get('gg_admin_session')?.value;
  const guestCookie = cookieStore.get('gg_guest_session')?.value;

  console.log('[DEBUG Page]', {
    accessHeader: access,
    launchMode,
    hasAdminCookie: Boolean(adminCookie),
    hasGuestCookie: Boolean(guestCookie)
  });

  // Force gate if mode is PRIVATE and neither session exists
  if (launchMode === 'PRIVATE' && !adminCookie && !guestCookie) {
    return <ComingSoonGate />;
  }

  if (access === 'gated') {
    return <ComingSoonGate />;
  }

  return <App />;
}
