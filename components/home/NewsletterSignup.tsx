"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Truck } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    // TODO: Wire to Firebase / email service in Phase 4
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
    setEmail("");
  };

  return (
    <section className="bg-brand-primary py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <path d="M10 12h2l2.5 10h7l2.5-10H26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M14 8c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="15" cy="26" r="1.5" fill="white"/>
                <circle cx="23" cy="26" r="1.5" fill="white"/>
              </svg>
              <span className="text-white font-extrabold text-sm tracking-widest uppercase">GRAB &amp; GO</span>
            </div>
            <h2 className="text-white text-[36px] lg:text-[44px] font-extrabold leading-tight tracking-tight uppercase mb-3">
              Join the Grab &amp; Go Fam
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              Be the first to know about exclusive drops, restocks, and member-only offers.
              No spam — just the freshest gear, delivered to your inbox.
            </p>
            <div className="flex items-center gap-6 mt-5">
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-brand-accent" />
                <span className="text-white/60 text-[10px] tracking-[0.15em] uppercase font-medium">Exclusive Drops</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={12} className="text-brand-accent" />
                <span className="text-white/60 text-[10px] tracking-[0.15em] uppercase font-medium">Free Delivery R1,000+</span>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div>
            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brand-accent/20 border border-brand-accent/30 p-6 text-center"
              >
                <p className="text-white font-bold text-lg uppercase tracking-wide">You&apos;re In!</p>
                <p className="text-white/60 text-sm mt-1">Welcome to the Grab & Go Fam.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-0">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email..."
                  required
                  aria-label="Email address"
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm px-5 py-4 focus:outline-none focus:border-brand-accent transition-colors duration-200"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-brand-accent text-white text-xs tracking-[0.2em] font-bold uppercase px-8 py-4 hover:bg-white hover:text-brand-primary transition-colors duration-300 disabled:opacity-60 cursor-pointer"
                >
                  {status === "loading" ? "..." : "JOIN"}
                </button>
              </form>
            )}
            <p className="text-white/30 text-[10px] tracking-wide mt-3">
              By subscribing you agree to receive marketing emails. Unsubscribe at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}