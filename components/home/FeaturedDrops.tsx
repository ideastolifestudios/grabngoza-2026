"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Product } from "@/lib/types";

// PLACEHOLDER products — these will be replaced by live Firestore data in Phase 2
const FEATURED_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Oversized Culture Tee",
    brand: "Grab & Go",
    category: "APPAREL",
    price: 650,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    slug: "oversized-culture-tee",
    isNew: true,
    inStock: true,
  },
  {
    id: "2",
    name: "Cargo Street Pants",
    brand: "Grab & Go",
    category: "BOTTOMS",
    price: 1200,
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80",
    slug: "cargo-street-pants",
    isNew: true,
    inStock: true,
  },
  {
    id: "3",
    name: "Drop Shoulder Hoodie",
    brand: "Grab & Go",
    category: "APPAREL",
    price: 900,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    slug: "drop-shoulder-hoodie",
    isNew: false,
    inStock: false,
  },
  {
    id: "4",
    name: "Signature Bucket Hat",
    brand: "Grab & Go",
    category: "ACCESSORIES",
    price: 450,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    slug: "signature-bucket-hat",
    isNew: true,
    inStock: true,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function FeaturedDrops() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <SectionTitle
          tag="Featured"
          title="LATEST DROPS"
          cta={{ label: "View All", href: "/collections/new-arrivals" }}
        />
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-10"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {FEATURED_PRODUCTS.map((product) => (
            <motion.div key={product.id} variants={itemVariants}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}