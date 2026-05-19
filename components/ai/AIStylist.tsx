"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "What should I wear for a night out?",
  "Suggest a full outfit under R2,000",
  "What\'s trending right now?",
  "Help me pick the right hoodie size",
];

export default function AIStylist() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I\'m your Grab & Go AI stylist 👋 Ask me anything about style, sizing, or what to cop. What\'s good?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6), // Keep last 3 exchanges for context
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I\'m having trouble right now. Try again?" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Try again in a sec!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-[80px] lg:bottom-6 right-4 lg:right-6 z-30 bg-brand-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-brand-accent transition-colors cursor-pointer"
        aria-label="Open AI Stylist"
      >
        <Sparkles size={22} />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-black/20 z-40 lg:hidden" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-[80px] lg:bottom-24 right-0 lg:right-6 z-50 w-full max-w-sm lg:max-w-[360px] bg-white shadow-2xl flex flex-col"
              style={{ maxHeight: "80vh", height: "520px" }}
            >
              {/* Header */}
              <div className="bg-brand-primary px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-brand-accent" />
                  <div>
                    <p className="text-white font-bold text-[13px] tracking-wide">AI Stylist</p>
                    <p className="text-white/50 text-[9px] tracking-wider uppercase">Powered by Gemini</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2.5 text-[13px] leading-relaxed ${msg.role === "user" ? "bg-brand-primary text-white" : "bg-brand-surface text-brand-text"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-brand-surface px-4 py-3 flex gap-1.5">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions (only when few messages) */}
              {messages.length < 3 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)} className="text-[10px] tracking-wide bg-brand-surface text-brand-text px-2.5 py-1.5 hover:bg-brand-primary hover:text-white transition-colors cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="border-t border-brand-border flex flex-shrink-0">
                <input
                  type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything..."
                  className="flex-1 px-4 py-3 text-sm focus:outline-none"
                />
                <button type="submit" disabled={loading || !input.trim()} className="px-4 text-brand-primary hover:text-brand-accent transition-colors disabled:opacity-40 cursor-pointer">
                  {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}