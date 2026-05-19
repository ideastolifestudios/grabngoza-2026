"use client";
import { useState, useEffect } from "react";
import { getProducts, type ProductFilters } from "@/lib/firestore";
import type { Product } from "@/lib/types";

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProducts(filters)
      .then((data) => { if (!cancelled) { setProducts(data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError("Failed to load products"); setLoading(false); console.error(e); } });

    return () => { cancelled = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, loading, error };
}