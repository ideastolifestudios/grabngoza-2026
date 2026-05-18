"use client";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Badge from "./Badge";
import type { Product } from "@/lib/types";
import { formatZAR } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  return (
    <motion.article whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="group">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className={`relative overflow-hidden bg-brand-surface ${compact ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {!product.inStock && <Badge variant="outOfStock" />}
            {product.isNew && product.inStock && <Badge variant="new" />}
          </div>

          {/* Quick add overlay */}
          {product.inStock && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-brand-primary p-3 flex items-center justify-center gap-2">
              <ShoppingBag size={13} className="text-white" />
              <span className="text-white text-[10px] tracking-[0.15em] font-bold uppercase">Quick Add</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`${compact ? "pt-3" : "pt-4"}`}>
          <p className="text-brand-muted text-[9px] tracking-[0.2em] uppercase font-medium mb-0.5">{product.brand} · {product.category}</p>
          <h3 className={`text-brand-text font-semibold tracking-tight leading-tight ${compact ? "text-sm" : "text-[15px]"} line-clamp-2`}>
            {product.name}
          </h3>
          <p className={`font-bold text-brand-text ${compact ? "text-sm mt-1" : "text-base mt-1.5"}`}>
            {formatZAR(product.price)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}