"use client";
import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { formatZAR } from "@/lib/utils";

interface Props {
  stockCount?: number;
  price: number;
  inStock: boolean;
}

export default function UrgencySignals({ stockCount, price, inStock }: Props) {
  // Randomised live viewer count (resets per session)
  const [viewers] = useState(() => Math.floor(Math.random() * 11) + 4);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowViewers(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const isLowStock = inStock && stockCount !== undefined && stockCount > 0 && stockCount <= 5;
  const freeDelivery = price >= 1000;

  return (
    <div className="space-y-3">
      {/* Viewer count */}
      {showViewers && inStock && (
        <div className="flex items-center gap-2 text-brand-text">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
          </span>
          <span className="text-[11px] tracking-wide font-medium">
            <strong>{viewers} people</strong> are viewing this right now
          </span>
        </div>
      )}

      {/* Low stock */}
      {isLowStock && (
        <div className="bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-red-700 text-[11px] tracking-wide font-semibold">
            ⚡ Only {stockCount} left in stock — order soon!
          </p>
        </div>
      )}

      {/* Out of stock */}
      {!inStock && (
        <div className="bg-brand-surface border border-brand-border px-3 py-2">
          <p className="text-brand-muted text-[11px] tracking-wide font-semibold uppercase">
            Out of Stock — Join the waitlist
          </p>
        </div>
      )}

      {/* Trust pills */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2 text-brand-text">
          <Truck size={13} className={freeDelivery ? "text-brand-accent" : "text-brand-muted"} />
          <span className="text-[11px] tracking-wide">
            {freeDelivery
              ? <><strong className="text-brand-accent">Free delivery</strong> on this order</>
              : <>Add {formatZAR(1000 - price)} more for <strong>free delivery</strong></>
            }
          </span>
        </div>
        <div className="flex items-center gap-2 text-brand-text">
          <ShieldCheck size={13} className="text-brand-accent" />
          <span className="text-[11px] tracking-wide">Secure checkout powered by <strong>Yoco</strong></span>
        </div>
        <div className="flex items-center gap-2 text-brand-text">
          <RotateCcw size={13} className="text-brand-muted" />
          <span className="text-[11px] tracking-wide text-brand-muted">30-day returns · Ships within 1–3 business days</span>
        </div>
      </div>
    </div>
  );
}