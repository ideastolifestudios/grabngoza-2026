"use client";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { formatZAR } from "@/lib/utils";
import type { CartItem } from "@/context/CartContext";

const SHIPPING_THRESHOLD = 1000;

interface Props { items: CartItem[]; totalPrice: number; }

export default function OrderSummary({ items, totalPrice }: Props) {
  const shippingCost = totalPrice >= SHIPPING_THRESHOLD ? 0 : 80;
  const orderTotal = totalPrice + shippingCost;

  return (
    <div className="bg-brand-surface border border-brand-border p-6 sticky top-[140px]">
      <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-text mb-5">Order Summary</h2>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
            <div className="relative w-14 h-16 bg-white flex-shrink-0 border border-brand-border">
              <Image src={item.product.image} alt={item.product.name} fill sizes="56px" className="object-cover" />
              <span className="absolute -top-2 -right-2 bg-brand-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand-text uppercase tracking-tight line-clamp-2">{item.product.name}</p>
              <p className="text-[10px] text-brand-muted mt-0.5">Size: {item.size}</p>
              <p className="text-[12px] font-extrabold text-brand-text mt-1">{formatZAR(item.product.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-brand-border pt-4 space-y-2">
        <div className="flex justify-between text-sm text-brand-muted">
          <span>Subtotal</span>
          <span className="font-semibold text-brand-text">{formatZAR(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm text-brand-muted">
          <span>Shipping</span>
          <span className={`font-semibold ${shippingCost === 0 ? "text-brand-accent" : "text-brand-text"}`}>
            {shippingCost === 0 ? "FREE" : formatZAR(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between pt-3 border-t border-brand-border">
          <span className="font-bold text-brand-text uppercase tracking-wide text-sm">Total</span>
          <span className="font-extrabold text-brand-text text-xl">{formatZAR(orderTotal)}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="mt-5 pt-4 border-t border-brand-border flex items-center gap-2">
        <ShieldCheck size={14} className="text-brand-accent flex-shrink-0" />
        <p className="text-[10px] text-brand-muted tracking-wide leading-relaxed">
          Secure checkout powered by <strong className="text-brand-accent">Yoco</strong>. Your payment info is never stored.
        </p>
      </div>
    </div>
  );
}