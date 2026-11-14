// cleanup.mjs
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (adminProjectId && adminClientEmail && adminPrivateKey) {
    initializeApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: adminPrivateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim());
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'grab-go-za' });
  }
}

const db = getFirestore();

async function deleteCollection(collectionName, batchSize = 400) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    return resolve();
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    console.log(`Deleting doc ID: ${doc.id} from collection`);
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function runCleanup() {
  console.log('🧹 Starting Firestore test data cleanup...');

  console.log('\n--- Cleaning "orders" collection ---');
  await deleteCollection('orders');

  console.log('\n--- Cleaning "notifications_outbox" collection ---');
  await deleteCollection('notifications_outbox');

  console.log('\n✨ Cleanup complete! Firestore test orders and outbox queues are cleared.');
  process.exit(0);
}

runCleanup().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});