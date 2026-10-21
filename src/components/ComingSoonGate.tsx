'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ComingSoonGate() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid code');

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Access verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-xs font-mono tracking-widest text-[#18A374] uppercase mb-2">Grab &amp; Go ZA</p>
          <h1 className="text-2xl font-black tracking-tight">Private Storefront</h1>
          <p className="text-xs text-gray-500 mt-2 font-mono">Enter your guest access code to preview the store.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-wider text-gray-400 uppercase mb-2">Access Code</label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code..."
              required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-[#18A374] transition"
            />
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs text-red-400 font-mono">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#18A374] hover:bg-[#158f66] text-black font-extrabold uppercase text-xs tracking-widest py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Store'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a href="/admin/login" className="text-[10px] font-mono text-gray-600 hover:text-gray-400 underline">
            Admin Portal Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
