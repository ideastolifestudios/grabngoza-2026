import Link from 'next/link';

const SECTIONS = [
  { href: '/admin/orders',    label: 'Orders',      desc: 'Manage & dispatch',         color: '#f59e0b', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/admin/products',  label: 'Products',    desc: 'Inventory & listings',        color: '#18A374', d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
  { href: '/admin/customers', label: 'Customers',   desc: 'Profiles & order history',    color: '#3b82f6', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/admin/analytics', label: 'Analytics',   desc: 'Revenue & performance',       color: '#8b5cf6', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/admin/promotions',label: 'Promotions',  desc: 'Discounts & campaigns',       color: '#ec4899', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/admin/activity',  label: 'Activity Log',desc: 'Audit trail',                color: '#6b7280', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
] as const;

export default function AdminHub() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-3xl mx-auto">
        <p className="text-[10px] font-bold tracking-[3px] uppercase text-[#18A374] mb-2 font-mono">
          Grab &amp; Go ZA
        </p>
        <h1 className="text-2xl font-black tracking-tight text-white mb-1">Operations Hub</h1>
        <p className="text-[#555] text-xs font-mono mb-8">Select a section</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SECTIONS.map(({ href, label, desc, color, d }) => (
            <Link key={href} href={href}
              className="block bg-[#111] border border-[#1e1e1e] rounded-lg p-5 hover:border-[#333] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <svg className="w-4 h-4" fill="none" stroke={color} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={d}/>
                  </svg>
                </div>
                <span className="font-bold text-sm text-white">{label}</span>
              </div>
              <p className="text-[10px] text-[#555] font-mono">{desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 pt-5 border-t border-[#1e1e1e]">
          <a href="/api/auth/session"
            onClick={async (e) => {
              e.preventDefault();
              await fetch('/api/auth/session', { method: 'DELETE' });
              window.location.href = '/admin/login';
            }}
            className="text-[10px] font-mono tracking-[2px] uppercase text-[#444] hover:text-[#888]">
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}
