import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How to Order | Grab & Go" };

const STEPS = [
  { num: "01", title: "Browse & Pick",           body: "Explore our collections — Hoodies, Tees, Bottoms, Coats, Accessories. Click any product to view sizes, colours, and details." },
  { num: "02", title: "Select Size & Add to Cart", body: "Choose your size using our size guide, then hit Add to Cart. Your cart saves automatically — no account needed." },
  { num: "03", title: "Checkout Securely",        body: "Enter your shipping address and click Pay. Yoco-powered checkout accepts Visa, Mastercard, Apple Pay, and Google Pay. Your card details are never stored." },
  { num: "04", title: "We Pack & Ship",           body: "Your order is processed and dispatched within 1–3 business days. You'll receive a confirmation email with live tracking details." },
  { num: "05", title: "Receive Your Gear",        body: "Sit back. Your package is on its way. Track it anytime via the link in your email or our Track Order page." },
];

export default function HowToOrderPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Simple & Fast</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">How to Order</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">From browse to doorstep in a few taps.</p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 bg-[#0d1410] border border-[#1a2e23] p-6">
              <span className="text-4xl font-black text-[#18A374]/20 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready? Let's go.</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop Now</Link>
          <Link href="/help" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
