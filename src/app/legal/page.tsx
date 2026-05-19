import React from 'react';
import Link from 'next/link';

export default function LegalPage() {
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
            <div className="text-3xl mb-2">⚖️</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Legal & Privacy
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              Our terms, conditions, and how we keep your data secure.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-12 relative z-10 mb-16">
          <div className="bg-white border border-gray-200/80 p-8 md:p-12 shadow-sm">
            <div className="space-y-8 text-sm text-gray-600 font-medium leading-relaxed">
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">1. Terms of Service</h2>
                <p>By accessing or using the Grab&Go platform, you agree to be bound by these Terms. All content, trademarks, and data on this website are the property of Grab&Go. Commercial reproduction is strictly prohibited.</p>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">2. Privacy & Data Protection</h2>
                <p>Your privacy is non-negotiable. We only collect essential data required to process orders and improve your experience. We do not sell, distribute, or lease your personal information to third parties.</p>
              </section>
              <section>
                <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-3 border-l-4 border-[#143427] pl-3">3. Payment Security (PCI-DSS)</h2>
                <p>All transactions are processed through encrypted, secure gateways. We do not store your credit card information on our servers. All financial data is tokenized securely by our payment processing partners.</p>
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