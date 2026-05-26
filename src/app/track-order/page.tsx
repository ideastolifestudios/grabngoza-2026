"use client";
import React, { useState } from 'react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);
    setTimeout(() => {
      alert("Order tracking system is currently in safe mode. Please check your email for the live courier link.");
      setIsTracking(false);
    }, 1000);
  };

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
            <div className="text-3xl mb-2">📍</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">
              Track Your Order
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base max-w-xl mx-auto font-medium mb-6">
              Keep an eye on your package every step of the way.
            </p>
          </div>
        </div>

        {/* Interactive Tracking Form */}
        <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10 mb-16">
          <div className="bg-white border border-gray-200/80 p-8 md:p-10 shadow-sm text-center">
            <h2 className="text-lg font-black uppercase tracking-tight text-gray-900 mb-6">Enter Details</h2>
            
            <form onSubmit={handleTrack} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Order ID *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GG-10948"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#143427] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="Email used at checkout"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#143427] transition-colors"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isTracking}
                className="w-full bg-[#143427] hover:bg-[#1b4635] disabled:opacity-70 text-white text-xs font-black tracking-widest uppercase py-4 mt-4 transition-colors duration-150"
              >
                {isTracking ? 'Searching System...' : 'Track Package →'}
              </button>
            </form>
            
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mt-6">
              Tracking information may take up to 24 hours to update after dispatch.
            </p>
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