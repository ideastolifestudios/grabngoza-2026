import type { Metadata } from "next";
import Link from "next/link";
import SupportLayout from "@/components/SupportLayout";

export const metadata: Metadata = { title: "How to Order | Grab & Go" };

const STEPS = [
  { num: "01", title: "Browse & Pick",             body: "Explore our collections — Hoodies, Tees, Bottoms, Coats & Jackets, Accessories. Click any product to view sizes, colours, and details." },
  { num: "02", title: "Select Size & Add to Cart", body: "Choose your size using our size guide, then click Add to Cart. Your cart saves automatically — no account needed to order." },
  { num: "03", title: "Checkout Securely",         body: "Enter your shipping address and click Pay. Yoco-powered checkout accepts Visa, Mastercard, Apple Pay, and Google Pay. Card details are never stored." },
  { num: "04", title: "We Pack & Ship",            body: "Your order is processed and dispatched within 1–3 business days. You'll receive a confirmation email with live tracking details." },
  { num: "05", title: "Receive Your Gear",         body: "Your package is on its way. Track it anytime via the link in your email or our Track Order page." },
];

export default function HowToOrderPage() {
  return (
    <SupportLayout>
      {/* Hero */}
      <div className="bg-[#06402B] pt-16 pb-16 text-center px-6">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Simple & Fast</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">How to Order</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">From browse to doorstep in a few taps.</p>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
              <span className="text-3xl font-black text-gray-100 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Ready? Let's go.</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop Now</Link>
          <Link href="/help" className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Help Center</Link>
        </div>
      </div>
    </SupportLayout>
  );
}
