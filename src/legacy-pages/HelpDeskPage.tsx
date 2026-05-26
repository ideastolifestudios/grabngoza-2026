'use client';
// src/pages/HelpDeskPage.tsx
import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ── FAQ Data ───────────────────────────────────────────────────────────────
const FAQS: FAQ[] = [
  // Orders & Speed
  {
    id: 1,
    category: "Orders & Speed",
    question: "How quickly will my order be processed?",
    answer:
      "Orders placed before 14:00 SAST Monday–Friday are processed the same business day. Orders placed after 14:00 or over the weekend are processed the next business day.",
  },
  {
    id: 2,
    category: "Orders & Speed",
    question: "Can I modify or cancel my order after placing it?",
    answer:
      "You can cancel or modify your order within 1 hour of placing it by contacting us via WhatsApp (+27 69 163 0778). After that window the order moves to fulfilment and changes may not be possible.",
  },
  {
    id: 3,
    category: "Orders & Speed",
    question: "Will I receive an order confirmation?",
    answer:
      "Yes — an automated confirmation email is sent immediately after checkout. Check your spam folder if you don't see it within a few minutes.",
  },
  // Payments & Installments
  {
    id: 4,
    category: "Payments & Installments",
    question: "What payment methods do you accept?",
    answer:
      "We accept credit/debit cards (Visa, Mastercard), EFT, PayFlex, and selected buy-now-pay-later (BNPL) providers. All transactions are SSL-encrypted.",
  },
  {
    id: 5,
    category: "Payments & Installments",
    question: "How do installment payments work?",
    answer:
      "At checkout, select a BNPL option (e.g., PayFlex). You'll split your total into equal installments — typically 4 payments over 6 weeks — with zero interest.",
  },
  {
    id: 6,
    category: "Payments & Installments",
    question: "Is my payment information secure?",
    answer:
      "Absolutely. We never store card details on our servers. All payment processing is handled by PCI-DSS compliant gateways.",
  },
  // Shipping & Collection
  {
    id: 7,
    category: "Shipping & Collection",
    question: "What are the delivery timeframes?",
    answer:
      "Standard delivery: 3–5 business days. Express delivery: 1–2 business days (additional fee applies). Collection from our Johannesburg hub is same or next day.",
  },
  {
    id: 8,
    category: "Shipping & Collection",
    question: "Do you ship nationwide?",
    answer:
      "Yes, we ship to all major centres across South Africa via our courier partners. Remote/outlying areas may take 1–2 additional days.",
  },
  {
    id: 9,
    category: "Shipping & Collection",
    question: "How do I track my order?",
    answer:
      "A tracking link is emailed to you once your order is dispatched. You can also WhatsApp us your order number for a live status update.",
  },
  // Returns & Exchanges
  {
    id: 10,
    category: "Returns & Exchanges",
    question: "What is your return policy?",
    answer:
      "Items can be returned within 7 days of delivery, provided they are unused, in original packaging, and accompanied by proof of purchase.",
  },
  {
    id: 11,
    category: "Returns & Exchanges",
    question: "How do I initiate a return or exchange?",
    answer:
      "Email support@grabandgo.co.za or WhatsApp us with your order number and reason for return. Our team will arrange a collection or drop-off within 2 business days.",
  },
  {
    id: 12,
    category: "Returns & Exchanges",
    question: "How long does a refund take?",
    answer:
      "Refunds are processed within 5–7 business days of us receiving the returned item. The time for funds to reflect depends on your bank.",
  },
  // Support & Contact
  {
    id: 13,
    category: "Support & Contact",
    question: "What are your support hours?",
    answer:
      "Our team is available Monday–Friday, 08:00–16:00 SAST. WhatsApp messages sent outside these hours are answered first thing the next business day.",
  },
  {
    id: 14,
    category: "Support & Contact",
    question: "How quickly will I get a response?",
    answer:
      "WhatsApp: typically within minutes during business hours. Email / contact form: within 24 business hours. Urgent issues are always best handled via WhatsApp.",
  },
  {
    id: 15,
    category: "Support & Contact",
    question: "Do you have a physical store?",
    answer:
      "We operate primarily online, but collection orders can be arranged from our Johannesburg hub. Contact us to set up an appointment.",
  },
];

const CATEGORIES = [
  "All",
  "Orders & Speed",
  "Payments & Installments",
  "Shipping & Collection",
  "Returns & Exchanges",
  "Support & Contact",
];

