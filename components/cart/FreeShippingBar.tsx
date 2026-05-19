"use client";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { formatZAR } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 1000;

export default function FreeShippingBar({ totalPrice }: { totalPrice: number }) {
  const progress = Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - totalPrice, 0);
  const achieved = totalPrice >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className={`px-5 py-3 ${achieved ? "bg-brand-accent/10" : "bg-brand-surface"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Truck size={13} className={achieved ? "text-brand-accent" : "text-brand-muted"} />
        <p className="text-[11px] font-semibold tracking-wide">
          {achieved
            ? <span className="text-brand-accent font-bold">You qualify for FREE delivery!</span>
            : <span className="text-brand-text">Add <strong>{formatZAR(remaining)}</strong> for free delivery</span>
          }
        </p>
      </div>
      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${achieved ? "bg-brand-accent" : "bg-brand-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}