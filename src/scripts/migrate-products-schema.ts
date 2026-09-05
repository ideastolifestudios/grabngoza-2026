import { db } from '../lib/firebase/admin.ts';

async function migrateProductsToOSSchema() {
  console.log('[Commerce OS Migration] Scanning Firestore products collection...');

  try {
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      console.log('[Commerce OS Migration] No product records found to migrate.');
      return;
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
        console.log(`[Commerce OS Migration] Batch of ${batchCount} products committed.`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`[Commerce OS Migration] Final batch of ${batchCount} products committed.`);
    }

    console.log(`[Commerce OS Migration] Successfully updated ${totalMigrated} products to OSProduct schema.`);
  } catch (error: any) {
    console.error('[Commerce OS Migration Failed]:', error);
  }
}

migrateProductsToOSSchema();
