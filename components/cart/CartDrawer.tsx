"use client";
import { useRef } from "react";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import CartItemComponent from "./CartItem";
import FreeShippingBar from "./FreeShippingBar";
import EmptyCart from "./EmptyCart";
import { formatZAR } from "@/lib/utils";

const SHIPPING_THRESHOLD = 1000;

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, totalPrice } = useCart();
  const overlayRef = useRef<HTMLDivElement>(null);
  const shippingCost = totalPrice >= SHIPPING_THRESHOLD ? 0 : 80;
  const orderTotal = totalPrice + shippingCost;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-primary">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-white" />
                <span className="text-white font-bold text-sm tracking-widest uppercase">
                  Your Cart {totalItems > 0 && `(${totalItems})`}
                </span>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free shipping bar */}
            {items.length > 0 && <FreeShippingBar totalPrice={totalPrice} />}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <EmptyCart />
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item) => (
                    <CartItemComponent key={`${item.product.id}-${item.size}`} item={item} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — totals + checkout */}
            {items.length > 0 && (
              <div className="border-t border-brand-border bg-white">
                <div className="px-5 py-4 space-y-2">
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
                  <div className="flex justify-between pt-2 border-t border-brand-border">
                    <span className="font-bold text-brand-text uppercase tracking-wide text-sm">Total</span>
                    <span className="font-extrabold text-brand-text text-lg">{formatZAR(orderTotal)}</span>
                  </div>
                </div>

                <div className="px-5 pb-5 space-y-3">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full bg-brand-primary text-white text-[11px] tracking-[0.2em] uppercase font-bold py-4 hover:bg-brand-accent transition-colors duration-300"
                  >
                    Checkout — {formatZAR(orderTotal)}
                  </Link>
                  <button
                    onClick={closeCart}
                    className="w-full border border-brand-border text-brand-text text-[11px] tracking-[0.18em] uppercase font-bold py-3 hover:border-brand-primary hover:text-brand-primary transition-colors duration-200 cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                  <p className="text-center text-[10px] text-brand-muted tracking-wide">
                    Secure checkout powered by <span className="font-bold text-brand-accent">Yoco</span>
                  </p>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}