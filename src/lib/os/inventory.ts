import { db } from '@/lib/firebase/admin'; // Firebase Admin SDK instance
import { ChannelSource } from '@/types/commerce-os';

export interface StockAdjustmentResult {
  success: boolean;
  productId: string;
  previousStock: number;
  newStock: number;
  error?: string;
}

/**
 * Atomically adjusts stock for a product across all sales channels.
 * Uses Firestore transactions to guarantee race-condition prevention.
 */
export async function adjustStockAtomic(
  productId: string,
  delta: number, // Negative for purchases (-1), positive for restocks (+10)
  source: ChannelSource,
  referenceId?: string
): Promise<StockAdjustmentResult> {
  const productRef = db.collection('products').doc(productId);

  try {
    return await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(productRef);

      if (!doc.exists) {
        throw new Error(`Product ${productId} not found.`);
      }

      const currentStock = doc.data()?.stockQuantity ?? 0;
      const newStock = currentStock + delta;

      // Prevent negative stock levels
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock for item ${productId}. Requested adjustment: ${delta}, Current stock: ${currentStock}`
        );
      }

      // Update inventory count and last modified metadata
      transaction.update(productRef, {
        stockQuantity: newStock,
        updatedAt: new Date().toISOString(),
      });

      // Record immutable inventory audit entry
      const auditRef = db.collection('audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        action: 'STOCK_ADJUSTMENT',
        targetId: productId,
        source,
        referenceId: referenceId || null,
        details: {
          previousStock,
          adjustment: delta,
          newStock,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[Inventory OS] Stock updated for ${productId} via ${source}: ${currentStock} -> ${newStock}`
      );

      return {
        success: true,
        productId,
        previousStock: currentStock,
        newStock,
      };
    });
  } catch (error: any) {
    console.error(`[Inventory OS Error] Failed to adjust stock for ${productId}:`, error.message);
    return {
      success: false,
      productId,
      previousStock: 0,
      newStock: 0,
      error: error.message,
    };
  }
}

/**
 * Bulk reserve stock for multi-item cart checkouts
 */
export async function reserveCartInventory(
  items: Array<{ productId: string; quantity: number }>,
  source: ChannelSource,
  orderId: string
): Promise<{ success: boolean; failedItems: string[] }> {
  const failedItems: string[] = [];

  for (const item of items) {
    const result = await adjustStockAtomic(item.productId, -item.quantity, source, orderId);
    if (!result.success) {
      failedItems.push(item.productId);
    }
  }

  return {
    success: failedItems.length === 0,
    failedItems,
  };
}