const CATEGORY_ICONS: Record<string, string> = {
  "All": "⚡",
  "Orders & Speed": "🛒",
  "Payments & Installments": "💳",
  "Shipping & Collection": "🚚",
  "Returns & Exchanges": "↩️",
  "Support & Contact": "💬",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function AccordionItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
        background: open ? "#fafcff" : "#fff",
        transition: "background 0.2s",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: "#111827", flex: 1 }}>
          {faq.question}
        </span>
        <span
          style={{
            fontSize: 20,
            color: "#2563eb",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.25s",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 20px 16px", color: "#4b5563", fontSize: 14, lineHeight: 1.7 }}>
          {faq.answer}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean }) {
  const now = new Date();
  const day = now.getDay(); // 0=Sun,6=Sat
  const hour = now.getHours();
  const isBusinessHours = day >= 1 && day <= 5 && hour >= 8 && hour < 16;
  const active = online && isBusinessHours;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: active ? "#dcfce7" : "#fee2e2",
        color: active ? "#166534" : "#991b1b",
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active ? "#22c55e" : "#ef4444",
          display: "inline-block",
        }}
      />
      {active ? "Online Now" : "Currently Offline"}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function HelpDeskPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", subject: "", message: "" });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const filteredFAQs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFormState("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setFormState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setFormState("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#111827",
    fontFamily: "inherit",
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
          color: "#fff",
          padding: "64px 24px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.5px" }}>
            Grab&Go Help Center
          </h1>
          <p style={{ fontSize: 18, opacity: 0.85, margin: "0 auto 32px", maxWidth: 520 }}>
            Fast answers, multiple support channels, and a team ready to help.
          </p>
          <StatusBadge online={true} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>

        {/* ── Quick Contact Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: -40,
            marginBottom: 48,
          }}
        >
          {[
            {
              icon: "💬",
              label: "WhatsApp",
              sub: "Instant reply",
              href: "https://wa.me/27691630778",
              bg: "#dcfce7",
              color: "#16a34a",
              cta: "Chat Now →",
            },
            {
              icon: "📧",
              label: "Email",
              sub: "Within 24 hours",
              href: "mailto:support@grabandgo.co.za",
              bg: "#dbeafe",
              color: "#2563eb",
              cta: "Send Email →",
            },
            {
              icon: "📞",
              label: "Phone",
              sub: "+27 69 163 0778",
              href: "tel:+27691630778",
              bg: "#fef3c7",
              color: "#d97706",
              cta: "Call Now →",
            },
            {
              icon: "🕐",
              label: "Business Hours",
              sub: "Mon–Fri 08:00–16:00",
              href: "#contact",
              bg: "#f3e8ff",
              color: "#7c3aed",
              cta: "Leave a Message →",
            },
          ].map((card) => (
            <a
              key={card.label}
              href={card.href}
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: "24px 20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                border: "1px solid #f1f5f9",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{ fontSize: 32 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{card.label}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{card.sub}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: card.color, marginTop: 4 }}>{card.cta}</div>
            </a>
          ))}
        </div>

        {/* ── FAQ Section ── */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
            Search or browse by category to find quick answers.
          </p>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 20, maxWidth: 520 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
            <input
              type="text"
              placeholder="Search FAQs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 44 }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 20,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  background: activeCategory === cat ? "#2563eb" : "#f1f5f9",
                  color: activeCategory === cat ? "#fff" : "#374151",
                  transition: "all 0.15s",
                }}
              >
                {CATEGORY_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          {filteredFAQs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
              <p style={{ fontSize: 16 }}>No FAQs match your search. Try different keywords or browse all categories.</p>
            </div>
          ) : (
            <div>
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} faq={faq} />
              ))}
            </div>
          )}
        </section>

        {/* ── Contact Form ── */}
        <section id="contact" style={{ marginBottom: 80 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Left: info */}
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 12 }}>
                Still need help?
              </h2>
              <p style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
                Fill in the form and our support team will get back to you within one business day. For urgent matters, use WhatsApp for the fastest response.
              </p>

              {/* SLA Table */}
              <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
                  📋 Response Time SLAs
                </h3>
                {[
                  { channel: "💬 WhatsApp", time: "Within minutes", hours: "Business hours" },
                  { channel: "📧 Email", time: "Within 24 hours", hours: "Business hours" },
                  { channel: "📝 Contact Form", time: "Within 24 hours", hours: "Business hours" },
                  { channel: "📞 Phone", time: "Immediate", hours: "Mon–Fri 08:00–16:00" },
                ].map((row) => (
                  <div
                    key={row.channel}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 0",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#374151" }}>{row.channel}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#2563eb" }}>{row.time}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{row.hours}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form */}
            <div style={{ background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" }}>
              {formState === "success" ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Message Sent!</h3>
                  <p style={{ color: "#6b7280", marginBottom: 24 }}>
                    We'll get back to you within 24 business hours. For urgent help, WhatsApp us.
                  </p>
                  <button
                    onClick={() => setFormState("idle")}
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                    Send us a message
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Name *
                      </label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Your full name"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                        Email *
                      </label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Subject *
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      style={inputStyle}
                    >
                      <option value="">Select a subject…</option>
                      <option value="Order Issue">Order Issue</option>
                      <option value="Payment Problem">Payment Problem</option>
                      <option value="Shipping & Delivery">Shipping & Delivery</option>
                      <option value="Return / Exchange">Return / Exchange</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue in as much detail as possible…"
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  {formState === "error" && (
                    <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    style={{
                      background: formState === "loading" ? "#93c5fd" : "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 10,
                      padding: "14px 24px",
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: formState === "loading" ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    {formState === "loading" ? "⏳ Sending…" : "Send Message →"}
                  </button>

                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                    We typically respond within 24 business hours. For urgent issues use{" "}
                    <a href="https://wa.me/27691630778" style={{ color: "#16a34a", fontWeight: 600 }}>
                      WhatsApp
                    </a>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}