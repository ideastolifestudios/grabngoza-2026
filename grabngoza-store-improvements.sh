#!/usr/bin/env bash
# ================================================================
# Grab & Go — Store Improvements Patch
# Run from the root of: grabngoza-2026/
# ================================================================
set -euo pipefail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Grab & Go — Applying Store Improvements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── PART 1: Patch src/App.tsx ────────────────────────────────────────────────
echo "⚙️  [1/10] Patching src/App.tsx..."

cat > /tmp/patch-gng-app.mjs << 'NODEEOF'
import { readFileSync, writeFileSync } from 'fs';
const file = 'src/App.tsx';
let code = readFileSync(file, 'utf8');
const log = [];

function r(from, to, label) {
  if (code.includes(from)) {
    code = code.replace(from, to);
    log.push('  ✅ ' + label);
  } else {
    log.push('  ⚠️  NOT FOUND: ' + label);
  }
}

// 1. Remove Store Locator (MapPin) button
r(
  `            <button aria-label="Store Locator" className="p-2 text-white/90 hover:text-[#18A374] transition-colors hidden sm:block">
              <MapPin size={20} strokeWidth={1.2} />
            </button>`,
  ``,
  'Remove MapPin / Store Locator button'
);

// 2. Menu button: show on ALL screen sizes (remove lg:hidden)
r(
  `<button onClick={onOpenMenu} aria-label="Menu" className="lg:hidden p-2 text-white/90">`,
  `<button onClick={onOpenMenu} aria-label="Menu" className="p-2 text-white/90">`,
  'Menu button accessible on desktop (lg:hidden removed)'
);

// 3. Profile button: open side menu when logged in, show avatar/initials
r(
  `            <button 
              onClick={onOpenAuth}
              aria-label="Account"
              className="p-2 text-white/90 hover:text-[#18A374] transition-colors hidden sm:block"
            >
              <UserIcon size={20} strokeWidth={1.2} />
            </button>`,
  `            <button
              onClick={user ? onOpenMenu : onOpenAuth}
              aria-label="Account"
              className="p-2 text-white/90 hover:text-[#18A374] transition-colors hidden sm:block"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.firstName} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : user ? (
                <span className="w-5 h-5 rounded-full bg-[#18A374] text-black text-[8px] font-black inline-flex items-center justify-center">{user.firstName?.[0]}{user.lastName?.[0]}</span>
              ) : (
                <UserIcon size={20} strokeWidth={1.2} />
              )}
            </button>`,
  'Profile button: avatar/initials when logged in; opens side menu'
);

// 4. Hero slide 2: replace Unsplash with real image
r(
  `"https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=2000"`,
  `"https://res.cloudinary.com/dggitwduo/image/upload/v1779107822/grab-go-za/mumxdlfw7ijmrc0plyfh.jpg"`,
  'Hero slide 2 → real Cloudinary image'
);

// 5. Hero slide 3: replace Unsplash with real image
r(
  `"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=2000"`,
  `"https://res.cloudinary.com/dggitwduo/image/upload/v1774451791/grab-go-za/ccvw1hia86fbxskoqvjc.png"`,
  'Hero slide 3 → real Cloudinary image'
);

// 6. BrandBanner: remove broken picsum fallback, only render img when banner URL exists
const picsumMarker = 'picsum.photos/seed/';
const picsumIdx = code.indexOf(picsumMarker);
if (picsumIdx > -1) {
  // Find the src= attribute start (look back from picsum for src={)
  const srcStart = code.lastIndexOf('src={', picsumIdx);
  // Find end of this attribute (next line's closing quote + possible attributes)
  const imgTagEnd = code.indexOf('/>', picsumIdx);
  // Replace from src= up to (but not including) />
  const oldSrc = code.slice(srcStart, imgTagEnd);
  const newSrc = `src={banner || ''}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}`;
  code = code.slice(0, srcStart) + newSrc + code.slice(imgTagEnd);
  log.push('  ✅ BrandBanner: fix broken picsum fallback');
} else {
  log.push('  ⚠️  NOT FOUND: BrandBanner picsum src');
}

// 7. Add ChatWidget import (after SupportChat comment)
r(
  `// import SupportChat from "./components/SupportChat";`,
  `// import SupportChat from "./components/SupportChat";
import ChatWidget from "./components/ChatWidget";`,
  'Import ChatWidget'
);

