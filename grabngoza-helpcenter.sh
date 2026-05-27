#!/usr/bin/env bash
# ================================================================
# Grab & Go — Help Center Hub + Support Pages Refactor
# Matches home page aesthetic: bg-white / bg-gray-50 / bg-[#06402B]
# Run from the root of: grabngoza-2026/
# ================================================================
set -euo pipefail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  G&G Help Center + Support Pages — Clean Rewrite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── 1. Help Center Hub (like bash.com/support/home) ─────────────────────────
echo "⚙️  [1/8] Writing src/app/help/page.tsx (Help Center Hub)..."

cat > src/app/help/page.tsx << 'FILEEOF'
"use client";
// G&G Help Center — hub page inspired by help.bash.com/support/home
// Uses home-page aesthetic: bg-white / bg-gray-50 sections / bg-[#06402B] hero
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package, RotateCcw, Truck, HelpCircle, FileText,
  Shield, MessageCircle, Search, ChevronDown, ArrowRight,
  Phone, Mail, Clock, Zap
} from "lucide-react";

const POPULAR = [
  { q: "Where is my order? Can I track it?",
    a: "Once dispatched you'll receive a tracking email with a live courier link. You can also use our Track Order page — enter your order reference (GNG-XXXXXXXX) for live status.",
    href: "/track-order" },
  { q: "What is your return policy?",
    a: "Returns accepted within 7 days of verified delivery. Items must be unworn with original tags attached. Head to our Returns page to start the process.",
    href: "/returns" },
  { q: "How long does delivery take?",
    a: "Standard: 2–5 business days nationwide. Express: 1–2 business days (major cities). Free delivery on all orders over R1,000.",
    href: "/shipping-policy" },
  { q: "What payment methods do you accept?",
    a: "We accept Visa, Mastercard, Instant EFT, Apple Pay, and Google Pay. All payments are processed securely via Yoco — your card details are never stored.",
    href: "/faq" },
  { q: "Can I modify or cancel my order after placing it?",
    a: "Contact us on WhatsApp (+27 69 163 0778) within 60 minutes of placing. After that, orders move to fulfilment and changes may not be possible.",
    href: "/faq" },
  { q: "How do I place an order on Grab & Go?",
    a: "Browse our collections, choose your size, add to cart, then checkout securely. No account needed to order. See our step-by-step guide.",
    href: "/how-to-order" },
];

const TOPICS = [
  { icon: Package,     title: "How to Order",        desc: "Step-by-step guide to placing your first order.",           href: "/how-to-order",    count: "5 articles"  },
  { icon: Search,      title: "Track My Order",       desc: "Get live status and courier tracking for your parcel.",     href: "/track-order",     count: "3 articles"  },
  { icon: Truck,       title: "Shipping & Delivery",  desc: "Delivery rates, timeframes, and nationwide coverage.",      href: "/shipping-policy", count: "6 articles"  },
  { icon: RotateCcw,   title: "Returns & Refunds",    desc: "Start a return, exchange, or claim store credit.",          href: "/returns",         count: "5 articles"  },
  { icon: HelpCircle,  title: "FAQs",                 desc: "Quick answers to our most common questions.",               href: "/faq",             count: "15 articles" },
  { icon: FileText,    title: "Our Story",            desc: "The vision and culture behind Grab & Go.",                  href: "/our-story",       count: "1 article"   },
  { icon: Shield,      title: "Privacy & Legal",      desc: "Terms of service and how we protect your data.",            href: "/legal",           count: "2 articles"  },
  { icon: MessageCircle, title: "Contact Support",    desc: "WhatsApp, email, or phone — we're always available.",       href: "#contact",         count: "Direct"      },
];

const CHANNELS = [
  { icon: MessageCircle, title: "WhatsApp",       tag: "Fastest",        desc: "Instant replies during business hours (Mon–Fri 08:00–18:00).",    action: "Chat Now",  href: "https://wa.me/27691630778", ext: true  },
  { icon: Zap,           title: "AI Chat",        tag: "24/7",           desc: "Get instant answers on orders, returns, sizing, and more.",        action: "Open Chat", href: "#chat",                     ext: false },
  { icon: Mail,          title: "Email",          tag: "Within 24h",     desc: "Detailed queries handled within one business day.",                action: "Email Us",  href: "mailto:support@shopgrabngo.co.za", ext: true },
  { icon: Phone,         title: "Phone",          tag: "Business Hours", desc: "+27 69 163 0778 · Mon–Fri 08:00–18:00 SAST.",                      action: "Call Now",  href: "tel:+27691630778",          ext: true  },
];

