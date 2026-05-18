"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

// PLACEHOLDER — replace with your Cloudinary images
const EDITORIAL_PANELS = [
  {
    id: 1,
    tag: "THE COLLECTIVE",
headline: "MOVE DIFFERENT",
    sub: "Collaborating with micro-influencers and cultural events to bring you exclusive limited edition drops.",
    cta: { label: "OUR STORY", href: "/our-story" },
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
    imageAlt: "Grab & Go Collective",
    dark: true,
  },
  {
    id: 2,
    tag: "2026 SEASON",
    headline: "CURATED DROPS",
    sub: "Every piece is selected for quality, culture, and the community that wears it.",
    cta: { label: "SHOP NOW", href: "/collections/new-arrivals" },
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    imageAlt: "2026 Season Collection",
    dark: false,
  },
];

export default function EditorialSection() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {EDITORIAL_PANELS.map((panel, i) => (
            <motion.div
              key={panel.id}
              className={`relative overflow-hidden group ${panel.dark ? "aspect-[4/5]" : "aspect-[4/3] lg:aspect-[4/5]"}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Background image */}
              <Image
                src={panel.image}
                alt={panel.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className={`absolute inset-0 ${panel.dark ? "bg-gradient-to-t from-black/80 via-black/30 to-black/10" : "bg-gradient-to-t from-brand-primary/90 via-brand-primary/40 to-transparent"}`} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
                <span className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-4 block">
                  {panel.tag}
                </span>
                <h3 className="text-white text-[40px] lg:text-[52px] font-extrabold leading-[0.9] tracking-tight uppercase mb-4 whitespace-pre-line">
                  {panel.headline}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-xs mb-6">
                  {panel.sub}
                </p>
                <Link
                  href={panel.cta.href}
                  className="inline-flex items-center gap-2 text-white text-[11px] tracking-[0.2em] uppercase font-bold border-b border-white/30 pb-0.5 hover:border-brand-accent hover:text-brand-accent transition-colors duration-200 w-fit group/cta"
                >
                  {panel.cta.label}
                  <ArrowUpRight size={12} className="transition-transform group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}