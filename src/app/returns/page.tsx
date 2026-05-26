import React from 'react';
import Link from 'next/link';

export default function ReturnsPage() {
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
            <div className="text-3xl mb-2">↩️</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Returns & Exchanges
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              Hassle-free returns because your satisfaction is our priority.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 mb-16">
          <div className="bg-white border border-gray-200/80 p-8 md:p-12 shadow-sm">
            <div className="space-y-8 text-sm text-gray-600 font-medium leading-relaxed">
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">Our 7-Day Guarantee</h2>
                <p>We want you to be completely satisfied with your purchase. If you are not entirely happy with your items, we offer a straightforward return and exchange policy within 7 days of receiving your order.</p>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">Condition Requirements</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Items must be unworn, unwashed, and in their original pristine condition.</li>
                  <li>All original tags, authenticity cards, and packaging must be intact and attached.</li>
                  <li>Footwear must be returned in the original branded box without postal labels attached directly to the box.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">How to Initiate</h2>
                <p>To start a return, please contact our support team via WhatsApp or Email within the 7-day window. Provide your Order ID and the reason for the return. Our team will generate a unique Return Authorization Number and provide courier instructions.</p>
              </section>
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