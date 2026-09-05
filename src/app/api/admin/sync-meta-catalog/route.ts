import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 300;

function getDb() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error(`Missing Firebase Admin environment variables.`);
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin.firestore();
}

export async function GET() {
  try {
    const catalogId = process.env.META_CATALOG_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const db = getDb();
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No products found to sync.' });
    }

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    let metaResponseData = null;

    if (catalogId && accessToken) {
      const requests = products.map((product) => ({
        method: 'UPDATE',
        retailer_id: product.sku || product.id,
        data: {
          title: product.title,
          description: product.description || product.title,
          availability: (product.stockQuantity ?? 0) > 0 ? 'in stock' : 'out of stock',
          condition: 'new',
          price: `${Math.round((product.price || 0) * 100)} ZAR`,
          link: `https://shopgrabngo.co.za/products/${product.id}`,
          image_link: product.images?.[0] || '',
          brand: 'Grab & Go',
        },
      }));

      const metaRes = await fetch(`https://graph.facebook.com/v20.0/${catalogId}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ requests }),
      });

      metaResponseData = await metaRes.json();
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        'channels.meta.synced': true,
        'channels.meta.lastSyncedAt': now,
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      syncedCount: products.length,
      metaApiStatus: catalogId ? 'submitted' : 'bypassed_missing_credentials',
      metaResponse: metaResponseData,
    });
  } catch (error: any) {
    console.error('[Meta Sync Failed]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
