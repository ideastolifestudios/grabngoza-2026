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
