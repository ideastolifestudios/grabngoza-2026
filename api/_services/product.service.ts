/**
 * api/_services/product.service.ts — Product CRUD (Firestore)
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Product } from '../_lib/types';

try {
  if (!getApps().length) {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (saKey) {
      initializeApp({ credential: cert(JSON.parse(saKey)), projectId: process.env.FIREBASE_PROJECT_ID });
    } else {
      initializeApp({
        credential: cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey:  (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
  }
} catch (e: any) {
  console.error('[firebase-init]', e.message);
}
const db = getFirestore();
const col = db.collection('products');

export async function listProducts(limit = 100, category?: string): Promise<Product[]> {
  let q: FirebaseFirestore.Query = col.where('active', '!=', false);
  if (category) q = q.where('categories', 'array-contains', category);
  const snap = await q.limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await col.doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Product) : null;
}

export async function createProduct(data: any): Promise<Product> {
  const now = new Date().toISOString();
  const record = {
    name: data.name,
    price: data.price,
    description: data.description || '',
    image: data.image || '',
    images: data.images || [],
    brand: data.brand || '',
    categories: data.categories || [],
    variants: data.variants || [],
    stock: data.stock ?? 0,
    variantStock: data.variantStock || {},
    active: true,
    featured: data.featured || false,
    createdAt: now,
  };
  const ref = await col.add(record);
  return { id: ref.id, ...record } as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product | null> {
  const doc = await col.doc(id).get();
  if (!doc.exists) return null;
  const { id: _, ...updates } = data as any;
  await col.doc(id).update(updates);
  const updated = await col.doc(id).get();
  return { id: updated.id, ...updated.data() } as Product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const doc = await col.doc(id).get();
  if (!doc.exists) return false;
  await col.doc(id).update({ active: false }); // Soft delete
  return true;
}

export async function updateStock(id: string, stockKey: string, quantity: number): Promise<boolean> {
  const doc = await col.doc(id).get();
  if (!doc.exists) return false;
  if (stockKey && stockKey !== 'stock') {
    await col.doc(id).update({ [`variantStock.${stockKey}`]: quantity });
  } else {
    await col.doc(id).update({ stock: quantity });
  }
  return true;
}
