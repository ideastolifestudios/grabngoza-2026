"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SupportLayout from "@/components/SupportLayout";

const FAQS = [
  { q: "How quickly will my order be processed?",    a: "Orders placed before 14:00 SAST Mon–Fri are processed same business day. Weekend orders ship the next business day." },
  { q: "Can I modify or cancel my order?",           a: "Within 60 minutes of placing — contact us on WhatsApp (+27 69 163 0778). After that the order moves to fulfilment." },
  { q: "Will I receive an order confirmation?",      a: "Yes — an automated confirmation email is sent immediately after checkout. Check spam if you don't see it within a few minutes." },
  { q: "What payment methods do you accept?",        a: "Visa, Mastercard, Instant EFT, Apple Pay, Google Pay — all processed securely via Yoco. Your card details are never stored." },
  { q: "Is my payment information secure?",          a: "Completely. All transactions are PCI-DSS compliant and SSL-encrypted." },
  { q: "What are the delivery timeframes?",          a: "Standard: 2–5 business days. Express: 1–2 business days. You'll receive a tracking link once dispatched." },
  { q: "Do you ship nationwide?",                    a: "Yes — all provinces across South Africa via courier, door-to-door delivery." },
  { q: "How do I track my order?",                   a: "Head to our Track Order page and enter your order reference. Tracking details are also emailed once dispatched." },
  { q: "What is your return policy?",                a: "Items returned within 7 days of verified delivery for store credit or exchange. Must be unworn with original tags." },
  { q: "How do I initiate a return?",                a: "Visit the Returns page or contact support with your Order ID and items. We'll guide you through." },
  { q: "How long does a refund take?",               a: "5–7 business days after your return passes our quality inspection." },
  { q: "Do you have a physical store?",              a: "Grab & Go is exclusively online — fast, trackable delivery to your door." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <SupportLayout>
      {/* Hero */}
      <div className="bg-[#06402B] pt-16 pb-16 text-center px-6">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Knowledge Base</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">FAQs</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Quick answers to the questions we get asked most.</p>
      </div>

      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="border border-gray-100 divide-y divide-gray-100">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                <span className="text-sm font-bold text-black">{faq.q}</span>
                <ChevronDown size={18} className={`text-gray-300 flex-shrink-0 mt-0.5 transition-transform ${open === i ? "rotate-180 text-[#06402B]" : ""}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-2 bg-gray-50/60 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Still have questions?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </SupportLayout>
  );
}
