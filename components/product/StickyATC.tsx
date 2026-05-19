"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatZAR } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function StickyATC({ product, triggerRef }: Props) {
  const [visible, setVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const hasSizes = product.sizes && product.sizes.length > 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (triggerRef.current) observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [triggerRef]);

  const handleAdd = () => {
    addItem(product, selectedSize || "ONE SIZE");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <AnimatePresence>
      {visible && product.inStock && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-4">
            {/* Thumbnail */}
            {product.image && (
              <div className="relative w-12 h-12 flex-shrink-0 bg-brand-surface hidden sm:block">
                <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
              </div>
            )}

            {/* Name + price */}
            <div className="flex-1 min-w-0">
              <p className="text-brand-text font-bold text-sm truncate uppercase tracking-tight">{product.name}</p>
              <p className="text-brand-primary font-extrabold text-base">{formatZAR(product.price)}</p>
            </div>

            {/* Size picker (compact) */}
            {hasSizes && (
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                aria-label="Select size"
                className="border border-brand-border text-[11px] uppercase font-semibold px-3 py-2 focus:outline-none focus:border-brand-primary cursor-pointer hidden sm:block"
              >
                <option value="">Size</option>
                {product.sizes!.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className={`flex items-center gap-2 text-white text-[11px] tracking-[0.18em] uppercase font-bold px-6 py-3 transition-colors duration-300 cursor-pointer flex-shrink-0 ${added ? "bg-brand-accent" : "bg-brand-primary hover:bg-brand-accent"}`}
            >
              <ShoppingBag size={14} />
              <span className="hidden sm:inline">{added ? "Added!" : "Add to Cart"}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}