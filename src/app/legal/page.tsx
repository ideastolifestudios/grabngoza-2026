import React from 'react';
import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-between">
      <div>
        {/* 1. Deep Forest Green Header Banner */}
        <div className="bg-[#143427] pt-16 pb-20 text-center px-4 border-b border-[#0f281e]">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold block mb-2">
            GRAB&GO INFORMATION
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            LEGAL & PRIVACY
          </h1>
          <div className="w-12 h-[2px] bg-emerald-500 mx-auto my-4"></div>
          <p className="text-emerald-100/80 text-sm max-w-xl mx-auto font-medium">
            Our terms, conditions, and how we keep your shopping experience secure.
          </p>
        </div>

        {/* 2. Content Layout Section */}
        <div className="max-w-3xl mx-auto px-4 py-16">
          <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase block mb-6">
            Terms & Privacy Policies
          </span>
          
          <div className="space-y-6 text-gray-700 border-l-2 border-gray-100 pl-6 py-2">
            <p className="text-base leading-relaxed font-medium">
              We are currently optimizing this portal to deliver a premium user experience matching our new platform standards.
            </p>
            <p className="text-sm leading-relaxed text-gray-500">
              Full structured parameters, documentation, and specific updates regarding this section are being dynamically integrated. For immediate clarity, please contact operations through our primary channels.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Deep Forest Green Footer Banner (Matches "Ready to Shop?") */}
      <div className="bg-[#143427] py-12 text-center px-4 mt-auto">
        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-6">
          READY TO SHOP?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/search" 
            className="bg-[#1d4d3a] hover:bg-[#235d46] text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-emerald-600/30 transition-colors duration-200"
          >
            SHOP NEW ARRIVALS →
          </Link>
          <Link 
            href="/help" 
            className="bg-transparent hover:bg-white/5 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider px-6 py-3 border border-gray-500 transition-colors duration-200"
          >
            HELP CENTER
          </Link>
        </div>
      </div>

    </div>
  );
}
