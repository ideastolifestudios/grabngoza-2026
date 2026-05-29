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
