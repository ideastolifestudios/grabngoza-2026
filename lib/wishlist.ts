const WISHLIST_KEY = "grabngoza_wishlist";

export function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]"); } catch { return []; }
}

export function addToWishlist(productId: string): string[] {
  const list = getWishlist();
  if (!list.includes(productId)) {
    const updated = [...list, productId];
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
    return updated;
  }
  return list;
}

export function removeFromWishlist(productId: string): string[] {
  const updated = getWishlist().filter(id => id !== productId);
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
  return updated;
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId);
}