import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Exchanges | Grab & Go" };

const STEPS = [
  { num: "01", title: "Check Eligibility",     body: "Items must be returned within 7 days of verified delivery, unworn, with original tags attached. Sale items and custom orders are final sale." },
  { num: "02", title: "Contact Support",        body: "Reach out via our Help Desk or WhatsApp with your Order ID and the items you wish to return. We'll confirm eligibility and issue return instructions." },
  { num: "03", title: "Ship It Back",           body: "Package your items securely. Drop off at your nearest courier. Return shipping costs are covered by the customer unless the item was defective." },
  { num: "04", title: "Quality Check",          body: "Once we receive your return, our team inspects it within 1–2 business days." },
  { num: "05", title: "Exchange or Store Credit", body: "Approved returns receive store credit or an exchange within 5–7 business days. Refunds to original payment are available for defective items." },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Hassle-Free</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Returns</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Not happy? We'll make it right. 7-day returns, no drama.</p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-6">Return Process</span>
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

        {/* Policy Note */}
        <div className="mt-10 bg-[#06402B]/30 border border-[#06402B] p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Important</p>
          <p className="text-sm text-white/70 leading-relaxed">Items that are worn, washed, damaged, or returned without original tags will not be accepted. For defective or incorrect items, we cover return shipping and issue a full refund.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready to start a return?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Contact Support</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
