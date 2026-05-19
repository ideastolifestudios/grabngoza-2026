"use client";
import { useState, useMemo } from "react";
import { use } from "react";
import CollectionHeader from "@/components/collections/CollectionHeader";
import FilterPanel, { type ActiveFilters } from "@/components/collections/FilterPanel";
import SortSelect, { type SortOption } from "@/components/collections/SortSelect";
import ProductGrid from "@/components/collections/ProductGrid";
import { useProducts } from "@/hooks/useProducts";
import { formatZAR } from "@/lib/utils";

const DEFAULT_FILTERS: ActiveFilters = {
  sizes: [],
  priceRange: null,
  inStockOnly: false,
};

export default function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sort, setSort] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  // Fetch from Firestore
  const { products: rawProducts, loading } = useProducts({
    category: slug,
    sortBy: sort,
  });

  // Client-side filtering (size, price range, in stock)
  const products = useMemo(() => {
    return rawProducts.filter((p) => {
      if (filters.inStockOnly && !p.inStock) return false;
      if (filters.sizes.length > 0 && p.sizes) {
        if (!filters.sizes.some((s) => p.sizes!.includes(s))) return false;
      }
      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        if (p.price < min || p.price > max) return false;
      }
      return true;
    });
  }, [rawProducts, filters]);

  return (
    <div>
      <CollectionHeader slug={slug} count={products.length} />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 lg:mb-8 pb-4 border-b border-brand-border">
          <p className="text-brand-muted text-[11px] tracking-wider uppercase hidden sm:block">
            {loading ? "Loading..." : `${products.length} ${products.length === 1 ? "Product" : "Products"}`}
          </p>
          <SortSelect value={sort} onChange={setSort} />
        </div>

        <div className="flex gap-10">
          {/* Filter sidebar */}
          <FilterPanel filters={filters} onChange={setFilters} />

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter button is rendered inside FilterPanel */}
            <ProductGrid products={products} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}