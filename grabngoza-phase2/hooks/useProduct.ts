"use client";
import { useState, useEffect } from "react";
import { getProductBySlug } from "@/lib/firestore";
import type { Product } from "@/lib/types";

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);

    getProductBySlug(slug)
      .then((data) => { if (!cancelled) { setProduct(data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError("Product not found"); setLoading(false); } });

    return () => { cancelled = true; };
  }, [slug]);

  return { product, loading, error };
}