// 8. Activate ChatWidget in JSX (replace first {/* <SupportChat /> */})
const chatTarget = '{/* <SupportChat /> */}';
const chatIdx = code.indexOf(chatTarget);
if (chatIdx > -1) {
  code = code.slice(0, chatIdx) + '<ChatWidget />' + code.slice(chatIdx + chatTarget.length);
  log.push('  ✅ Activated ChatWidget in JSX');
  // Remove second occurrence if present
  if (code.includes(chatTarget)) {
    code = code.replace(chatTarget, '');
    log.push('  ✅ Removed second SupportChat comment');
  }
} else {
  log.push('  ⚠️  NOT FOUND: ChatWidget JSX slot');
}

writeFileSync(file, code, 'utf8');
log.forEach(l => console.log(l));
console.log('\n🎉  src/App.tsx patched successfully\n');
NODEEOF

node /tmp/patch-gng-app.mjs

# ─── PART 2: ChatWidget.tsx ───────────────────────────────────────────────────
echo "⚙️  [2/10] Writing upgraded ChatWidget.tsx..."

cat > src/components/ChatWidget.tsx << 'FILEEOF'
"use client";
// ChatWidget.tsx — Upgraded: AI + Quick Actions + Order Lookup + WhatsApp Handoff
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, X, Send, Loader2, Phone, Package,
  RotateCcw, HelpCircle, Search, ChevronDown, ChevronUp
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  ts: Date;
}

let _id = 0;
const uid = () => `m${Date.now()}${++_id}`;

function isBusinessHours(): boolean {
  const sast = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
  const d = sast.getDay();
  const h = sast.getHours();
  return d >= 1 && d <= 5 && h >= 8 && h < 18;
}

const QUICK_ACTIONS = [
  { icon: Package,    label: "Track Order",  msg: "I want to track my order. Can you help?" },
  { icon: RotateCcw,  label: "Start Return", msg: "I need to start a return or exchange." },
  { icon: HelpCircle, label: "FAQ",          msg: "What are the most common questions you get?" },
];

const WHATSAPP = "27691630778";
const WA_URL   = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hi Grab & Go! I need help with my order.")}`;

