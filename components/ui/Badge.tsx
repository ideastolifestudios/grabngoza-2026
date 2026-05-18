import { cn } from "@/lib/utils";

type BadgeVariant = "new" | "sale" | "outOfStock" | "lowStock";

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const badgeConfig: Record<BadgeVariant, { label: string; className: string }> = {
  new: { label: "NEW", className: "bg-brand-accent text-white" },
  sale: { label: "SALE", className: "bg-red-500 text-white" },
  outOfStock: { label: "OUT OF STOCK", className: "bg-brand-text text-white" },
  lowStock: { label: "LOW STOCK", className: "bg-amber-500 text-white" },
};

export default function Badge({ variant, className }: BadgeProps) {
  const { label, className: baseClass } = badgeConfig[variant];
  return (
    <span className={cn("inline-block text-[9px] tracking-[0.18em] font-bold uppercase px-2 py-1", baseClass, className)}>
      {label}
    </span>
  );
}