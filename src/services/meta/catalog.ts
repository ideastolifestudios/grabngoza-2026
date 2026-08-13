import { db } from '@/lib/firebase-admin'; // Ensure your Firebase Admin DB instance is imported
import { MetaCatalogProduct, MetaBatchItemRequest } from '@/types/meta';

/**
 * Transforms a Firestore Product Document into Meta Catalog schema
 */
export function formatFirestoreProductForMeta(docData: any, docId: string): MetaCatalogProduct {
  // Ensure pricing is formatted with 2 decimals and currency (e.g. "250.00 ZAR")
  const numericPrice = typeof docData.price === 'number' ? docData.price : parseFloat(docData.price || '0');
  const formattedPrice = `${numericPrice.toFixed(2)} ${docData.currency || 'ZAR'}`;

  // Fallback product URL and image URL handling
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://grabngoza-store.vercel.app';
  const productUrl = docData.url || `${baseUrl}/product/${docId}`;
  const imageUrl = docData.imageUrl || docData.images?.[0] || `${baseUrl}/placeholder.png`;

  return {
    id: docId,
    title: docData.name || docData.title || 'Untitled Product',
    description: docData.description || docData.title || 'No description provided.',
    availability: (docData.stock ?? docData.inventory ?? 1) > 0 ? 'in stock' : 'out of stock',
    condition: 'new',
    price: formattedPrice,
    link: productUrl,
    image_link: imageUrl,
    brand: docData.brand || 'Grab & Go',
    category: docData.category || undefined,
  };
}

/**
 * Fetches ALL active products from Firestore and syncs them to Meta in batches
 */
export async function bulkSyncFirestoreToMeta(): Promise<{
  success: boolean;
  totalSynced: number;
  batchesProcessed: number;
  errors: any[];
}> {
  try {
    // 1. Fetch products from Firestore
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      console.log('[MetaCatalogBulkSync] No products found in Firestore.');
      return { success: true, totalSynced: 0, batchesProcessed: 0, errors: [] };
    }

    // 2. Format all Firestore products into Meta Batch Requests
    const batchRequests: MetaBatchItemRequest[] = snapshot.docs.map((doc) => ({
      method: 'UPDATE', // 'UPDATE' creates or updates existing items
      data: formatFirestoreProductForMeta(doc.data(), doc.id),
    }));

    // 3. Split into chunks of 500 items (Meta supports up to 1000 per request)
    const BATCH_SIZE = 500;
    const chunks: MetaBatchItemRequest[][] = [];
    
    for (let i = 0; i < batchRequests.length; i += BATCH_SIZE) {
      chunks.push(batchRequests.slice(i, i + BATCH_SIZE));
    }

    const errors: any[] = [];
    let batchesProcessed = 0;

    // 4. Send each batch to Meta
    for (const chunk of chunks) {
      const result = await syncProductsToMetaCatalog(chunk);
      if (!result.success) {
        errors.push(result.error);
      } else {
        batchesProcessed++;
      }
    }

    return {
      success: errors.length === 0,
      totalSynced: snapshot.size,
      batchesProcessed,
      errors,
    };
  } catch (error: any) {
    console.error('[MetaCatalogBulkSync] Fatal error during catalog bulk sync:', error);
    return {
      success: false,
      totalSynced: 0,
      batchesProcessed: 0,
      errors: [error.message || 'Unknown error occurred.'],
    };
  }
}