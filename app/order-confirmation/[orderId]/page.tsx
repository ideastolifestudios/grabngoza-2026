"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, Truck, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatZAR } from "@/lib/utils";

interface OrderData {
  customerName: string;
  customerEmail: string;
  items: Array<{
    productName: string; productImage: string;
    price: number; size: string; quantity: number; lineTotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  shippingAddress: {
    line1: string; line2?: string; city: string; province: string; postalCode: string;
  };
}

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getDoc(doc(db, "orders", orderId))
      .then((snap) => {
        if (snap.exists()) setOrder(snap.data() as OrderData);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle size={40} className="text-brand-accent" />
        </motion.div>
        <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-2">Order Confirmed</p>
        <h1 className="text-[36px] lg:text-[44px] font-extrabold uppercase tracking-tight text-brand-text mb-3">
          You&apos;re all set!
        </h1>
        {order && (
          <p className="text-brand-muted text-sm">
            Hey <strong className="text-brand-text">{order.customerName.split(" ")[0]}</strong> — we&apos;ve received your order
            and will send a confirmation to <strong className="text-brand-text">{order.customerEmail}</strong>.
          </p>
        )}
        <div className="mt-3 inline-block bg-brand-surface px-4 py-2 border border-brand-border">
          <p className="text-[10px] tracking-[0.2em] uppercase text-brand-muted">Order ID</p>
          <p className="font-mono font-bold text-brand-text text-sm">{orderId}</p>
        </div>
      </motion.div>

      {/* Status steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-3 gap-2 mb-10"
      >
        {[
          { icon: CheckCircle, label: "Order Placed", active: true },
          { icon: Package, label: "Processing", active: false },
          { icon: Truck, label: "Shipped", active: false },
        ].map(({ icon: Icon, label, active }) => (
          <div key={label} className={`flex flex-col items-center gap-2 p-4 border ${active ? "border-brand-accent bg-brand-accent/5" : "border-brand-border bg-white"}`}>
            <Icon size={20} className={active ? "text-brand-accent" : "text-brand-muted"} />
            <span className={`text-[10px] tracking-[0.15em] uppercase font-bold ${active ? "text-brand-accent" : "text-brand-muted"}`}>{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Order items */}
      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-brand-surface border border-brand-border p-6 mb-8"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase font-bold text-brand-text mb-5">Items Ordered</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="relative w-14 h-16 bg-white flex-shrink-0 border border-brand-border">
                  <Image src={item.productImage} alt={item.productName} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-brand-text uppercase tracking-tight">{item.productName}</p>
                  <p className="text-[10px] text-brand-muted">Size: {item.size} · Qty: {item.quantity}</p>
                </div>
                <span className="font-bold text-brand-text text-sm">{formatZAR(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-border mt-5 pt-4 space-y-1.5">
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Subtotal</span><span>{formatZAR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-muted">
              <span>Shipping</span>
              <span className={order.shippingCost === 0 ? "text-brand-accent font-bold" : ""}>{order.shippingCost === 0 ? "FREE" : formatZAR(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-brand-text text-base pt-1 border-t border-brand-border">
              <span>Total</span><span>{formatZAR(order.total)}</span>
            </div>
          </div>

          {/* Shipping address */}
          <div className="mt-5 pt-4 border-t border-brand-border">
            <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-brand-muted mb-2">Shipping To</p>
            <p className="text-sm text-brand-text">
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""},{" "}
              {order.shippingAddress.city}, {order.shippingAddress.province}, {order.shippingAddress.postalCode}
            </p>
          </div>
        </motion.div>
      )}

      {/* Email note */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        className="flex items-start gap-3 bg-brand-primary/5 border border-brand-primary/20 p-4 mb-8"
      >
        <Mail size={16} className="text-brand-primary flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-brand-text leading-relaxed">
          A confirmation email has been sent to your inbox. Your order will be packed and dispatched within <strong>1–3 business days</strong>. You&apos;ll receive a tracking number once shipped.
        </p>
      </motion.div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/collections/new-arrivals" className="flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white text-[11px] tracking-[0.18em] uppercase font-bold py-4 hover:bg-brand-accent transition-colors group">
          Continue Shopping <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href={`/track-order?id=${orderId}`} className="flex-1 flex items-center justify-center gap-2 border border-brand-border text-brand-text text-[11px] tracking-[0.18em] uppercase font-bold py-4 hover:border-brand-primary hover:text-brand-primary transition-colors">
          Track Order
        </Link>
      </div>
    </div>
  );
}