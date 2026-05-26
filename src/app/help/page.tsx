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
