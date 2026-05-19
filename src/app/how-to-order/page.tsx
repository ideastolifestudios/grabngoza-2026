import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, CreditCard, Truck, CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "How to Order" };

const STEPS = [
  {
    num: "01",
    icon: ShoppingBag,
    title: "Browse & Pick",
    body: "Explore our collections — New Arrivals, Apparel, Footwear, Accessories, and Bundles. Click any product to view sizes, images, and details.",
  },
  {
    num: "02",
    icon: CreditCard,
    title: "Select Size & Add to Cart",
    body: "Choose your size using our size guide, then click 'Add to Cart'. Your cart saves automatically — no account needed.",
  },
  {
    num: "03",
    icon: CreditCard,
    title: "Checkout Securely",
    body: "Enter your shipping address and click Pay. Our Yoco-powered checkout accepts Visa, Mastercard, Apple Pay, and Google Pay. Your card details are never stored.",
  },
  {
    num: "04",
    icon: Truck,
    title: "We Pack & Ship",
    body: "Your order is processed and dispatched within 1–3 business days. You'll receive a confirmation email with tracking details.",
  },
  {
    num: "05",
    icon: CheckCircle,
    title: "Delivered to You",
    body: "Standard delivery takes 2–5 business days nationwide. Express delivery (1–2 days) is available at checkout.",
  },
];

const FAQS = [
  { q: "Do I need an account to order?", a: "No account needed. Just browse, add to cart, and checkout." },
  { q: "Can I track my order?", a: "Yes — use the Track Order page with your order ID from your confirmation email." },
  { q: "What if I ordered the wrong size?", a: "Contact us within 24 hours and we'll do our best to update before dispatch. Otherwise, use our returns process." },
  { q: "Is it safe to pay online?", a: "Yes. All payments are processed by Yoco, a PCI-DSS compliant South African payment provider." },
];

export default function HowToOrderPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-primary py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-3">Simple Process</p>
          <h1 className="text-white text-[44px] font-extrabold uppercase tracking-tight leading-none mb-3">How to Order</h1>
          <p className="text-white/50 text-sm">From browse to doorstep — here's how it works.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="space-y-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-brand-primary text-white flex items-center justify-center font-extrabold text-sm">
                      {step.num}
                    </div>
                    {i < STEPS.length - 1 && <div className="w-px h-8 bg-brand-border" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon size={16} className="text-brand-accent" />
                      <h3 className="font-bold text-brand-text text-sm uppercase tracking-wide">{step.title}</h3>
                    </div>
                    <p className="text-brand-muted text-sm leading-relaxed">{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick FAQ */}
      <section className="py-12 lg:py-16 bg-brand-surface">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <h2 className="text-[10px] tracking-[0.25em] uppercase font-bold text-brand-primary mb-6">Quick Questions</h2>
          <div className="space-y-4">
            {FAQS.map((item) => (
              <div key={item.q} className="bg-white border border-brand-border p-5">
                <p className="font-bold text-brand-text text-sm mb-2">{item.q}</p>
                <p className="text-brand-muted text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-primary text-center">
        <h2 className="text-white text-[28px] font-extrabold uppercase mb-5">Ready to Shop?</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/collections/new-arrivals" className="inline-flex items-center gap-2 bg-brand-accent text-white text-[11px] tracking-[0.2em] uppercase font-bold px-8 py-4 hover:bg-white hover:text-brand-primary transition-colors group">
            SHOP NEW ARRIVALS <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/faq" className="inline-flex items-center gap-2 border border-white/30 text-white text-[11px] tracking-[0.2em] uppercase font-bold px-8 py-4 hover:border-white transition-colors">
            MORE FAQ
          </Link>
        </div>
      </section>
    </div>
  );
}