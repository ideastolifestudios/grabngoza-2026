"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId]   = useState("");
  const [email,   setEmail]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState<null | "found" | "notfound">(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    // Simulated lookup — replace with real API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setResult("notfound"); // Replace with actual API result
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Real-Time</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Track Order</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Enter your order reference to see live shipment status.</p>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto w-full px-6 py-16 flex-1">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Order Reference *</label>
            <input type="text" required placeholder="GNG-XXXXXXXX"
              value={orderId} onChange={e => setOrderId(e.target.value)}
              className="w-full bg-[#0d1410] border border-[#1a2e23] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email Address *</label>
            <input type="email" required placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0d1410] border border-[#1a2e23] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors disabled:opacity-50">
            {loading ? "Looking up..." : "Track My Order"}
          </button>
        </form>

        {/* Result */}
        {result === "notfound" && (
          <div className="mt-8 bg-[#0d1410] border border-[#1a2e23] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Order Not Found</p>
            <p className="text-sm text-white/60 mb-4">We couldn't find that order. Check your confirmation email for the correct reference, or contact us directly.</p>
            <div className="flex justify-center gap-3">
              <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:underline">Help Desk</Link>
              <span className="text-white/20">|</span>
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:underline">WhatsApp</a>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="mt-8 bg-[#0d1410] border border-[#1a2e23] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Tip</p>
          <p className="text-xs text-white/50 leading-relaxed">Your order reference is in your confirmation email and starts with <strong className="text-white/80">GNG-</strong>. You can also track via the courier link in your dispatch email.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Need more help?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Desk</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
