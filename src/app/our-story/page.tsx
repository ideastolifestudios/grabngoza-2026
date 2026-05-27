import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Our Story | Grab & Go" };
const SECTIONS = [
  { title: "Where It Started",  body: "Grab & Go was born from a simple idea: bring premium streetwear to South Africa fast, clean, and without the hype tax. We saw a gap — quality pieces, accessible prices, same-day fulfilment — and we moved on it." },
  { title: "The Vision",        body: "We're not just selling clothes. We're building a culture. Every drop is curated, every piece has a story, and every customer is part of the G&G family. We collaborate with local brands, micro-influencers, and creatives who move different." },
  { title: "The Culture",       body: "The Culture Collective is at our core. We partner with MINNIEPRESS, CUSTOMSBYEBA, RESILIENT PALS, and emerging SA brands to bring you exclusive limited drops you won't find anywhere else." },
  { title: "What's Next",       body: "2026 is just the beginning. New brands, bigger drops, more collections. We're building something real — a streetwear hub that represents South African culture on a global stage. Stay locked in." },
];
export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Established 2026</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Our Story</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">The vision, the hustle, and the culture behind Grab & Go.</p>
      </div>
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1 space-y-4">
        {SECTIONS.map(sec => (
          <div key={sec.title} className="border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#06402B] mb-3">{sec.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Be Part of the Culture</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop the Drops</Link>
          <a href="https://www.instagram.com/grabngoza" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Follow @grabngoza</a>
        </div>
      </div>
    </div>
  );
}
