"use client";
import { Star } from "lucide-react";
import { calculatePoints, formatPoints } from "@/lib/loyalty";

interface Props { orderTotal: number; className?: string; }

export default function LoyaltyBadge({ orderTotal, className }: Props) {
  const points = calculatePoints(orderTotal);
  if (points === 0) return null;
  return (
    <div className={`flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/30 px-3 py-2 ${className}`}>
      <Star size={14} className="text-brand-accent fill-brand-accent" />
      <p className="text-[11px] font-bold tracking-wide text-brand-accent">
        You&apos;ll earn <strong>{formatPoints(points)}</strong> on this order
      </p>
    </div>
  );
}