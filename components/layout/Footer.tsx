import Link from "next/link";
import { Instagram, Facebook } from "lucide-react";

const SUPPORT_LINKS = [
  { label: "How to Order", href: "/how-to-order" },
  { label: "Track Order", href: "/track-order" },
  { label: "Shipping Info", href: "/shipping-policy" },
  { label: "Help Desk", href: "/help" },
  { label: "FAQ", href: "/faq" },
  { label: "Returns & Refunds", href: "/returns" },
];

const COMPANY_LINKS = [
  { label: "Our Story", href: "/our-story" },
  { label: "Privacy Policy", href: "/legal#privacy" },
  { label: "Terms of Service", href: "/legal#terms" },
];

export default function Footer() {
  return (
    <footer className="bg-brand-surface border-t border-brand-border pb-20 lg:pb-0">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="4" fill="#104431" fillOpacity="0.1"/>
                <path d="M10 12h2l2.5 10h7l2.5-10H26" stroke="#104431" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 8c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#104431" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="15" cy="26" r="1.5" fill="#104431"/>
                <circle cx="23" cy="26" r="1.5" fill="#104431"/>
              </svg>
              <span className="text-brand-primary font-extrabold text-base tracking-widest uppercase">GRAB &amp; GO</span>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed max-w-xs">
              Premium streetwear, curated drops, and a community that moves different.
              Based in South Africa, shipping nationwide.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors duration-200">
                <Instagram size={14} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-primary hover:border-brand-primary transition-colors duration-200">
                <Facebook size={14} />
              </a>
            </div>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-brand-text font-bold text-xs tracking-[0.2em] uppercase mb-5">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-brand-muted text-sm hover:text-brand-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-brand-text font-bold text-xs tracking-[0.2em] uppercase mb-5">Company</h4>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-brand-muted text-sm hover:text-brand-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-brand-muted text-[11px] tracking-widest uppercase">
            © 2026 Grab & Go. All rights reserved.
          </p>
          {/* Payment icons text */}
          <div className="flex items-center gap-3 text-brand-muted text-[10px] tracking-wider uppercase font-medium">
            <span>Visa</span>
            <span>·</span>
            <span>Mastercard</span>
            <span>·</span>
            <span>Apple Pay</span>
            <span>·</span>
            <span className="text-brand-accent font-bold">Yoco</span>
          </div>
        </div>
      </div>
    </footer>
  );
}