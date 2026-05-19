"use client";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];
const PRICE_RANGES = [
  { label: "Under R500", min: 0, max: 500 },
  { label: "R500 – R1,000", min: 500, max: 1000 },
  { label: "R1,000 – R2,000", min: 1000, max: 2000 },
  { label: "Over R2,000", min: 2000, max: Infinity },
];

export interface ActiveFilters {
  sizes: string[];
  priceRange: { min: number; max: number } | null;
  inStockOnly: boolean;
}

interface Props {
  filters: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
}

export default function FilterPanel({ filters, onChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSize = (size: string) => {
    const sizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onChange({ ...filters, sizes });
  };

  const setPriceRange = (range: { min: number; max: number } | null) => {
    onChange({ ...filters, priceRange: range });
  };

  const activeCount = filters.sizes.length + (filters.priceRange ? 1 : 0) + (filters.inStockOnly ? 1 : 0);

  const PanelContent = () => (
    <div className="space-y-8">
      {/* In Stock */}
      <div>
        <h3 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-text mb-3">Availability</h3>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 accent-brand-accent cursor-pointer"
          />
          <span className="text-sm text-brand-text group-hover:text-brand-primary transition-colors">In Stock Only</span>
        </label>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-text mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`text-[10px] tracking-wider uppercase font-semibold px-3 py-1.5 border transition-all duration-200 cursor-pointer ${
                filters.sizes.includes(size)
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-white text-brand-text border-brand-border hover:border-brand-primary"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-text mb-3">Price</h3>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const isActive = filters.priceRange?.min === range.min && filters.priceRange?.max === range.max;
            return (
              <button
                key={range.label}
                onClick={() => setPriceRange(isActive ? null : { min: range.min, max: range.max })}
                className={`block w-full text-left text-sm px-3 py-2 transition-all duration-200 cursor-pointer ${
                  isActive ? "bg-brand-primary text-white font-semibold" : "text-brand-text hover:bg-brand-surface"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear */}
      {activeCount > 0 && (
        <button
          onClick={() => onChange({ sizes: [], priceRange: null, inStockOnly: false })}
          className="text-brand-accent text-[11px] tracking-wider uppercase font-bold hover:underline cursor-pointer"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-[140px]">
          <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-text mb-6 flex items-center gap-2">
            <SlidersHorizontal size={12} /> Filter
            {activeCount > 0 && <span className="bg-brand-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ml-1">{activeCount}</span>}
          </h2>
          <PanelContent />
        </div>
      </aside>

      {/* Mobile filter button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 border border-brand-border px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase font-semibold text-brand-text hover:border-brand-primary transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={12} />
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/50 z-50 lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-80 bg-white z-50 flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-brand-border">
                <span className="font-bold text-sm tracking-widest uppercase">Filters</span>
                <button onClick={() => setMobileOpen(false)} className="text-brand-text hover:text-brand-primary transition-colors cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-6 flex-1"><PanelContent /></div>
              <div className="p-6 border-t border-brand-border">
                <button onClick={() => setMobileOpen(false)} className="w-full bg-brand-primary text-white text-[11px] tracking-[0.18em] uppercase font-bold py-4 hover:bg-brand-accent transition-colors cursor-pointer">
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}