export default function HelpCenterPage() {
  const [q,       setQ]       = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const filteredQA = useMemo(() => {
    if (!q.trim()) return POPULAR;
    const s = q.toLowerCase();
    return POPULAR.filter(p => p.q.toLowerCase().includes(s) || p.a.toLowerCase().includes(s));
  }, [q]);

  const filteredTopics = useMemo(() => {
    if (!q.trim()) return TOPICS;
    const s = q.toLowerCase();
    return TOPICS.filter(t => t.title.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="min-h-screen bg-white text-black">

      {/* ── Sticky sub-nav ──────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/"
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#06402B] transition-colors">
            <span>←</span> Grab & Go
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#06402B]">G&G Help</span>
          <div className="flex items-center gap-6">
            <a href="#topics"  className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#06402B] transition-colors hidden sm:block">Browse Topics</a>
            <a href="#contact" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#06402B] transition-colors">Contact Us</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-[#06402B] px-6 pt-16 pb-20 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">
          Customer Support
        </span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8">
          Hi, how can we help?
        </h1>
        {/* Search bar */}
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Search for answers..."
            value={q}
            onChange={e => { setQ(e.target.value); setOpenIdx(null); }}
            className="w-full bg-white pl-12 pr-4 py-4 text-sm text-black placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#18A374]/30 shadow-lg"
          />
        </div>
        {/* Quick-search pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["Track Order", "Return Policy", "Free Delivery", "Payments"].map(label => (
            <button key={label} onClick={() => { setQ(label); setOpenIdx(null); }}
              className="px-4 py-1.5 bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white/80 hover:bg-white/20 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Popular / Search results ─────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-1.5">
                {q.trim() ? `${filteredQA.length} result${filteredQA.length !== 1 ? "s" : ""}` : "Quick Answers"}
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                {q.trim() ? `Results for "${q}"` : "Most Popular Questions"}
              </h2>
            </div>
            {q.trim() && (
              <button onClick={() => setQ("")}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                Clear ×
              </button>
            )}
          </div>

          {filteredQA.length > 0 ? (
            <div className="border border-gray-100 divide-y divide-gray-100">
              {filteredQA.map((item, i) => (
                <div key={i}>
                  <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                    <span className="text-sm font-bold text-black leading-snug">{item.q}</span>
                    <ChevronDown size={18}
                      className={`text-gray-300 flex-shrink-0 mt-0.5 transition-transform duration-200 ${openIdx === i ? "rotate-180 text-[#06402B]" : ""}`} />
                  </button>
                  {openIdx === i && (
                    <div className="px-6 pb-5 pt-2 bg-gray-50/60 border-t border-gray-100">
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.a}</p>
                      <Link href={item.href}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors">
                        Read full article <ArrowRight size={10} />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 mb-3">No results found for "{q}"</p>
              <button onClick={() => setQ("")}
                className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors">
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Browse Topics ────────────────────────────────────────────────── */}
      <section id="topics" className="py-16 px-6 bg-gray-50/40 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-1.5">Help Topics</span>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Browse by Topic</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(q.trim() ? filteredTopics : TOPICS).map((topic, i) => (
              <Link key={i} href={topic.href}
                className="bg-white border border-gray-100 p-5 hover:border-[#06402B]/30 hover:shadow-sm transition-all group">
                <topic.icon size={20} className="text-[#06402B] mb-3" strokeWidth={1.5} />
                <h3 className="text-[11px] font-black uppercase tracking-tight text-black mb-1.5 group-hover:text-[#06402B] transition-colors leading-tight">
                  {topic.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{topic.desc}</p>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#18A374]">
                  {topic.count}
                </span>
              </Link>
            ))}
          </div>
          {q.trim() && filteredTopics.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No matching topics found.</p>
          )}
        </div>
      </section>

      {/* ── Contact Channels ─────────────────────────────────────────────── */}
      <section id="contact" className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-1.5">Get in Touch</span>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black">Still Need Help?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CHANNELS.map((ch, i) => (
              <div key={i} className="border border-gray-100 p-6 flex flex-col justify-between hover:border-[#06402B]/20 hover:shadow-sm transition-all">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <ch.icon size={18} className="text-[#06402B]" strokeWidth={1.5} />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#18A374] bg-[#18A374]/8 px-2 py-0.5 border border-[#18A374]/20">
                      {ch.tag}
                    </span>
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-2">{ch.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{ch.desc}</p>
                </div>
                {ch.ext ? (
                  <a href={ch.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors">
                    {ch.action} <ArrowRight size={9} />
                  </a>
                ) : (
                  <button
                    className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors text-left">
                    {ch.action} <ArrowRight size={9} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready to Shop?</h2>
        <Link href="/"
          className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors inline-block">
          Back to Store
        </Link>
      </div>

    </div>
  );
}
FILEEOF
echo "   ✅ help/page.tsx — Help Center hub written"

# ─── 2. FAQ Page ──────────────────────────────────────────────────────────────
echo "⚙️  [2/8] Writing src/app/faq/page.tsx..."
cat > src/app/faq/page.tsx << 'FILEEOF'
"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
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

      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Still have questions?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ faq/page.tsx written"

# ─── 3. How to Order ──────────────────────────────────────────────────────────
echo "⚙️  [3/8] Writing src/app/how-to-order/page.tsx..."
cat > src/app/how-to-order/page.tsx << 'FILEEOF'
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "How to Order | Grab & Go" };
const STEPS = [
  { num: "01", title: "Browse & Pick",             body: "Explore our collections — Hoodies, Tees, Bottoms, Coats & Jackets, Accessories. Click any product to view sizes, colours, and details." },
  { num: "02", title: "Select Size & Add to Cart", body: "Choose your size using our size guide, then click Add to Cart. Your cart saves automatically — no account needed to order." },
  { num: "03", title: "Checkout Securely",         body: "Enter your shipping address and click Pay. Yoco-powered checkout accepts Visa, Mastercard, Apple Pay, and Google Pay. Card details are never stored." },
  { num: "04", title: "We Pack & Ship",            body: "Your order is processed and dispatched within 1–3 business days. You'll receive a confirmation email with live tracking details." },
  { num: "05", title: "Receive Your Gear",         body: "Your package is on its way. Track it anytime via the link in your email or our Track Order page." },
];
export default function HowToOrderPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Simple & Fast</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">How to Order</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">From browse to doorstep in a few taps.</p>
      </div>
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
              <span className="text-3xl font-black text-gray-100 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Ready? Let's go.</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop Now</Link>
          <Link href="/help" className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ how-to-order/page.tsx written"

# ─── 4. Shipping Policy ───────────────────────────────────────────────────────
echo "⚙️  [4/8] Writing src/app/shipping-policy/page.tsx..."
cat > src/app/shipping-policy/page.tsx << 'FILEEOF'
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Shipping Policy | Grab & Go" };
const RATES = [
  { method: "Standard Courier",  time: "2–5 Business Days", cost: "R80",  note: "Nationwide door-to-door" },
  { method: "Express Courier",   time: "1–2 Business Days", cost: "R150", note: "Major cities only"        },
  { method: "Free Delivery",     time: "2–5 Business Days", cost: "FREE", note: "All orders over R1,000"   },
];
const SECTIONS = [
  { title: "Processing Time",        body: "Orders are processed within 1–3 business days. Orders placed before 14:00 SAST Mon–Fri are dispatched same day. Weekend orders ship on the next business day." },
  { title: "Tracking",               body: "A tracking number is emailed once your order is dispatched. Use the Track Order page at any time to check your shipment status." },
  { title: "Delays",                 body: "While we aim for the timeframes above, public holidays, extreme weather, and courier backlogs can occasionally cause delays. We'll keep you updated by email." },
  { title: "Failed Delivery",        body: "If no one is available to receive your package, the courier will leave a notification. Contact us within 24 hours to arrange re-delivery." },
  { title: "International Shipping", body: "We currently ship within South Africa only. International shipping is coming soon — register your email on the homepage to be notified first." },
];
export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Fast & Trackable</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Shipping</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">We get your gear to you fast, tracked, and safe.</p>
      </div>
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1 space-y-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Delivery Rates</span>
          <div className="overflow-x-auto border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Method", "Timeframe", "Cost", "Notes"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RATES.map(r => (
                  <tr key={r.method} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-sm text-black">{r.method}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{r.time}</td>
                    <td className={`px-5 py-4 font-black text-sm ${r.cost === "FREE" ? "text-[#06402B]" : "text-black"}`}>{r.cost}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {SECTIONS.map(sec => (
          <div key={sec.title} className="border border-gray-100 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-3">{sec.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Track Order</Link>
          <Link href="/help" className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ shipping-policy/page.tsx written"

# ─── 5. Returns ───────────────────────────────────────────────────────────────
echo "⚙️  [5/8] Writing src/app/returns/page.tsx..."
cat > src/app/returns/page.tsx << 'FILEEOF'
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Returns & Exchanges | Grab & Go" };
const STEPS = [
  { num: "01", title: "Check Eligibility",          body: "Items must be returned within 7 days of verified delivery, unworn, with original tags attached. Sale and custom items are final sale." },
  { num: "02", title: "Contact Support",             body: "Reach out via the Help Center or WhatsApp with your Order ID and the items you wish to return. We'll confirm eligibility and issue return instructions." },
  { num: "03", title: "Ship It Back",                body: "Package items securely. Drop off at your nearest courier. Return shipping costs are covered by the customer unless the item was defective." },
  { num: "04", title: "Quality Check",               body: "Once we receive your return, our team inspects it within 1–2 business days." },
  { num: "05", title: "Exchange or Store Credit",    body: "Approved returns receive store credit or an exchange within 5–7 business days. Full refunds issued for defective or incorrectly sent items." },
];
export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Hassle-Free</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Returns</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Not happy? We'll make it right. 7-day returns, no drama.</p>
      </div>
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-6">Return Process</span>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
              <span className="text-3xl font-black text-gray-100 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-[#06402B]/5 border border-[#06402B]/10 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-2">Important Note</p>
          <p className="text-sm text-gray-600 leading-relaxed">Items that are worn, washed, damaged, or returned without original tags will not be accepted. For defective or incorrect items, we cover return shipping and issue a full refund.</p>
        </div>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ returns/page.tsx written"

# ─── 6. Our Story ─────────────────────────────────────────────────────────────
echo "⚙️  [6/8] Writing src/app/our-story/page.tsx..."
cat > src/app/our-story/page.tsx << 'FILEEOF'
import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Our Story | Grab & Go" };
const SECTIONS = [
  { title: "Where It Started",  body: "Grab & Go was born from a simple idea: bring premium streetwear to South Africa fast, clean, and without the hype tax. We saw a gap — quality pieces, accessible prices, same-day fulfilment — and we moved on it." },
  { title: "The Vision",        body: "We're not just selling clothes. We're building a culture. Every drop is curated, every piece has a story, and every customer is part of the G&G family. We collaborate with local brands, micro-influencers, and creatives who move different." },
  { title: "The Culture",       body: "The Culture Collective is at our core. We partner with MINNIEPRESS, CUSTOMSBYEBA, RESILIENT PALS, and emerging SA brands to bring you exclusive limited drops you won't find anywhere else." },
  { title: "What's Next",       body: "2026 is just the beginning. New brands, bigger drops, more collections. We're building something real — a streetwear hub that represents South African culture on a global stage. Stay locked in." },
];
export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Established 2026</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Our Story</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">The vision, the hustle, and the culture behind Grab & Go.</p>
      </div>
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1 space-y-4">
        {SECTIONS.map(sec => (
          <div key={sec.title} className="border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#06402B] mb-3">{sec.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-5">Be Part of the Culture</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop the Drops</Link>
          <a href="https://www.instagram.com/grabngoza" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Follow @grabngoza</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ our-story/page.tsx written"

# ─── 7. Legal ─────────────────────────────────────────────────────────────────
echo "⚙️  [7/8] Writing src/app/legal/page.tsx..."
cat > src/app/legal/page.tsx << 'FILEEOF'
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
FILEEOF
echo "   ✅ legal/page.tsx written"

# ─── 8. Track Order ───────────────────────────────────────────────────────────
echo "⚙️  [8/8] Writing src/app/track-order/page.tsx..."
cat > src/app/track-order/page.tsx << 'FILEEOF'
"use client";
import React, { useState } from "react";
import Link from "next/link";
export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<null | "notfound">(null);
  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false); setResult("notfound");
  };
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Real-Time</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Track Order</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Enter your order reference to see live shipment status.</p>
      </div>
      <div className="max-w-lg mx-auto w-full px-6 py-16 flex-1">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Reference *</label>
            <input type="text" required placeholder="GNG-XXXXXXXX"
              value={orderId} onChange={e => setOrderId(e.target.value)}
              className="w-full border border-gray-200 px-5 py-4 text-sm text-black placeholder:text-gray-300 outline-none focus:border-[#06402B]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email Address *</label>
            <input type="email" required placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-5 py-4 text-sm text-black placeholder:text-gray-300 outline-none focus:border-[#06402B]/40 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#06402B] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#06402B]/90 transition-colors disabled:opacity-50">
            {loading ? "Looking up..." : "Track My Order"}
          </button>
        </form>
        {result === "notfound" && (
          <div className="mt-8 border border-gray-100 p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Not Found</p>
            <p className="text-sm text-gray-500 mb-4">Check your confirmation email for the correct reference, or contact us directly.</p>
            <div className="flex justify-center gap-4">
              <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:underline">Help Center</Link>
              <span className="text-gray-200">|</span>
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:underline">WhatsApp</a>
            </div>
          </div>
        )}
        <div className="mt-8 bg-gray-50 border border-gray-100 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-2">Tip</p>
          <p className="text-xs text-gray-500 leading-relaxed">Your order reference starts with <strong className="text-black">GNG-</strong> and is in your confirmation email. You can also track via the courier link in your dispatch email.</p>
        </div>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ track-order/page.tsx written"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All 8 files written! Run the build fix first, then:"
echo ""
echo "  git add -A"
echo '  git commit -m "feat: G&G Help Center hub + refactored support pages (white aesthetic)"'
echo "  git push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
