import { adminDb as db } from '@/lib/firebase-admin';

interface MetaBatchItem {
  method: 'CREATE' | 'UPDATE';
  retailer_id: string;
  data: {
    id: string;
    title: string;
    description: string;
    availability: 'in stock' | 'out of stock';
    condition: 'new';
    price: string;
    link: string;
    image_link: string;
    brand: string;
  };
}

export async function syncProductsToMetaCatalog(products: any[]) {
  const catalogId = process.env.META_CATALOG_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!catalogId || !accessToken) {
    throw new Error('Missing META_CATALOG_ID or META_CONVERSIONS_API_ACCESS_TOKEN environment variables.');
  }

  const items: MetaBatchItem[] = products.map((p) => {
    const priceValue = typeof p.price === 'number' ? p.price.toFixed(2) : parseFloat(p.price || '0').toFixed(2);
    const inStock = p.inStock ?? (p.stock ? p.stock > 0 : true);

    return {
      method: 'CREATE',
      retailer_id: p.id,
      data: {
        id: p.id,
        title: p.title || p.name || 'Product',
        description: p.description || p.title || 'Product details',
        availability: inStock ? 'in stock' : 'out of stock',
        condition: 'new',
        price: `${priceValue} ZAR`,
        link: p.url || `https://grabngoza-store.vercel.app/product/${p.id}`,
        image_link: p.imageUrl || p.images?.[0] || 'https://grabngoza-store.vercel.app/placeholder.png',
        brand: p.brand || 'Grab & Go',
      },
    };
  });

  // Meta Graph API allows up to 1000 items per batch
  const batchSize = 1000;
  let totalSynced = 0;
  let batchesProcessed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const response = await fetch(`https://graph.facebook.com/v20.0/${catalogId}/items_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
        item_type: 'PRODUCT_ITEM',
        requests: batch,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || `Meta API request failed with status ${response.status}`);
    }

    totalSynced += batch.length;
    batchesProcessed++;
  }

  return {
    success: true,
    totalSynced,
    batchesProcessed,
    errors: [],
  };
}

export async function bulkSyncFirestoreToMeta() {
  try {
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      return {
        success: true,
        totalSynced: 0,
        batchesProcessed: 0,
        errors: ['No products found in Firestore collection "products".'],
      };
    }

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return await syncProductsToMetaCatalog(products);
  } catch (error: any) {
    console.error('Meta Catalog Service Error:', error);
    return {
      success: false,
      totalSynced: 0,
      batchesProcessed: 0,
      errors: [error.message || 'Unknown sync error'],
    };
  }
}
