"use client";
import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface Props {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const allImages = images.length > 0 ? images : ["/placeholder-product.jpg"];

  const prev = useCallback(() => setCurrent((c) => (c - 1 + allImages.length) % allImages.length), [allImages.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % allImages.length), [allImages.length]);

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-square bg-brand-surface overflow-hidden group cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <Image
                src={allImages[current]}
                alt={`${productName} — image ${current + 1}`}
                fill
                priority={current === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-102"
              />
            </motion.div>
          </AnimatePresence>

          {/* Zoom icon */}
          <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={14} className="text-brand-text" />
          </div>

          {/* Nav arrows */}
          {allImages.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative flex-shrink-0 w-[72px] h-[72px] overflow-hidden border-2 transition-all duration-200 cursor-pointer ${i === current ? "border-brand-primary" : "border-transparent hover:border-brand-border"}`}
              >
                <Image src={img} alt="" fill sizes="72px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button onClick={() => setLightboxOpen(false)} aria-label="Close lightbox"
              className="absolute top-4 right-4 text-white hover:text-brand-accent transition-colors cursor-pointer z-10">
              <X size={28} />
            </button>
            {allImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" className="absolute left-4 text-white hover:text-brand-accent transition-colors cursor-pointer z-10"><ChevronLeft size={36} /></button>
                <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" className="absolute right-4 text-white hover:text-brand-accent transition-colors cursor-pointer z-10"><ChevronRight size={36} /></button>
              </>
            )}
            <motion.div
              className="relative max-w-3xl max-h-[85vh] w-full h-full"
              onClick={(e) => e.stopPropagation()}
              key={current}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <Image src={allImages[current]} alt={productName} fill sizes="85vw" className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}