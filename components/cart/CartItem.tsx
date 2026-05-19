"use client";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useCart, type CartItem as CartItemType } from "@/context/CartContext";
import { formatZAR } from "@/lib/utils";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem, closeCart } = useCart();
  const lineTotal = item.product.price * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-4 py-4 border-b border-brand-border last:border-b-0"
    >
      {/* Image */}
      <Link href={`/products/${item.product.slug}`} onClick={closeCart} className="relative w-20 h-24 flex-shrink-0 bg-brand-surface">
        <Image src={item.product.image} alt={item.product.name} fill sizes="80px" className="object-cover" />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[9px] tracking-[0.18em] uppercase text-brand-muted font-medium">{item.product.brand}</p>
            <Link
              href={`/products/${item.product.slug}`}
              onClick={closeCart}
              className="text-[13px] font-bold text-brand-text uppercase tracking-tight leading-tight hover:text-brand-primary transition-colors line-clamp-2"
            >
              {item.product.name}
            </Link>
            {item.size && (
              <p className="text-[10px] text-brand-muted tracking-wider mt-0.5">Size: <span className="font-semibold text-brand-text">{item.size}</span></p>
            )}
          </div>
          <button
            onClick={() => removeItem(item.product.id, item.size)}
            aria-label={`Remove ${item.product.name}`}
            className="text-brand-muted hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer p-0.5"
          >
            <X size={14} />
          </button>
        </div>

        {/* Qty + Price */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-brand-border">
            <button
              onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="w-7 h-7 flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <Minus size={11} />
            </button>
            <span className="w-8 text-center text-[12px] font-bold">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
              aria-label="Increase quantity"
              className="w-7 h-7 flex items-center justify-center hover:bg-brand-surface transition-colors cursor-pointer"
            >
              <Plus size={11} />
            </button>
          </div>
          <span className="text-[14px] font-extrabold text-brand-text">{formatZAR(lineTotal)}</span>
        </div>
      </div>
    </motion.div>
  );
}