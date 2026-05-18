"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] } }) };

// PLACEHOLDER: Replace HERO_IMAGE_URL with your Cloudinary URL
const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=80";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[calc(100vh-120px)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[90vh] lg:min-h-[calc(100vh-120px)]">

          {/* Left — Text content */}
          <div className="flex flex-col justify-center py-16 lg:py-24 order-2 lg:order-1 pr-0 lg:pr-12">
            <motion.div
              className="flex items-center gap-3 mb-6"
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
            >
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none" className="flex-shrink-0">
                <path d="M10 12h2l2.5 10h7l2.5-10H26" stroke="#104431" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 8c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#104431" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="15" cy="26" r="1.5" fill="#104431"/>
                <circle cx="23" cy="26" r="1.5" fill="#104431"/>
              </svg>
              <div className="h-px flex-1 bg-brand-border max-w-[60px]" />
              <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-brand-muted">COLLECTIVE</span>
            </motion.div>

            <motion.h1
              className="text-[52px] sm:text-[64px] lg:text-[72px] xl:text-[88px] font-extrabold leading-[0.9] tracking-tight text-brand-text uppercase mb-6"
              custom={1} variants={fadeUp} initial="hidden" animate="visible"
            >
              THE<br />
              CULTURE<br />
              <span className="text-brand-primary">COLLECTIVE</span>
            </motion.h1>

            <motion.p
              className="text-brand-muted text-base lg:text-lg leading-relaxed max-w-md mb-8"
              custom={2} variants={fadeUp} initial="hidden" animate="visible"
            >
              We don&apos;t just sell products; we build bridges. Collaborating with
              micro-influencers and cultural events to bring you exclusive limited edition drops.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4"
              custom={3} variants={fadeUp} initial="hidden" animate="visible"
            >
              <Link
                href="/collections/new-arrivals"
                className="inline-flex items-center gap-2 bg-brand-primary text-white text-xs tracking-[0.15em] font-bold uppercase px-8 py-4 hover:bg-brand-accent transition-colors duration-300 group"
              >
                SHOP NEW DROPS
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/collections/all"
                className="inline-flex items-center gap-2 text-brand-text text-xs tracking-[0.15em] font-bold uppercase border-b border-brand-text pb-0.5 hover:text-brand-primary hover:border-brand-primary transition-colors duration-200"
              >
                VIEW ALL
              </Link>
            </motion.div>

            {/* Season tag */}
            <motion.div
              className="mt-10 inline-flex items-center gap-3"
              custom={4} variants={fadeUp} initial="hidden" animate="visible"
            >
              <div className="w-8 h-px bg-brand-accent" />
              <span className="text-brand-muted text-[10px] tracking-[0.25em] uppercase">2026 Season Drop — Available Now</span>
            </motion.div>
          </div>

          {/* Right — Image */}
          <motion.div
            className="relative order-1 lg:order-2 h-[50vh] lg:h-auto lg:min-h-[calc(100vh-120px)]"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={HERO_IMAGE_URL}
              alt="Grab & Go 2026 Season Drop"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
            {/* Season badge */}
            <div className="absolute bottom-6 right-6 bg-brand-text text-white px-4 py-3 text-right">
              <div className="text-2xl font-extrabold leading-none tracking-tight">2026</div>
              <div className="text-[9px] tracking-[0.2em] uppercase text-brand-muted mt-0.5">SEASON DROP</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}