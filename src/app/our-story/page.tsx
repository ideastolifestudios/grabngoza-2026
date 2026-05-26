import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Story | Grab & Go" };

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Established 2026</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Our Story</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">The vision, the hustle, and the culture behind Grab & Go.</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1 space-y-8">
        {[
          { title: "Where It Started", body: "Grab & Go was born from a simple idea: bring premium streetwear to South Africa fast, clean, and without the hype tax. We saw a gap — quality pieces, accessible prices, instant delivery — and we moved on it." },
          { title: "The Vision",       body: "We're not just selling clothes. We're building a culture. Every drop is curated, every piece has a story, and every customer is part of the G&G family. We collaborate with local brands, micro-influencers, and creatives who move different." },
          { title: "The Culture",      body: "The Culture Collective is at our core. We partner with MINNIEPRESS, CUSTOMSBYEBA, RESILIENT PALS, and emerging SA brands to bring you exclusive limited drops you won't find anywhere else." },
          { title: "What's Next",      body: "2026 is just the beginning. New brands, bigger drops, more collections. We're building something real — a streetwear hub that represents South African culture on a global stage. Stay locked in." },
        ].map(sec => (
          <div key={sec.title} className="bg-[#0d1410] border border-[#1a2e23] p-6 md:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] mb-4">{sec.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Be Part of the Culture</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop the Drops</Link>
          <a href="https://www.instagram.com/grabngoza" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Follow @grabngoza</a>
        </div>
      </div>
    </div>
  );
}
