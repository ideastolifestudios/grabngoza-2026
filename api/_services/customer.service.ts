/**
 * api/_services/customer.service.ts — Customer CRUD (Firestore)
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Customer } from '../_lib/types';

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
const col = db.collection('customers');        }),
      });
    }
  }
} catch (e: any) {
  console.error('[firebase-init]', e.message);
}
const db = getFirestore();
const col = db.collection('customers');

export async function listCustomers(limit = 50): Promise<Customer[]> {
  const snap = await col.orderBy('createdAt', 'desc').limit(limit).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const doc = await col.doc(id).get();
  return doc.exists ? ({ id: doc.id, ...doc.data() } as Customer) : null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const snap = await col.where('email', '==', email).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function createCustomer(data: any): Promise<Customer> {
  const now = new Date().toISOString();
  const record: Omit<Customer, 'id'> = {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone || '',
    orders: [],
    createdAt: now,
  };
  const ref = await col.add(record);
  return { id: ref.id, ...record };
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | null> {
  const doc = await col.doc(id).get();
  if (!doc.exists) return null;
  const { id: _, ...updates } = data as any;
  await col.doc(id).update(updates);
  const updated = await col.doc(id).get();
  return { id: updated.id, ...updated.data() } as Customer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const doc = await col.doc(id).get();
  if (!doc.exists) return false;
  await col.doc(id).delete();
  return true;
}
