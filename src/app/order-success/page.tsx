'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">Order Confirmed!</h1>
        <p className="text-sm text-gray-500 mb-8">
          Thank you for your purchase. Your payment was processed successfully.
        </p>
        <Link
          href="/"
          className="px-8 py-4 bg-black text-white font-bold uppercase tracking-widest text-xs rounded hover:opacity-90 transition-opacity"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
}