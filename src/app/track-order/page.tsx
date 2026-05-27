"use client";
import React, { useState } from "react";
import Link from "next/link";
export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<null | "notfound">(null);
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false); setResult("notfound");
  };
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Real-Time</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Track Order</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Enter your order reference to see live shipment status.</p>
      </div>
      <div className="max-w-lg mx-auto w-full px-6 py-16 flex-1">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Reference *</label>
            <input type="text" required placeholder="GNG-XXXXXXXX"
              value={orderId} onChange={e => setOrderId(e.target.value)}
              className="w-full border border-gray-200 px-5 py-4 text-sm text-black placeholder:text-gray-300 outline-none focus:border-[#06402B]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email Address *</label>
            <input type="email" required placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-5 py-4 text-sm text-black placeholder:text-gray-300 outline-none focus:border-[#06402B]/40 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#06402B] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#06402B]/90 transition-colors disabled:opacity-50">
            {loading ? "Looking up..." : "Track My Order"}
          </button>
        </form>
        {result === "notfound" && (
          <div className="mt-8 border border-gray-100 p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Not Found</p>
            <p className="text-sm text-gray-500 mb-4">Check your confirmation email for the correct reference, or contact us directly.</p>
            <div className="flex justify-center gap-4">
              <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:underline">Help Center</Link>
              <span className="text-gray-200">|</span>
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:underline">WhatsApp</a>
            </div>
          </div>
        )}
        <div className="mt-8 bg-gray-50 border border-gray-100 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-2">Tip</p>
          <p className="text-xs text-gray-500 leading-relaxed">Your order reference starts with <strong className="text-black">GNG-</strong> and is in your confirmation email. You can also track via the courier link in your dispatch email.</p>
        </div>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
