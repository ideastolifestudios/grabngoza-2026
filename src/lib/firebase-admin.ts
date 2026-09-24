/**
 * Firebase Admin SDK — Singleton
 * Server-only: auth verification, session cookies, custom claims.
 * NEVER import in client components or edge files.
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app;
  }
  const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!key) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY not set');
  _app = initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey:  key.replace(/\\n/g, '\n'),
    }),
  });
  return _app;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop, receiver) {
    const instance = getAuth(getAdminApp());
    const val = Reflect.get(instance, prop, receiver);
    return typeof val === 'function' ? val.bind(instance) : val;
  }
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const instance = getFirestore(getAdminApp());
    const val = Reflect.get(instance, prop, receiver);
    return typeof val === 'function' ? val.bind(instance) : val;
  }
});
