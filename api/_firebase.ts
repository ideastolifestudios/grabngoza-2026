// api/_firebase.ts — Shared Firebase Admin initialization
// Import `db` from this file in every API route that needs Firestore.
// This ensures one consistent init pattern and catches missing env vars early.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey   = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('[firebase] Missing one of: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  throw new Error('Firebase Admin credentials not configured');
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export const db = getFirestore();
