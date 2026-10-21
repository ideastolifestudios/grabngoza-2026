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
    const previousStock = typeof data?.stockQuantity === 'number' 
      ? data?.stockQuantity 
      : Number(data?.stock ?? 0);
      
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



import { getFirestore } from 'firebase/firestore';
const db = getFirestore(); // Ensure matches your project export // or your firebase admin/client instance
import { doc, runTransaction, collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Atomically validates and decrements stock for ordered items to prevent race conditions.
 */
export async function validateAndDecrementStock(items: { id: string; quantity: number; variant?: string }[]) {
  if (!db) throw new Error('Database connection not initialized.');

  return await runTransaction(db, async (transaction) => {
    const productReads = [];

    // 1. Read all current stock levels first (Firestore transaction requirement)
    for (const item of items) {
      const productRef = doc(db, 'products', item.id);
      productReads.push({ item, productRef, productSnap: await transaction.get(productRef) });
    }

    // 2. Validate stock availability across all items
    for (const { item, productSnap } of productReads) {
      if (!productSnap.exists()) {
        throw new Error(`Product ${item.id} not found in inventory.`);
      }

      const data = productSnap.data();
      const currentStock = data?.stock ?? data?.inventory ?? 0;

      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${data?.name || item.id}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
    }

    // 3. Perform atomic decrements
    for (const { item, productRef, productSnap } of productReads) {
      const data = productSnap.data();
      const currentStock = data?.stock ?? data?.inventory ?? 0;
      const newStock = currentStock - item.quantity;

      transaction.update(productRef, {
        stock: newStock,
        updatedAt: new Date().toISOString(),
        status: newStock <= 0 ? 'out_of_stock' : newStock <= 5 ? 'low_stock' : data?.status || 'active'
      });
    }

    return { success: true, message: 'Stock validated and successfully locked.' };
  });
}
