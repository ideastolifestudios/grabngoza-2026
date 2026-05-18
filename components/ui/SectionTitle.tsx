import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionTitleProps {
  tag?: string;
  title: string;
  cta?: { label: string; href: string };
}

export default function SectionTitle({ tag, title, cta }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {tag && (
          <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-2">{tag}</p>
        )}
        <h2 className="text-brand-text text-[32px] sm:text-[40px] font-extrabold tracking-tight leading-none uppercase">
          {title}
        </h2>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="hidden sm:inline-flex items-center gap-1.5 text-brand-primary text-[11px] tracking-[0.18em] uppercase font-bold border-b border-brand-primary pb-0.5 hover:text-brand-accent hover:border-brand-accent transition-colors duration-200 flex-shrink-0 group"
        >
          {cta.label}
          <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}