import React from 'react';
import Link from 'next/link';

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col justify-between">
      <div>

        {/* Header */}
        <div className="bg-[#143427] text-white border-b border-[#0f281e]">
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <Link href="/" className="inline-flex items-center text-xs font-bold tracking-widest text-emerald-400 hover:text-emerald-300 uppercase transition-colors">
              ← Back to Navigation
            </Link>
          </div>
          <div className="text-center px-4 pt-10 pb-24">
            <div className="text-3xl mb-2">🔥</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Our Story
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              The vision, the hustle, and the culture behind Grab&Go.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 mb-16">
          <div className="bg-white border border-gray-200/80 p-8 md:p-12 shadow-sm text-center">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold block mb-4">Established 2026</span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 mb-6">Redefining the Culture.</h2>
            <div className="space-y-6 text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
              <p>Grab&Go wasn't just built to sell clothes; it was engineered to be a central node for premium streetwear in South Africa. We saw a gap between high-end international drops and local accessibility, and we decided to bridge it.</p>
              <p>Our curation team scours global and local markets to secure authentic, high-quality pieces. From exclusive sneaker drops to heavy-weight graphic tees, every item in our catalog is strictly verified for authenticity and quality.</p>
              <p className="font-black text-gray-900 text-lg border-t border-b border-gray-100 py-6 my-8">"We don't follow trends. We supply the individuals who set them."</p>
              <p>Welcome to the new standard of digital retail. Welcome to Grab&Go.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Anchor */}
      <div className="bg-[#143427] py-12 text-center px-4 mt-auto">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-6">
          READY TO SHOP?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/search" className="bg-[#1d4d3a] hover:bg-[#235d46] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-emerald-600/30 transition-colors duration-200">
            SHOP NEW ARRIVALS →
          </Link>
          <Link href="/help" className="bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-gray-500 transition-colors duration-200">
            HELP CENTER
          </Link>
        </div>
      </div>

    </div>
  );
}