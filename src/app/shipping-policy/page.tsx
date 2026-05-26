import React from 'react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
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
            <div className="text-3xl mb-2">🚚</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Shipping Policy
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              Fast, trackable shipping to get your gear to you ASAP.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 mb-16">
          <div className="bg-white border border-gray-200/80 p-8 md:p-12 shadow-sm">
            <div className="space-y-8 text-sm text-gray-600 font-medium leading-relaxed">
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">Processing Times</h2>
                <p>All orders are verified, packed, and dispatched from our central distribution hub within 1-2 business days. Orders placed on weekends or public holidays will be processed on the following business day.</p>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">Delivery Windows & Costs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-2">Standard Shipping</h3>
                    <p className="text-emerald-600 font-black mb-1">R100.00 (Free over R1500)</p>
                    <p className="text-xs">2-5 Business Days. Nationwide coverage.</p>
                  </div>
                  <div className="border border-gray-200 p-4">
                    <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest mb-2">Express Shipping</h3>
                    <p className="text-emerald-600 font-black mb-1">R250.00</p>
                    <p className="text-xs">1-2 Business Days. Major metropolitan areas only.</p>
                  </div>
                </div>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">Tracking Details</h2>
                <p>Once your package leaves our facility, you will receive an automated dispatch email containing your unique waybill number. You can monitor your delivery in real-time via our Track Order portal.</p>
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