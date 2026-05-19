"use client";

interface Props {
  sizes: string[];
  selected: string;
  onChange: (size: string) => void;
  outOfStockSizes?: string[];
}

export default function SizeSelector({ sizes, selected, onChange, outOfStockSizes = [] }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] tracking-[0.2em] uppercase font-bold text-brand-text">Size</span>
        <button className="text-brand-accent text-[10px] tracking-wider uppercase font-semibold hover:underline cursor-pointer">
          Size Guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const oos = outOfStockSizes.includes(size);
          const active = selected === size;
          return (
            <button
              key={size}
              onClick={() => !oos && onChange(size)}
              disabled={oos}
              aria-label={`Size ${size}${oos ? " - Out of stock" : ""}`}
              className={`relative min-w-[48px] px-3 py-2.5 text-[11px] font-bold tracking-wider uppercase border-2 transition-all duration-200 cursor-pointer
                ${active ? "bg-brand-primary text-white border-brand-primary" : oos ? "bg-brand-surface text-brand-muted border-brand-border cursor-not-allowed line-through" : "bg-white text-brand-text border-brand-border hover:border-brand-primary"}`}
            >
              {size}
            </button>
          );
        })}
      </div>
      {!selected && sizes.length > 0 && (
        <p className="text-red-500 text-[10px] tracking-wide mt-2">Please select a size</p>
      )}
    </div>
  );
}