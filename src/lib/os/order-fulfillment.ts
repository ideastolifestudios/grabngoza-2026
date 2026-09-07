import * as admin from 'firebase-admin';

// Initialize Admin SDK if needed
function getDb() {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.firestore();
}

interface OrderItem {
  productId: string;
  variantId?: string; // Optional: supports product variants (e.g., size/color)
  quantity: number;
}

/**
 * Atomically processes an order confirmation:
 * 1. Checks current stock for base product or specific variant.
 * 2. Deducts stock safely inside a Firestore transaction.
 * 3. Logs the inventory adjustment to an audit trail.
 * 4. Marks the order as paid and fulfilled for inventory.
 */
export async function fulfillOrderInventory(orderId: string, items: OrderItem[]) {
  const db = getDb();
  const orderRef = db.collection('orders').doc(orderId);
  const auditLogsRef = db.collection('inventory_audit_logs');

  return await db.runTransaction(async (transaction) => {
    // 1. Read order to ensure it hasn't already been fulfilled (Idempotency check)
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} does not exist.`);
    }

    const orderData = orderDoc.data();
    if (orderData?.inventoryDeducted === true) {
      console.warn(`[Inventory] Order ${orderId} inventory was already deducted. Skipping.`);
      return { success: true, alreadyDeducted: true };
    }

    // 2. Read all associated product documents upfront (Firestore transaction requirement)
    const productRefs = items.map(item => db.collection('products').doc(item.productId));
    const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

    const updates: { ref: admin.firestore.DocumentReference; data: any; logData: any }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productDoc = productDocs[i];

      if (!productDoc.exists) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const productData = productDoc.data() || {};
      
      // Handle Variant Stock vs Base Product Stock
      if (item.variantId && productData.variants) {
        const variantIndex = productData.variants.findIndex((v: any) => v.id === item.variantId);
        if (variantIndex === -1) {
          throw new Error(`Variant ${item.variantId} not found for product ${item.productId}`);
        }

        const variant = productData.variants[variantIndex];
        const currentStock = Number(variant.stockQuantity ?? variant.stock ?? 0);

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${productData.name} (Variant: ${variant.name}). Available: ${currentStock}, Requested: ${item.quantity}`);
        }

        const newStock = currentStock - item.quantity;
        productData.variants[variantIndex].stockQuantity = newStock;

        updates.push({
          ref: productDoc.ref,
          data: { variants: productData.variants, updatedAt: new Date().toISOString() },
          logData: {
            productId: item.productId,
            variantId: item.variantId,
            reason: 'order_fulfillment',
            referenceId: orderId,
            details: { previousStock: currentStock, deduction: item.quantity, newStock }
          }
        });

      } else {
        // Base Product Stock
        const currentStock = Number(productData.stockQuantity ?? productData.stock ?? 0);

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${productData.name || item.productId}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }

        const newStock = currentStock - item.quantity;

        updates.push({
          ref: productDoc.ref,
          data: { stockQuantity: newStock, updatedAt: new Date().toISOString() },
          logData: {
            productId: item.productId,
            reason: 'order_fulfillment',
            referenceId: orderId,
            details: { previousStock: currentStock, deduction: item.quantity, newStock }
          }
        });
      }
    }

    // 3. Execute all product updates and create audit log entries atomically
    for (const update of updates) {
      transaction.update(update.ref, update.data);
      const newAuditRef = auditLogsRef.doc();
      transaction.set(newAuditRef, {
        ...update.logData,
        createdAt: new Date().toISOString()
      });
    }

    // 4. Mark order as inventory deducted
    transaction.update(orderRef, {
      inventoryDeducted: true,
      status: 'processing',
      updatedAt: new Date().toISOString()
    });

    return { success: true, alreadyDeducted: false };
  });
}