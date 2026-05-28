"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  Package, RotateCcw, Truck, HelpCircle, FileText,
  Shield, MessageCircle, Search, ChevronDown, ArrowRight,
  Phone, Mail, Zap
} from "lucide-react";
import SupportLayout from "@/components/SupportLayout";

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
  { icon: Package,       title: "How to Order",       desc: "Step-by-step guide to placing your first order.",           href: "/how-to-order",    count: "5 articles"  },
  { icon: Search,        title: "Track My Order",      desc: "Get live status and courier tracking for your parcel.",     href: "/track-order",     count: "3 articles"  },
  { icon: Truck,         title: "Shipping & Delivery", desc: "Delivery rates, timeframes, and nationwide coverage.",      href: "/shipping-policy", count: "6 articles"  },
  { icon: RotateCcw,     title: "Returns & Refunds",   desc: "Start a return, exchange, or claim store credit.",          href: "/returns",         count: "5 articles"  },
  { icon: HelpCircle,    title: "FAQs",                desc: "Quick answers to our most common questions.",               href: "/faq",             count: "15 articles" },
  { icon: FileText,      title: "Our Story",           desc: "The vision and culture behind Grab & Go.",                  href: "/our-story",       count: "1 article"   },
  { icon: Shield,        title: "Privacy & Legal",     desc: "Terms of service and how we protect your data.",            href: "/legal",           count: "2 articles"  },
  { icon: MessageCircle, title: "Contact Support",     desc: "WhatsApp, email, or phone — we're always available.",       href: "#contact",         count: "Direct"      },
];

const CHANNELS = [
  { icon: MessageCircle, title: "WhatsApp", tag: "Fastest",        desc: "Instant replies during business hours (Mon–Fri 08:00–18:00).", action: "Chat Now",  href: "https://wa.me/27691630778",        ext: true  },
  { icon: Zap,           title: "AI Chat",  tag: "24/7",           desc: "Get instant answers on orders, returns, sizing, and more.",    action: "Open Chat", href: "#chat",                             ext: false },
  { icon: Mail,          title: "Email",    tag: "Within 24h",     desc: "Detailed queries handled within one business day.",            action: "Email Us",  href: "mailto:support@shopgrabngo.co.za",  ext: true  },
  { icon: Phone,         title: "Phone",    tag: "Business Hours", desc: "+27 69 163 0778 · Mon–Fri 08:00–18:00 SAST.",                  action: "Call Now",  href: "tel:+27691630778",                  ext: true  },
];

export default function HelpCenterPage() {
  const [q, setQ]           = useState("");
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
    <SupportLayout backLabel="Grab & Go" backHref="/">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="bg-[#06402B] px-6 pt-16 pb-20 text-center">
        <Link href="/" className="inline-block mb-8">
          <Logo className="h-10 w-auto mx-auto" light />
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">
          Customer Support
        </span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-8">
          Hi, how can we help?
        </h1>
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
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {["Track Order", "Return Policy", "Free Delivery", "Payments"].map(label => (
            <button key={label} onClick={() => { setQ(label); setOpenIdx(null); }}
              className="px-4 py-1.5 bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white/80 hover:bg-white/20 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Popular / Search results ──────────────────────────────────── */}
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

      {/* ── Browse Topics ─────────────────────────────────────────────── */}
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
                <span className="text-[9px] font-black uppercase tracking-widest text-[#18A374]">{topic.count}</span>
              </Link>
            ))}
          </div>
          {q.trim() && filteredTopics.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No matching topics found.</p>
          )}
        </div>
      </section>

      {/* ── Contact Channels ──────────────────────────────────────────── */}
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
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#18A374] bg-[#18A374]/10 px-2 py-0.5 border border-[#18A374]/20">
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
                  <button className="inline-flex items-center gap-1.5 mt-4 text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors text-left">
                    {ch.action} <ArrowRight size={9} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────────────── */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready to Shop?</h2>
        <Link href="/"
          className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors inline-block">
          Back to Store
        </Link>
      </div>

    </SupportLayout>
  );
}
