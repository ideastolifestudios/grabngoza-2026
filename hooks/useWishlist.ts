"use client";
import { useState, useEffect, useCallback } from "react";
import { getWishlist, addToWishlist, removeFromWishlist, isWishlisted } from "@/lib/wishlist";

export function useWishlist(productId?: string) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    const list = getWishlist();
    setWishlist(list);
    if (productId) setWishlisted(list.includes(productId));
  }, [productId]);

  const toggle = useCallback(() => {
    if (!productId) return;
    if (isWishlisted(productId)) {
      const updated = removeFromWishlist(productId);
      setWishlist(updated);
      setWishlisted(false);
    } else {
      const updated = addToWishlist(productId);
      setWishlist(updated);
      setWishlisted(true);
    }
  }, [productId]);

  return { wishlist, wishlisted, toggle };
}