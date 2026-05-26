"use client";
import Link from "next/link";
import { useState } from "react";

const FAQS = [
  { q: "How quickly will my order be processed?", a: "Orders placed before 14:00 SAST Mon–Fri are processed same business day. Weekend orders go out the next business day." },
  { q: "Can I modify or cancel my order after placing it?", a: "Within 1 hour of placing your order, contact us on WhatsApp (+27 69 163 0778). After that the order moves to fulfilment and changes may not be possible." },
  { q: "Will I receive an order confirmation?", a: "Yes — an automated confirmation email is sent immediately after checkout. Check your spam folder if you don't see it within a few minutes." },
  { q: "What payment methods do you accept?", a: "We accept credit/debit cards (Visa, Mastercard), Instant EFT, and selected BNPL providers. All transactions are SSL-encrypted via Yoco." },
  { q: "Is my payment information secure?", a: "Completely. All transactions are PCI-DSS compliant. Your card details are never stored on our servers." },
  { q: "What are the delivery timeframes?", a: "Standard: 2–5 business days. Express: 1–2 business days. You'll receive a tracking link once dispatched." },
  { q: "Do you ship nationwide?", a: "Yes — we ship to all provinces across South Africa via courier, with door-to-door delivery." },
  { q: "How do I track my order?", a: "Head to our Track Order page and enter your order reference. You'll also receive tracking details by email once your order is dispatched." },
  { q: "What is your return policy?", a: "Items can be returned within 7 days of verified delivery for store credit or exchange. Merchandise must be unworn with original tags attached." },
  { q: "How do I initiate a return?", a: "Visit our Returns page or contact support with your Order ID and the items you wish to return. We'll guide you through the process." },
  { q: "How long does a refund take?", a: "Once your return passes our quality check, refunds or store credit are processed within 5–7 business days." },
  { q: "Do you have a physical store?", a: "Grab & Go is exclusively online — fast, trackable delivery straight to your door, nationwide." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen(open === i ? null : i);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 transition-colors mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Grab & Go</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">FAQs</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Quick answers to the questions we get most.</p>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-[#1a2e23] bg-[#0d1410]">
              <button
                onClick={() => toggle(i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#111c14] transition-colors"
              >
                <span className="text-sm font-bold text-white tracking-tight">{faq.q}</span>
                <span className="text-[#18A374] flex-shrink-0 text-xl font-light">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 pt-1 border-t border-[#1a2e23] text-sm text-white/60 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Still have questions?</h2>
        <p className="text-white/50 text-sm mb-6">Our team is ready to help.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Desk</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
