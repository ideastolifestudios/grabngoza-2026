"use client";

export type SortOption = "newest" | "price-asc" | "price-desc" | "name-asc";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

export default function SortSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Sort products"
      className="text-brand-text bg-white border border-brand-border text-[11px] tracking-wide uppercase font-semibold px-4 py-2.5 focus:outline-none focus:border-brand-primary cursor-pointer appearance-none pr-8"
      style={{ backgroundImage: "url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23104431' strokeWidth='1.5' fill='none'/%3E%3C/svg%3E")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}