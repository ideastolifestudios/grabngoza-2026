"use client";
import React, { useState } from "react";
import Link from "next/link";

const SECTIONS = [
  {
    id: "privacy",
    title: "Privacy Policy",
    content: [
      { sub: "What We Collect", body: "We collect information you provide directly: name, email address, shipping address, and payment information. We also collect usage data such as pages visited, device type, and IP address." },
      { sub: "How We Use It",   body: "Your data is used to process orders, send confirmations, provide customer support, and (with your consent) send marketing communications. We never sell your personal data to third parties." },
      { sub: "Cookies",         body: "We use cookies to maintain your session, remember cart contents, and analyse site performance. You can disable cookies in your browser settings, though some features may not function correctly." },
      { sub: "Data Security",   body: "All data is transmitted via SSL encryption. Payment processing is handled by Yoco (PCI-DSS compliant). We do not store full card numbers on our servers." },
      { sub: "Your Rights",     body: "You have the right to access, correct, or delete your personal data at any time. Contact us at support@shopgrabngo.co.za to submit a data request." },
    ],
  },
  {
    id: "terms",
    title: "Terms of Service",
    content: [
      { sub: "Acceptance",       body: "By using shopgrabngo.co.za you agree to these terms. If you do not agree, please do not use our site." },
      { sub: "Orders",           body: "All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order at our discretion. You will be notified and fully refunded if we cancel an order." },
      { sub: "Pricing",          body: "All prices are in South African Rand (ZAR) and include VAT. We reserve the right to change prices at any time. The price at checkout is the price you pay." },
      { sub: "Intellectual Property", body: "All content on this site — images, text, logos, and branding — is owned by Grab & Go or our brand partners and may not be reproduced without written permission." },
      { sub: "Limitation of Liability", body: "Grab & Go is not liable for indirect, incidental, or consequential damages arising from the use of our products or services beyond the value of the original purchase." },
    ],
  },
];

export default function LegalPage() {
  const [active, setActive] = useState("privacy");
  const section = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Transparency</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Legal</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Our terms, conditions, and how we protect your data.</p>
      </div>

      {/* Tabs + Content */}
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1">
        {/* Tab Pills */}
        <div className="flex gap-2 mb-10">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${
                active === s.id ? "bg-[#18A374] text-black border-[#18A374]" : "bg-transparent text-white/50 border-[#1a2e23] hover:border-[#18A374]/40 hover:text-white"
              }`}>
              {s.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {section.content.map(item => (
            <div key={item.sub} className="bg-[#0d1410] border border-[#1a2e23] p-6 md:p-8">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-3">{item.sub}</h3>
              <p className="text-sm text-white/70 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/30 mt-8 text-center">Last updated: May 2026 · Questions? <a href="mailto:support@shopgrabngo.co.za" className="text-[#18A374] hover:underline">support@shopgrabngo.co.za</a></p>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors inline-block">
          Back to Store
        </Link>
      </div>
    </div>
  );
}
