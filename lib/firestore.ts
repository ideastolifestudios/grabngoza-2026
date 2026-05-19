import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Product } from "./types";

export type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

export interface ProductFilters {
  category?: string; // Firestore category value e.g. "APPAREL"
  inStockOnly?: boolean;
  sortBy?: SortOption;
  limitTo?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  apparel: "APPAREL",
  accessories: "ACCESSORIES",
  footwear: "FOOTWEAR",
  bundles: "BUNDLES",
  bottoms: "BOTTOMS",
  "new-arrivals": "", // handled via isNew flag client-side
  all: "",
};

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const ref = collection(db, "products");
  const constraints: QueryConstraint[] = [];

  // Category filter
  const cat = filters.category ? CATEGORY_MAP[filters.category.toLowerCase()] : undefined;
  if (cat) constraints.push(where("category", "==", cat));

  // In stock filter (combine with above — may require composite index)
  if (filters.inStockOnly) constraints.push(where("inStock", "==", true));

  // Sort  — use createdAt as default; others require composite indexes
  switch (filters.sortBy) {
    case "price-asc":
      constraints.push(orderBy("price", "asc"));
      break;
    case "price-desc":
      constraints.push(orderBy("price", "desc"));
      break;
    case "name-asc":
      constraints.push(orderBy("name", "asc"));
      break;
    default:
      constraints.push(orderBy("createdAt", "desc"));
  }

  if (filters.limitTo) constraints.push(limit(filters.limitTo));

  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const ref = collection(db, "products");
  const q = query(ref, where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Product;
}

export async function getRelatedProducts(
  category: string,
  excludeId: string,
  limitTo = 4
): Promise<Product[]> {
  const ref = collection(db, "products");
  const q = query(ref, where("category", "==", category), where("inStock", "==", true), limit(limitTo + 2));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Product))
    .filter((p) => p.id !== excludeId)
    .slice(0, limitTo);
}

export async function getFeaturedProducts(limitTo = 8): Promise<Product[]> {
  const ref = collection(db, "products");
  const q = query(ref, where("isNew", "==", true), where("inStock", "==", true), orderBy("createdAt", "desc"), limit(limitTo));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}