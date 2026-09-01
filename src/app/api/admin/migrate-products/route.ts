import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Force standard Node.js runtime and max Vercel timeout (5 minutes)
export const runtime = 'nodejs';
export const maxDuration = 300;

function getDb() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return admin.firestore();
}

export async function GET() {
  console.log('[Commerce OS Migration] Scanning Firestore products collection...');

  try {
    const db = getDb();
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No product records found to migrate.' });
    }

    let batch = db.batch();
    let batchCount = 0;
    let totalMigrated = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      const price = typeof data.price === 'number' ? data.price : parseFloat(data.price || '0');
      const stockQuantity = typeof data.stockQuantity === 'number' ? data.stockQuantity : Number(data.stock ?? 0);

      const standardizedProduct = {
        id: doc.id,
        sku: data.sku || `GNG-${doc.id.substring(0, 6).toUpperCase()}`,
        title: data.title || data.name || 'Untitled Product',
        description: data.description || '',
        price,
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
        stockQuantity: isNaN(stockQuantity) ? 0 : stockQuantity,
        category: data.category || 'Apparel',
        images: Array.isArray(data.images) ? data.images : (data.imageUrl ? [data.imageUrl] : []),
        channels: {
          meta: {
            synced: data.channels?.meta?.synced ?? (data.syncedToMeta || false),
            metaItemId: data.channels?.meta?.metaItemId || data.metaCatalogItemId || null,
            lastSyncedAt: data.channels?.meta?.lastSyncedAt || data.lastMetaSync || null,
          },
          google: {
            synced: data.channels?.google?.synced ?? (data.syncedToGoogle || false),
            googleItemId: data.channels?.google?.googleItemId || null,
            lastSyncedAt: data.channels?.google?.lastSyncedAt || null,
          },
        },
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      batch.set(doc.ref, standardizedProduct, { merge: true });
      batchCount++;
      totalMigrated++;

      if (batchCount === 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${totalMigrated} products to OSProduct schema.`,
    });
  } catch (error: any) {
    console.error('[Commerce OS Migration Failed]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
