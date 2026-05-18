"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-primary text-white hover:bg-brand-accent",
  accent: "bg-brand-accent text-white hover:bg-brand-primary",
  outline: "border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white",
  ghost: "text-brand-primary hover:bg-brand-surface",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[10px] tracking-[0.18em] px-5 py-2.5",
  md: "text-[11px] tracking-[0.18em] px-7 py-3.5",
  lg: "text-[11px] tracking-[0.18em] px-10 py-4",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold uppercase transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;