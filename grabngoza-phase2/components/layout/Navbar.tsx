"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu, MapPin } from "lucide-react";
import MobileDrawer from "./MobileDrawer";
import { useCart } from "@/context/CartContext";

const NAV_LINKS = [
  { label: "BUNDLES", href: "/collections/bundles" },
  { label: "NEW ARRIVALS", href: "/collections/new-arrivals" },
  { label: "APPAREL", href: "/collections/apparel" },
  { label: "ACCESSORIES", href: "/collections/accessories" },
  { label: "FOOTWEAR", href: "/collections/footwear" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const close = () => setMobileOpen(false);
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);

  return (
    <>
      <header className="fixed top-[36px] left-0 right-0 z-40 bg-brand-primary">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[84px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <rect width="36" height="36" rx="4" fill="#18A374" fillOpacity="0.15"/>
                <path d="M10 12h2l2.5 10h7l2.5-10H26" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="15" cy="26" r="1.5" fill="white"/>
                <circle cx="23" cy="26" r="1.5" fill="white"/>
              </svg>
              <div className="flex flex-col leading-none">
                <span className="text-white font-extrabold text-sm tracking-[0.15em] uppercase">GRAB</span>
                <span className="text-brand-accent font-extrabold text-sm tracking-[0.15em] uppercase">&amp; GO</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link key={link.label} href={link.href}
                  className="text-white text-[11px] tracking-[0.18em] font-semibold hover:text-brand-accent transition-colors duration-200 relative group">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-accent transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Icons */}
            <div className="flex items-center gap-4">
              <button aria-label="Store locator" className="hidden lg:flex text-white hover:text-brand-accent transition-colors duration-200 cursor-pointer"><MapPin size={18} /></button>
              <Link href="/account" aria-label="Account" className="hidden lg:flex text-white hover:text-brand-accent transition-colors duration-200"><User size={18} /></Link>
              <button aria-label="Search" className="text-white hover:text-brand-accent transition-colors duration-200 cursor-pointer"><Search size={18} /></button>
              <Link href="/cart" aria-label={`Cart (${totalItems} items)`} className="text-white hover:text-brand-accent transition-colors duration-200 relative">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </Link>
              <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="lg:hidden text-white hover:text-brand-accent transition-colors duration-200 cursor-pointer ml-1"><Menu size={22} /></button>
            </div>
          </div>
        </div>
      </header>
      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} navLinks={NAV_LINKS} />
    </>
  );
}