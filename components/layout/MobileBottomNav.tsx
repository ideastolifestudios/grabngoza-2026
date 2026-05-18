"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, ShoppingBag, User } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/collections/all", icon: Grid },
  { label: "Search", href: "/search", icon: Search },
  { label: "Cart", href: "/cart", icon: ShoppingBag },
  { label: "Account", href: "/account", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border lg:hidden pb-safe"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-[60px] px-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              aria-label={label}
              className="flex flex-col items-center gap-0.5 px-3 py-1 group"
            >
              <Icon
                size={20}
                className={`transition-colors duration-200 ${isActive ? "text-brand-accent" : "text-brand-muted group-hover:text-brand-primary"}`}
              />
              <span className={`text-[9px] tracking-wider uppercase font-semibold transition-colors duration-200 ${isActive ? "text-brand-accent" : "text-brand-muted group-hover:text-brand-primary"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}