"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";
import SizeSelector from "./SizeSelector";
import UrgencySignals from "./UrgencySignals";
import Badge from "@/components/ui/Badge";
import { useCart } from "@/context/CartContext";
import { formatZAR } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface Props {
  product: Product;
  atcRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function ProductInfo({ product, atcRef }: Props) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const hasSizes = product.sizes && product.sizes.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2000);
      return;
    }
    addItem(product, selectedSize || "ONE SIZE");
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Brand + badges */}
      <div className="flex items-center gap-3">
        <Link href={`/collections/all?brand=${product.brand}`} className="text-[10px] tracking-[0.2em] uppercase font-semibold text-brand-muted hover:text-brand-primary transition-colors">
          {product.brand}
        </Link>
        <span className="text-brand-border">·</span>
        <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-brand-muted">{product.category}</span>
        {product.isNew && <Badge variant="new" />}
        {!product.inStock && <Badge variant="outOfStock" />}
      </div>

      {/* Name */}
      <h1 className="text-[28px] lg:text-[36px] font-extrabold leading-tight tracking-tight text-brand-text uppercase">
        {product.name}
      </h1>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-extrabold text-brand-text">{formatZAR(product.price)}</span>
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="text-brand-muted line-through text-base">{formatZAR(product.comparePrice)}</span>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-brand-muted text-sm leading-relaxed">{product.description}</p>
      )}

      {/* Size selector */}
      {hasSizes && (
        <div className={sizeError ? "ring-1 ring-red-400 ring-offset-2 rounded" : ""}>
          <SizeSelector sizes={product.sizes!} selected={selectedSize} onChange={setSelectedSize} />
        </div>
      )}

      {/* Add to cart + Wishlist */}
      <div className="flex gap-3">
        <button
          ref={atcRef}
          onClick={handleAddToCart}
          disabled={!product.inStock}
          aria-label={product.inStock ? "Add to cart" : "Out of stock"}
          className={`flex-1 flex items-center justify-center gap-2 text-[11px] tracking-[0.18em] uppercase font-bold py-4 transition-all duration-300 cursor-pointer
            ${added ? "bg-brand-accent text-white" : product.inStock ? "bg-brand-primary text-white hover:bg-brand-accent" : "bg-brand-surface text-brand-muted cursor-not-allowed"}`}
        >
          <ShoppingBag size={15} />
          {added ? "Added to Cart!" : product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        <button
          aria-label="Add to wishlist"
          className="border border-brand-border px-4 hover:border-brand-primary hover:text-brand-primary transition-colors duration-200 cursor-pointer"
        >
          <Heart size={18} />
        </button>
      </div>

      {/* Urgency signals */}
      <UrgencySignals stockCount={product.stockCount} price={product.price} inStock={product.inStock} />
    </div>
  );
}