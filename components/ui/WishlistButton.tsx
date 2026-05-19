"use client";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface Props { productId: string; className?: string; }

export default function WishlistButton({ productId, className }: Props) {
  const { wishlisted, toggle } = useWishlist(productId);

  return (
    <motion.button
      onClick={(e) => { e.preventDefault(); toggle(); }}
      whileTap={{ scale: 0.85 }}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn("group flex items-center justify-center transition-colors cursor-pointer", className)}
    >
      <Heart
        size={18}
        className={`transition-all duration-200 ${wishlisted ? "fill-red-500 text-red-500" : "text-brand-muted group-hover:text-red-400"}`}
      />
    </motion.button>
  );
}