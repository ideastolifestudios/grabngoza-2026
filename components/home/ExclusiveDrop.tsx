"use client";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";

// Set your next drop date here
const NEXT_DROP = new Date("2026-06-01T20:00:00+02:00"); // 8pm SAST

export default function ExclusiveDrop() {
  return (
    <section className="py-16 lg:py-24 bg-brand-text overflow-hidden relative">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, #18A374 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

      <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center relative">
        <div className="inline-flex items-center gap-2 bg-brand-accent/20 border border-brand-accent/30 px-4 py-2 mb-6">
          <Zap size={12} className="text-brand-accent" />
          <span className="text-brand-accent text-[10px] tracking-[0.25em] uppercase font-bold">Exclusive Drop</span>
        </div>

        <h2 className="text-white text-[44px] lg:text-[64px] font-extrabold uppercase tracking-tight leading-none mb-4">
          LIMITED EDITION<br />
          <span className="text-brand-accent">2026 DROP</span>
        </h2>

        <p className="text-white/50 text-sm lg:text-base leading-relaxed max-w-md mx-auto mb-10">
          Something big is coming. A limited release collab you won&apos;t see anywhere else.
          Sign up. Be first. Don&apos;t miss it.
        </p>

        <div className="mb-10">
          <CountdownTimer targetDate={NEXT_DROP} label="Drop goes live in" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/collections/new-arrivals"
            className="inline-flex items-center gap-2 bg-brand-accent text-white text-[11px] tracking-[0.2em] uppercase font-bold px-10 py-4 hover:bg-white hover:text-brand-primary transition-colors duration-300 group"
          >
            GET EARLY ACCESS <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <p className="text-white/30 text-[10px] tracking-wider uppercase mt-6">Limited quantities · No restocks</p>
      </div>
    </section>
  );
}