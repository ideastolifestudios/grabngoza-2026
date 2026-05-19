"use client";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function EmptyCart() {
  const { closeCart } = useCart();
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
      <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center mb-5">
        <ShoppingBag size={28} className="text-brand-muted" />
      </div>
      <h3 className="text-brand-text font-bold text-base uppercase tracking-wide mb-2">Your cart is empty</h3>
      <p className="text-brand-muted text-sm mb-8">Looks like you haven&apos;t added anything yet.</p>
      <Link
        href="/collections/new-arrivals"
        onClick={closeCart}
        className="inline-flex items-center gap-2 bg-brand-primary text-white text-[11px] tracking-[0.18em] uppercase font-bold px-8 py-4 hover:bg-brand-accent transition-colors duration-300 group"
      >
        SHOP NEW DROPS
        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}