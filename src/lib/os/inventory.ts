import * as admin from 'firebase-admin';

// Ensure Firebase is initialized if called standalone
function getDb() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: rawKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
  return admin.firestore();
}

export async function adjustInventory(
  productId: string,
  delta: number,
  reason: string = 'manual_adjustment',
  referenceId?: string
) {
  const db = getDb();
  const productRef = db.collection('products').doc(productId);
  const logRef = db.collection('inventory_logs').doc();

  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(productRef);
    
    if (!doc.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    const data = doc.data() || {};
    
    // FIX: Define previousStock before using it in the details object
    const previousStock = typeof data.stockQuantity === 'number' 
      ? data.stockQuantity 
      : Number(data.stock ?? 0);
      
    const newStock = previousStock + delta;

    transaction.update(productRef, {
      stockQuantity: newStock,
      updatedAt: new Date().toISOString()
    });

    transaction.set(logRef, {
      productId,
      reason,
      referenceId: referenceId || null,
      details: {
        previousStock, 
        adjustment: delta,
        newStock,
      },
      createdAt: new Date().toISOString()
    });

    return newStock;
  });
}
