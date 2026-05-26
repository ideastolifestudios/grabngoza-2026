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
