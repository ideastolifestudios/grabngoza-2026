import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy | Grab & Go" };

const RATES = [
  { method: "Standard Courier",  time: "2–5 Business Days", cost: "R80",  note: "Nationwide, door-to-door" },
  { method: "Express Courier",   time: "1–2 Business Days", cost: "R150", note: "Major cities only" },
  { method: "Free Delivery",     time: "2–5 Business Days", cost: "FREE", note: "Orders over R1,000" },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Fast & Trackable</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Shipping</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">We get your gear to you fast, tracked, and safe.</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1 space-y-10">
        {/* Rates Table */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Delivery Rates</span>
          <div className="overflow-x-auto border border-[#1a2e23]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0d1410] border-b border-[#1a2e23]">
                  {["Method", "Timeframe", "Cost", "Notes"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2e23]">
                {RATES.map(r => (
                  <tr key={r.method} className="bg-[#0d1410] hover:bg-[#111c14] transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{r.method}</td>
                    <td className="px-5 py-4 text-white/60">{r.time}</td>
                    <td className={`px-5 py-4 font-black ${r.cost === "FREE" ? "text-[#18A374]" : "text-white"}`}>{r.cost}</td>
                    <td className="px-5 py-4 text-white/40 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Policy Details */}
        {[
          { title: "Processing Time", body: "Orders are processed within 1–3 business days. Orders placed before 14:00 SAST Mon–Fri are dispatched same day. Weekend orders ship on the next business day." },
          { title: "Tracking",        body: "A tracking number is emailed to you once your order is dispatched. Use the Track Order page at any time to check your shipment status." },
          { title: "Delays",          body: "While we aim for the timeframes above, public holidays, extreme weather, and courier backlogs can occasionally cause delays. We'll keep you updated." },
          { title: "Failed Delivery", body: "If no one is available to receive your package, the courier will leave a delivery notification. Contact us within 24 hours to arrange a re-delivery." },
          { title: "International Shipping", body: "We currently ship within South Africa only. International shipping coming soon — register your email to be notified." },
        ].map(sec => (
          <div key={sec.title} className="bg-[#0d1410] border border-[#1a2e23] p-6 md:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-3">{sec.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Questions about your order?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Track Order</Link>
          <Link href="/help" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Help Desk</Link>
        </div>
      </div>
    </div>
  );
}
