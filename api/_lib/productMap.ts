/**
 * api/_lib/productMap.ts — Product ID mapping (Local ↔ Zoho)
 *
 * Central mapping of your Firestore product IDs to Zoho Inventory item IDs.
 * Used by zohoInventoryService.ts when creating sales orders.
 *
 * To find Zoho item_ids:
 *   GET /api/store-api?resource=zoho&action=items
 *
 * To update: edit the MAP below, commit, and deploy.
 * For dynamic mapping: load from Firestore at runtime (see loadFromFirestore).
 */

// ─── Static mapping (edit this) ─────────────────────────────────
//
// Format:  'your-local-product-id': 'zoho-inventory-item-id'
//
// Find your Zoho item IDs via:
//   GET /api/store-api?resource=zoho&action=items
//
// Or in Zoho Inventory → Items → click item → URL contains item_id

const STATIC_MAP: Record<string, string> = {
  // ──────────────── EXAMPLE MAPPINGS ────────────────
  // Uncomment and replace with your actual IDs:
  //
  // 'black-hoodie':         '1234567890001',
  // 'white-tee-v2':         '1234567890002',
  // 'cap-standard':         '1234567890003',
  // 'joggers-grey':         '1234567890004',
  // 'sneakers-limited':     '1234567890005',
};

// ─── Runtime overrides (from API or Firestore) ──────────────────
const runtimeOverrides: Record<string, string> = {};

// ─── API ────────────────────────────────────────────────────────

/** Get Zoho item_id for a local product. Returns null if unmapped. */
export function getZohoItemId(localProductId: string): string | null {
  return runtimeOverrides[localProductId] || STATIC_MAP[localProductId] || null;
}

/** Get local product ID for a Zoho item (reverse lookup). */
export function getLocalProductId(zohoItemId: string): string | null {
  // Check overrides first
  for (const [local, zoho] of Object.entries(runtimeOverrides)) {
    if (zoho === zohoItemId) return local;
  }
  for (const [local, zoho] of Object.entries(STATIC_MAP)) {
    if (zoho === zohoItemId) return local;
  }
  return null;
}

/** Register a mapping at runtime (survives until cold start). */
export function registerMapping(localId: string, zohoItemId: string): void {
  runtimeOverrides[localId] = zohoItemId;
}

/** Register multiple mappings at once. */
export function registerMappings(mappings: Record<string, string>): void {
  Object.assign(runtimeOverrides, mappings);
}

/** Get all current mappings (static + runtime). */
export function getAllMappings(): Record<string, string> {
  return { ...STATIC_MAP, ...runtimeOverrides };
}

/** Get mapping stats. */
export function getMappingStats(): {
  total: number;
  static: number;
  runtime: number;
  unmappedExample: string;
} {
  return {
    total: Object.keys(getAllMappings()).length,
    static: Object.keys(STATIC_MAP).length,
    runtime: Object.keys(runtimeOverrides).length,
    unmappedExample: 'Products without a mapping are sent to Zoho by name with [Unmapped] tag',
  };
}

/**
 * Load mappings from Firestore (call at startup or on-demand).
 * Expects a collection 'product_mappings' with docs: { localId, zohoItemId }
 *
 * Usage:
 *   import { db } from './firebase.ts';
 *   await loadFromFirestore(db);
 */
export async function loadFromFirestore(db: any): Promise<number> {
  try {
    const snap = await db.collection('product_mappings').get();
    let count = 0;
    snap.forEach((doc: any) => {
      const data = doc.data();
      if (data.localId && data.zohoItemId) {
        runtimeOverrides[data.localId] = data.zohoItemId;
        count++;
      }
    });
    console.log(`[productMap] Loaded ${count} mappings from Firestore`);
    return count;
  } catch (err: any) {
    console.error('[productMap] Failed to load from Firestore:', err.message);
    return 0;
  }
}
