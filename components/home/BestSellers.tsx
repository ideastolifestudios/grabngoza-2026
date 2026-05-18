"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Product } from "@/lib/types";

// PLACEHOLDER — replace with Firestore data in Phase 2
const BEST_SELLERS: Product[] = [
  { id: "b1", name: "Cowboy Jeans", brand: "Minniepress", category: "BOTTOMS", price: 800, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80", slug: "cowboy-jeans", isNew: false, inStock: true },
  { id: "b2", name: "Street Jacket", brand: "Grab & Go", category: "APPAREL", price: 1500, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80", slug: "street-jacket", isNew: true, inStock: true },
  { id: "b3", name: "Core Sneakers", brand: "Grab & Go", category: "FOOTWEAR", price: 1800, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", slug: "core-sneakers", isNew: false, inStock: true },
  { id: "b4", name: "Chain Necklace", brand: "Grab & Go", category: "ACCESSORIES", price: 350, image: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&q=80", slug: "chain-necklace", isNew: true, inStock: true },
  { id: "b5", name: "Graphic Tee Vol.2", brand: "Grab & Go", category: "APPAREL", price: 550, image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80", slug: "graphic-tee-vol2", isNew: false, inStock: true },
  { id: "b6", name: "Premium Tracksuit", brand: "Grab & Go", category: "APPAREL", price: 2200, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80", slug: "premium-tracksuit", isNew: true, inStock: false },
];

export default function BestSellers() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-brand-surface">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <SectionTitle tag="Popular" title="BEST SELLERS" />
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 border border-brand-border flex items-center justify-center hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-200 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 border border-brand-border flex items-center justify-center hover:bg-brand-primary hover:border-brand-primary hover:text-white transition-all duration-200 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontally scrollable on mobile, grid on desktop */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0"
          style={{ scrollbarWidth: "none" }}
        >
          {BEST_SELLERS.map((product, i) => (
            <motion.div
              key={product.id}
              className="flex-shrink-0 w-[220px] lg:w-auto snap-start"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} compact />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}