"use client";
import React, { useState } from "react";
import Link from "next/link";
const SECTIONS = [
  { id: "privacy", title: "Privacy Policy", content: [
    { sub: "What We Collect",   body: "Name, email, shipping address, and payment info provided directly. Also usage data: pages visited, device type, and IP address." },
    { sub: "How We Use It",     body: "To process orders, send confirmations, provide support, and (with consent) send marketing. We never sell your personal data to third parties." },
    { sub: "Cookies",           body: "Used to maintain your session, remember cart contents, and analyse performance. Disable in browser settings — some features may not function correctly." },
    { sub: "Data Security",     body: "All data is SSL-encrypted. Payment processing is handled by Yoco (PCI-DSS compliant). We do not store full card numbers." },
    { sub: "Your Rights",       body: "Access, correct, or delete your data at any time. Email support@shopgrabngo.co.za to submit a data request." },
  ]},
  { id: "terms", title: "Terms of Service", content: [
    { sub: "Acceptance",              body: "By using shopgrabngo.co.za you agree to these terms. If you do not agree, please do not use our site." },
    { sub: "Orders",                  body: "All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order. You will be notified and fully refunded if we cancel." },
    { sub: "Pricing",                 body: "All prices are in South African Rand (ZAR) and include VAT. The price at checkout is the final price you pay." },
    { sub: "Intellectual Property",   body: "All content — images, text, logos, and branding — is owned by Grab & Go or our brand partners and may not be reproduced without written permission." },
    { sub: "Limitation of Liability", body: "Grab & Go is not liable for indirect or consequential damages beyond the value of the original purchase." },
  ]},
];
export default function LegalPage() {
  const [active, setActive] = useState("privacy");
  const section = SECTIONS.find(s => s.id === active)!;
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Transparency</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Legal</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Our terms and how we protect your data.</p>
      </div>
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1">
        <div className="flex gap-2 mb-10">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all ${
                active === s.id ? "bg-[#06402B] text-white border-[#06402B]" : "bg-white text-gray-500 border-gray-200 hover:border-[#06402B]/30"
              }`}>
              {s.title}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {section.content.map(item => (
            <div key={item.sub} className="border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-3">{item.sub}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-8 text-center">Last updated: May 2026 · <a href="mailto:support@shopgrabngo.co.za" className="text-[#06402B] hover:underline">support@shopgrabngo.co.za</a></p>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors inline-block">Back to Store</Link>
      </div>
    </div>
  );
}
