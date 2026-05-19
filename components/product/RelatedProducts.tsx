"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRelatedProducts } from "@/lib/firestore";
import type { Product } from "@/lib/types";

interface Props {
  category: string;
  excludeId: string;
}

export default function RelatedProducts({ category, excludeId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRelatedProducts(category, excludeId, 4)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [category, excludeId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12 lg:py-16 border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-2">More Like This</p>
        <h2 className="text-brand-text text-[28px] font-extrabold uppercase tracking-tight mb-8">YOU MAY ALSO LIKE</h2>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1,2,3,4].map(i => <div key={i}><Skeleton className="aspect-[3/4]" /><Skeleton className="h-3 w-24 mt-3" /><Skeleton className="h-4 w-full mt-1" /></div>)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </motion.div>
        )}
      </div>
    </section>
  );
}