export default function ChatWidget() {
  const [open,    setOpen]    = useState(false);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [unread,  setUnread]  = useState(0);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupId,   setLookupId]   = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    id: uid(), role: "model", ts: new Date(),
    text: "Hey! Welcome to Grab & Go 👋 I'm your AI support assistant. Ask me anything about orders, shipping, returns, or sizing — I've got you."
  }]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const online    = isBusinessHours();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); } }, [open]);

  const addMsg = (role: "user" | "model", text: string) => {
    const m: Message = { id: uid(), role, text, ts: new Date() };
    setMessages(prev => [...prev, m]);
    return m;
  };

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setShowLookup(false);
    addMsg("user", text);
    setLoading(true);

    const history = messages
      .filter(m => m.role === "user" || m.role === "model")
      .map(m => ({ role: m.role, text: m.text }));
    history.push({ role: "user", text });

    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }) });
      const data = await res.json();
      const reply = data?.reply ?? data?.text ?? "I'm having trouble right now. Please reach us on WhatsApp below!";
      addMsg("model", reply);
    } catch {
      addMsg("model", "Something went wrong — please reach us on WhatsApp below for immediate help!");
    } finally {
      setLoading(false);
      if (!open) setUnread(n => n + 1);
    }
  };

  const handleOrderLookup = () => {
    if (!lookupId.trim()) return;
    const msg = `Can you help me check on order #${lookupId.trim()}${lookupEmail ? ` for ${lookupEmail.trim()}` : ""}?`;
    setLookupId(""); setLookupEmail(""); setShowLookup(false);
    sendMessage(msg);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] bg-[#080f0b] border border-[#1a2e23] rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 100px)" }}>

          {/* ── Header ── */}
          <div className="bg-[#06402B] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#18A374] flex items-center justify-center flex-shrink-0">
                <MessageCircle size={14} className="text-black" />
              </div>
              <div>
                <p className="text-white text-[11px] font-black uppercase tracking-widest leading-none">G&G Support</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${online ? "bg-[#18A374]" : "bg-yellow-400"}`} />
                  <span className="text-white/50 text-[9px] uppercase tracking-widest">
                    {online ? "Live · Mon–Fri 8–18" : "AI Available 24/7"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <X size={16} className="text-white/70" />
            </button>
          </div>

          {/* ── Quick Actions ── */}
          <div className="flex gap-1.5 px-4 py-3 border-b border-[#1a2e23] flex-shrink-0">
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => sendMessage(a.msg)}
                className="flex-1 py-2 px-1.5 bg-[#0d1410] border border-[#1a2e23] rounded-lg text-[9px] font-black uppercase tracking-wide text-[#18A374] hover:bg-[#18A374]/10 transition-colors flex flex-col items-center gap-1">
                <a.icon size={13} />
                <span>{a.label}</span>
              </button>
            ))}
            <button onClick={() => setShowLookup(s => !s)}
              className="flex-1 py-2 px-1.5 bg-[#0d1410] border border-[#1a2e23] rounded-lg text-[9px] font-black uppercase tracking-wide text-[#18A374] hover:bg-[#18A374]/10 transition-colors flex flex-col items-center gap-1">
              <Search size={13} />
              <span>Order #</span>
            </button>
          </div>

          {/* ── Order Lookup Panel ── */}
          {showLookup && (
            <div className="px-4 py-3 bg-[#0a1209] border-b border-[#1a2e23] flex-shrink-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Order Lookup</p>
              <input value={lookupId} onChange={e => setLookupId(e.target.value)}
                placeholder="Order #GNG-..."
                className="w-full bg-[#0d1410] border border-[#1a2e23] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 mb-2" />
              <input value={lookupEmail} onChange={e => setLookupEmail(e.target.value)}
                placeholder="Email (optional)"
                className="w-full bg-[#0d1410] border border-[#1a2e23] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 mb-2" />
              <button onClick={handleOrderLookup}
                className="w-full py-2 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#18A374]/90 transition-colors">
                Look Up Order
              </button>
            </div>
          )}

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#18A374] text-black font-medium rounded-br-sm"
                    : "bg-[#111c14] text-white/80 border border-[#1a2e23] rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#111c14] border border-[#1a2e23] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-[#18A374]" />
                  <span className="text-white/40 text-[10px]">Typing...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── WhatsApp CTA ── */}
          {!online && (
            <div className="px-4 py-2 border-t border-[#1a2e23] flex-shrink-0">
              <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-lg text-[#25D366] text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-colors">
                <Phone size={11} />
                Continue on WhatsApp
              </a>
            </div>
          )}

          {/* ── Input ── */}
          <div className="px-4 py-3 flex gap-2 border-t border-[#1a2e23] flex-shrink-0">
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && !loading && sendMessage()}
              placeholder="Ask anything..."
              className="flex-1 bg-[#111c14] border border-[#1a2e23] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-9 h-9 bg-[#18A374] rounded-xl flex items-center justify-center hover:bg-[#18A374]/80 transition-colors disabled:opacity-30 flex-shrink-0">
              <Send size={14} className="text-black" />
            </button>
          </div>
        </div>
      )}

      {/* ── Toggle FAB ── */}
      <button onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 bg-[#18A374] rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
        {open ? <X size={22} className="text-black" /> : <MessageCircle size={22} className="text-black" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
FILEEOF
echo "   ✅ ChatWidget.tsx written"

# ─── PART 3: FAQ Page (dark redesign with real FAQ content) ───────────────────
echo "⚙️  [3/10] Writing src/app/faq/page.tsx..."

cat > src/app/faq/page.tsx << 'FILEEOF'
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
FILEEOF
echo "   ✅ faq/page.tsx written"

# ─── PART 4: Help Desk Page (dark redesign, full content preserved) ───────────
echo "⚙️  [4/10] Writing src/app/help/page.tsx..."

cat > src/app/help/page.tsx << 'FILEEOF'
"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";

const FAQ_DATA = [
  { id: "q1",  category: "orders",   question: "How quickly will my order be processed?",       answer: "Orders are processed within 1–2 business days. Once dispatched you will receive a tracking confirmation via email." },
  { id: "q2",  category: "orders",   question: "Can I modify or cancel my order after placing it?", answer: "Modifications are only possible within 60 minutes of placing the order — reach out via WhatsApp immediately." },
  { id: "q3",  category: "orders",   question: "Will I receive an order confirmation?",          answer: "Yes — an automated confirmation email is dispatched immediately upon secure payment authorisation." },
  { id: "q4",  category: "payments", question: "What payment methods do you accept?",            answer: "We support credit/debit cards (Visa, Mastercard), Instant EFT, and selected BNPL providers. Checkout is powered by Yoco." },
  { id: "q5",  category: "payments", question: "How do installment payments work?",              answer: "Select your preferred BNPL option at checkout to split your total into equal interest-free monthly payments." },
  { id: "q6",  category: "payments", question: "Is my payment information secure?",              answer: "Completely. All transactions are PCI-DSS compliant and SSL-encrypted. Your card details are never stored." },
  { id: "q7",  category: "shipping", question: "What are the delivery timeframes?",              answer: "Standard: 2–5 business days. Express: 1–2 business days. Tracked courier nationwide." },
  { id: "q8",  category: "shipping", question: "Do you ship nationwide?",                       answer: "Yes — we deliver to all provinces across South Africa, door-to-door via courier." },
  { id: "q9",  category: "shipping", question: "How do I track my order?",                      answer: "Use the Track Order page with the reference in your dispatch confirmation email." },
  { id: "q10", category: "returns",  question: "What is your return policy?",                   answer: "Items can be returned within 7 days of delivery for store credit or exchange. Must be unworn with original tags." },
  { id: "q11", category: "returns",  question: "How do I initiate a return or exchange?",       answer: "Visit our Returns page or contact support with your Order ID and items you wish to return." },
  { id: "q12", category: "returns",  question: "How long does a refund take?",                  answer: "5–7 business days after your return passes our quality inspection." },
  { id: "q13", category: "support",  question: "What are your support hours?",                  answer: "Monday–Friday, 08:00–18:00 SAST. Our AI assistant is available 24/7." },
  { id: "q14", category: "support",  question: "How quickly will I get a response?",            answer: "WhatsApp within minutes during business hours. Email within 24 hours." },
  { id: "q15", category: "support",  question: "Do you have a physical store?",                 answer: "Grab & Go is exclusively online — fast, trackable delivery to your door." },
];

const CATEGORIES = [
  { id: "all",      label: "All" },
  { id: "orders",   label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "shipping", label: "Shipping" },
  { id: "returns",  label: "Returns" },
  { id: "support",  label: "Support" },
];

const CHANNELS = [
  { title: "WhatsApp", sub: "Fastest response during business hours", href: "https://wa.me/27691630778", cta: "Chat Now →" },
  { title: "Email",    sub: "Detailed tickets, within 24 hours",       href: "mailto:support@shopgrabngo.co.za", cta: "Email Us →" },
  { title: "Phone",    sub: "+27 69 163 0778",                         href: "tel:+27691630778", cta: "Call Now →" },
  { title: "Hours",    sub: "Mon–Fri  08:00–18:00 SAST",               href: null, cta: "Leave a message" },
];

export default function HelpCenterPage() {
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("all");
  const [accordion,   setAccordion]   = useState<string | null>(null);
  const [form,        setForm]        = useState({ name: "", email: "", subject: "Order Issue", message: "" });
  const [formSuccess, setFormSuccess] = useState(false);

  const filtered = useMemo(() =>
    FAQ_DATA.filter(f =>
      (category === "all" || f.category === category) &&
      (f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
    ), [search, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSuccess(true);
    setForm({ name: "", email: "", subject: "Order Issue", message: "" });
    setTimeout(() => setFormSuccess(false), 6000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Customer Support</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Help Center</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Fast answers, multiple support channels, and a team ready to help.</p>
      </div>

      {/* Contact Channels */}
      <div className="max-w-6xl mx-auto w-full px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CHANNELS.map(ch => (
            <div key={ch.title} className="bg-[#0d1410] border border-[#1a2e23] p-5 flex flex-col justify-between group hover:border-[#18A374]/40 transition-colors">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">{ch.title}</p>
                <p className="text-xs text-white/50">{ch.sub}</p>
              </div>
              {ch.href ? (
                <a href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-widest text-white mt-4 hover:text-[#18A374] transition-colors">
                  {ch.cta}
                </a>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-4">{ch.cta}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto w-full px-6 py-16">
        <div className="mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Knowledge Base</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Frequently Asked</h2>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <input type="text" placeholder="Search questions..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0d1410] border border-[#1a2e23] px-5 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${
                category === cat.id
                  ? "bg-[#18A374] text-black border-[#18A374]"
                  : "bg-transparent text-white/50 border-[#1a2e23] hover:border-[#18A374]/40 hover:text-white"
              }`}>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {filtered.length > 0 ? filtered.map(faq => (
            <div key={faq.id} className="border border-[#1a2e23] bg-[#0d1410]">
              <button onClick={() => setAccordion(accordion === faq.id ? null : faq.id)}
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#111c14] transition-colors">
                <span className="text-sm font-bold text-white">{faq.question}</span>
                <span className="text-[#18A374] flex-shrink-0 text-xl font-light">{accordion === faq.id ? "−" : "+"}</span>
              </button>
              {accordion === faq.id && (
                <div className="px-6 pb-5 pt-1 border-t border-[#1a2e23] text-sm text-white/60 leading-relaxed">{faq.answer}</div>
              )}
            </div>
          )) : (
            <div className="text-center py-12 border border-dashed border-[#1a2e23]">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">No results found</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-2xl mx-auto w-full px-6 pb-20">
        <div className="mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Get In Touch</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Send a Message</h2>
        </div>
        {formSuccess ? (
          <div className="bg-[#0d1410] border border-[#18A374]/30 p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Message Sent</p>
            <p className="text-sm text-white/60">We'll get back to you within 24 business hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {(["name", "email"] as const).map(field => (
                <div key={field}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">{field} *</label>
                  <input type={field === "email" ? "email" : "text"} required
                    value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full bg-[#0d1410] border border-[#1a2e23] px-4 py-3 text-sm text-white outline-none focus:border-[#18A374]/40 transition-colors" />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Subject *</label>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-[#0d1410] border border-[#1a2e23] px-4 py-3 text-sm text-white outline-none focus:border-[#18A374]/40 transition-colors">
                {["Order Issue", "Payment Problem", "Shipping & Delivery", "Return / Exchange", "Other"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">Message *</label>
              <textarea rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full bg-[#0d1410] border border-[#1a2e23] px-4 py-3 text-sm text-white outline-none focus:border-[#18A374]/40 transition-colors resize-none" />
            </div>
            <button type="submit"
              className="w-full py-4 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">
              Send Message
            </button>
          </form>
        )}
      </div>

      {/* CTA Footer */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready to shop?</h2>
        <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors inline-block">
          Back to Store
        </Link>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ help/page.tsx written"

# ─── PART 5: How to Order ─────────────────────────────────────────────────────
echo "⚙️  [5/10] Writing src/app/how-to-order/page.tsx..."

cat > src/app/how-to-order/page.tsx << 'FILEEOF'
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How to Order | Grab & Go" };

const STEPS = [
  { num: "01", title: "Browse & Pick",           body: "Explore our collections — Hoodies, Tees, Bottoms, Coats, Accessories. Click any product to view sizes, colours, and details." },
  { num: "02", title: "Select Size & Add to Cart", body: "Choose your size using our size guide, then hit Add to Cart. Your cart saves automatically — no account needed." },
  { num: "03", title: "Checkout Securely",        body: "Enter your shipping address and click Pay. Yoco-powered checkout accepts Visa, Mastercard, Apple Pay, and Google Pay. Your card details are never stored." },
  { num: "04", title: "We Pack & Ship",           body: "Your order is processed and dispatched within 1–3 business days. You'll receive a confirmation email with live tracking details." },
  { num: "05", title: "Receive Your Gear",        body: "Sit back. Your package is on its way. Track it anytime via the link in your email or our Track Order page." },
];

export default function HowToOrderPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Simple & Fast</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">How to Order</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">From browse to doorstep in a few taps.</p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 bg-[#0d1410] border border-[#1a2e23] p-6">
              <span className="text-4xl font-black text-[#18A374]/20 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready? Let's go.</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop Now</Link>
          <Link href="/help" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ how-to-order/page.tsx written"

# ─── PART 6: Shipping Policy ──────────────────────────────────────────────────
echo "⚙️  [6/10] Writing src/app/shipping-policy/page.tsx..."

cat > src/app/shipping-policy/page.tsx << 'FILEEOF'
import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy | Grab & Go" };

const RATES = [
  { method: "Standard Courier",  time: "2–5 Business Days", cost: "R80",  note: "Nationwide, door-to-door" },
  { method: "Express Courier",   time: "1–2 Business Days", cost: "R150", note: "Major cities only" },
  { method: "Free Delivery",     time: "2–5 Business Days", cost: "FREE", note: "Orders over R1,000" },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Fast & Trackable</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Shipping</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">We get your gear to you fast, tracked, and safe.</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1 space-y-10">
        {/* Rates Table */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Delivery Rates</span>
          <div className="overflow-x-auto border border-[#1a2e23]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0d1410] border-b border-[#1a2e23]">
                  {["Method", "Timeframe", "Cost", "Notes"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black uppercase tracking-widest text-white/40">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2e23]">
                {RATES.map(r => (
                  <tr key={r.method} className="bg-[#0d1410] hover:bg-[#111c14] transition-colors">
                    <td className="px-5 py-4 font-bold text-white">{r.method}</td>
                    <td className="px-5 py-4 text-white/60">{r.time}</td>
                    <td className={`px-5 py-4 font-black ${r.cost === "FREE" ? "text-[#18A374]" : "text-white"}`}>{r.cost}</td>
                    <td className="px-5 py-4 text-white/40 text-xs">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Policy Details */}
        {[
          { title: "Processing Time", body: "Orders are processed within 1–3 business days. Orders placed before 14:00 SAST Mon–Fri are dispatched same day. Weekend orders ship on the next business day." },
          { title: "Tracking",        body: "A tracking number is emailed to you once your order is dispatched. Use the Track Order page at any time to check your shipment status." },
          { title: "Delays",          body: "While we aim for the timeframes above, public holidays, extreme weather, and courier backlogs can occasionally cause delays. We'll keep you updated." },
          { title: "Failed Delivery", body: "If no one is available to receive your package, the courier will leave a delivery notification. Contact us within 24 hours to arrange a re-delivery." },
          { title: "International Shipping", body: "We currently ship within South Africa only. International shipping coming soon — register your email to be notified." },
        ].map(sec => (
          <div key={sec.title} className="bg-[#0d1410] border border-[#1a2e23] p-6 md:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-3">{sec.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Questions about your order?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Track Order</Link>
          <Link href="/help" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Help Desk</Link>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ shipping-policy/page.tsx written"

# ─── PART 7: Returns ──────────────────────────────────────────────────────────
echo "⚙️  [7/10] Writing src/app/returns/page.tsx..."

cat > src/app/returns/page.tsx << 'FILEEOF'
import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Exchanges | Grab & Go" };

const STEPS = [
  { num: "01", title: "Check Eligibility",     body: "Items must be returned within 7 days of verified delivery, unworn, with original tags attached. Sale items and custom orders are final sale." },
  { num: "02", title: "Contact Support",        body: "Reach out via our Help Desk or WhatsApp with your Order ID and the items you wish to return. We'll confirm eligibility and issue return instructions." },
  { num: "03", title: "Ship It Back",           body: "Package your items securely. Drop off at your nearest courier. Return shipping costs are covered by the customer unless the item was defective." },
  { num: "04", title: "Quality Check",          body: "Once we receive your return, our team inspects it within 1–2 business days." },
  { num: "05", title: "Exchange or Store Credit", body: "Approved returns receive store credit or an exchange within 5–7 business days. Refunds to original payment are available for defective items." },
];

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Hassle-Free</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Returns</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Not happy? We'll make it right. 7-day returns, no drama.</p>
      </div>

      {/* Steps */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-6">Return Process</span>
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 bg-[#0d1410] border border-[#1a2e23] p-6">
              <span className="text-4xl font-black text-[#18A374]/20 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Policy Note */}
        <div className="mt-10 bg-[#06402B]/30 border border-[#06402B] p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Important</p>
          <p className="text-sm text-white/70 leading-relaxed">Items that are worn, washed, damaged, or returned without original tags will not be accepted. For defective or incorrect items, we cover return shipping and issue a full refund.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Ready to start a return?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Contact Support</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ returns/page.tsx written"

# ─── PART 8: Our Story ────────────────────────────────────────────────────────
echo "⚙️  [8/10] Writing src/app/our-story/page.tsx..."

cat > src/app/our-story/page.tsx << 'FILEEOF'
import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Our Story | Grab & Go" };

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Established 2026</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Our Story</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">The vision, the hustle, and the culture behind Grab & Go.</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1 space-y-8">
        {[
          { title: "Where It Started", body: "Grab & Go was born from a simple idea: bring premium streetwear to South Africa fast, clean, and without the hype tax. We saw a gap — quality pieces, accessible prices, instant delivery — and we moved on it." },
          { title: "The Vision",       body: "We're not just selling clothes. We're building a culture. Every drop is curated, every piece has a story, and every customer is part of the G&G family. We collaborate with local brands, micro-influencers, and creatives who move different." },
          { title: "The Culture",      body: "The Culture Collective is at our core. We partner with MINNIEPRESS, CUSTOMSBYEBA, RESILIENT PALS, and emerging SA brands to bring you exclusive limited drops you won't find anywhere else." },
          { title: "What's Next",      body: "2026 is just the beginning. New brands, bigger drops, more collections. We're building something real — a streetwear hub that represents South African culture on a global stage. Stay locked in." },
        ].map(sec => (
          <div key={sec.title} className="bg-[#0d1410] border border-[#1a2e23] p-6 md:p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] mb-4">{sec.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Be Part of the Culture</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Shop the Drops</Link>
          <a href="https://www.instagram.com/grabngoza" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">Follow @grabngoza</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ our-story/page.tsx written"

# ─── PART 9: Legal ────────────────────────────────────────────────────────────
echo "⚙️  [9/10] Writing src/app/legal/page.tsx..."

cat > src/app/legal/page.tsx << 'FILEEOF'
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
FILEEOF
echo "   ✅ legal/page.tsx written"

# ─── PART 10: Track Order ─────────────────────────────────────────────────────
echo "⚙️  [10/10] Writing src/app/track-order/page.tsx..."

cat > src/app/track-order/page.tsx << 'FILEEOF'
"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderId, setOrderId]   = useState("");
  const [email,   setEmail]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState<null | "found" | "notfound">(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    // Simulated lookup — replace with real API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setResult("notfound"); // Replace with actual API result
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="bg-[#06402B] pt-28 pb-20 text-center px-6">
        <Link href="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 mb-8 group">
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Back to store
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Real-Time</span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-4">Track Order</h1>
        <p className="text-sm text-white/50 max-w-md mx-auto">Enter your order reference to see live shipment status.</p>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto w-full px-6 py-16 flex-1">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Order Reference *</label>
            <input type="text" required placeholder="GNG-XXXXXXXX"
              value={orderId} onChange={e => setOrderId(e.target.value)}
              className="w-full bg-[#0d1410] border border-[#1a2e23] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Email Address *</label>
            <input type="email" required placeholder="you@email.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#0d1410] border border-[#1a2e23] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#18A374]/40 transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors disabled:opacity-50">
            {loading ? "Looking up..." : "Track My Order"}
          </button>
        </form>

        {/* Result */}
        {result === "notfound" && (
          <div className="mt-8 bg-[#0d1410] border border-[#1a2e23] p-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Order Not Found</p>
            <p className="text-sm text-white/60 mb-4">We couldn't find that order. Check your confirmation email for the correct reference, or contact us directly.</p>
            <div className="flex justify-center gap-3">
              <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:underline">Help Desk</Link>
              <span className="text-white/20">|</span>
              <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:underline">WhatsApp</a>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="mt-8 bg-[#0d1410] border border-[#1a2e23] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#18A374] mb-2">Tip</p>
          <p className="text-xs text-white/50 leading-relaxed">Your order reference is in your confirmation email and starts with <strong className="text-white/80">GNG-</strong>. You can also track via the courier link in your dispatch email.</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06402B] py-12 text-center px-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">Need more help?</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Desk</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer" className="px-8 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
FILEEOF
echo "   ✅ track-order/page.tsx written"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All changes applied! Review then commit:"
echo ""
echo "  git add -A"
echo '  git commit -m "feat: header fixes, hero images, dark support pages, upgraded support chat"'
echo "  git push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
