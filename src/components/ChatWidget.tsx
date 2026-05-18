// src/components/ChatWidget.tsx
// Drop-in replacement for your existing chat widget.
// Uses your existing /api/chat → Gemini backend.
// No new dependencies needed — uses lucide-react already in package.json.

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Phone, Mail } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  ts: Date;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `m${Date.now()}${++_id}`;

function isBusinessHours(): boolean {
  const sast = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Johannesburg" })
  );
  const d = sast.getDay();
  const h = sast.getHours();
  return d >= 1 && d <= 5 && h >= 8 && h < 16;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Johannesburg",
  });
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "model",
      text: "Hey! Welcome to Grab & Go. I'm your support assistant — ask me anything about orders, shipping, payments, returns, or sizing! 🛍️",
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const online = isBusinessHours();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const addMessage = (msg: Omit<Message, "id" | "ts">) => {
    const m: Message = { ...msg, id: uid(), ts: new Date() };
    setMessages((prev) => [...prev, m]);
    return m;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // Add user message
    addMessage({ role: "user", text });
    setLoading(true);

    // Build history for API (exclude system messages)
    const history = messages
      .filter((m) => m.role === "user" || m.role === "model")
      .map((m) => ({ role: m.role as "user" | "model", text: m.text }));
    history.push({ role: "user", text });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        addMessage({ role: "model", text: data.reply });
        if (!open) setUnread((u) => u + 1);
      } else {
        addMessage({
          role: "model",
          text:
            data.reply ||
            "Something went wrong on my end. For immediate help, WhatsApp us at +27 69 163 0778 or email support@grabandgo.co.za.",
        });
      }
    } catch {
      addMessage({
        role: "model",
        text: "I couldn't reach the server right now. Please WhatsApp us at https://wa.me/27691630778 for instant help.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Render message text with basic link detection
  const renderText = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-300 hover:text-blue-200"
        >
          {part.includes("wa.me") ? "Chat on WhatsApp →" : part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open support chat"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">

          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-lg flex-shrink-0">
              🛍️
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">Grab & Go Support</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    online ? "bg-green-400" : "bg-yellow-400"
                  }`}
                />
                <span className="text-xs text-blue-100 truncate">
                  {online
                    ? "AI Assistant · Team online"
                    : "AI Assistant · Team offline (Mon–Fri 8–16 SAST)"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-blue-500 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : msg.role === "system"
                      ? "bg-gray-200 text-gray-600 text-xs text-center rounded-lg mx-auto"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                >
                  {renderText(msg.text)}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {formatTime(msg.ts)}
                </span>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start">
                <div className="bg-white border border-gray-100 shadow-sm px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-1.5">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Track my order",
                  "Returns & refunds",
                  "Sizing help",
                  "Payment options",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => sendMessage(), 0);
                      // Use a small hack since setInput is async:
                      // directly call with the text
                      setInput("");
                      addMessage({ role: "user", text: q });
                      setLoading(true);
                      const history = [
                        ...messages
                          .filter((m) => m.role === "user" || m.role === "model")
                          .map((m) => ({
                            role: m.role as "user" | "model",
                            text: m.text,
                          })),
                        { role: "user" as const, text: q },
                      ];
                      fetch("/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: history }),
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          addMessage({
                            role: "model",
                            text:
                              data.reply ||
                              "Sorry, something went wrong. WhatsApp us at +27 69 163 0778.",
                          });
                        })
                        .catch(() => {
                          addMessage({
                            role: "model",
                            text: "Network error. WhatsApp us at https://wa.me/27691630778.",
                          });
                        })
                        .finally(() => setLoading(false));
                    }}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type your question…"
                disabled={loading}
                className="flex-1 text-sm px-3 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-gray-400 disabled:opacity-50 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <a
                href="https://wa.me/27691630778"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-green-600 hover:text-green-700 font-medium"
              >
                <MessageCircle size={10} />
                WhatsApp
              </a>
              <span className="text-gray-300 text-xs">·</span>
              <a
                href="tel:+27691630778"
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 font-medium"
              >
                <Phone size={10} />
                Call
              </a>
              <span className="text-gray-300 text-xs">·</span>
              <a
                href="mailto:support@grabandgo.co.za"
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 font-medium"
              >
                <Mail size={10} />
                Email
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}