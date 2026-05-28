"use client";
import Link from "next/link";
import Logo from "@/components/Logo";

const SUPPORT_LINKS = [
  { label: "How to Order",       href: "/how-to-order"    },
  { label: "Track Order",        href: "/track-order"     },
  { label: "Shipping Info",      href: "/shipping-policy" },
  { label: "Help Desk",          href: "/help"            },
  { label: "FAQ",                href: "/faq"             },
  { label: "Returns & Refunds",  href: "/returns"         },
];

const COMPANY_LINKS = [
  { label: "Our Story",        href: "/our-story" },
  { label: "Privacy Policy",   href: "/legal"     },
  { label: "Terms of Service", href: "/legal"     },
];

export default function SupportLayout({
  children,
  backLabel = "G&G Help",
  backHref  = "/help",
}: {
  children: React.ReactNode;
  backLabel?: string;
  backHref?:  string;
}) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">

      {/* ── Sticky top nav ────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">

          {/* Back link */}
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#06402B] transition-colors"
          >
            <span>←</span> {backLabel}
          </Link>

          {/* Centre logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <Logo className="h-7 w-auto" dark />
          </Link>

          {/* Right: store link */}
          <Link
            href="/"
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#06402B] transition-colors hidden sm:block"
          >
            Shop
          </Link>
          <a
            href="https://wa.me/27691630778"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-widest text-[#06402B] hover:text-[#18A374] transition-colors sm:hidden"
          >
            Help
          </a>
        </div>
      </nav>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ── Full footer matching homepage ────────────────────────────── */}
      <footer className="bg-[#06402B] text-white">
        {/* Top section */}
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand column */}
          <div className="flex flex-col gap-5">
            <Logo className="h-8 w-auto" light />
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Premium streetwear, curated drops, and a community that moves different.
              Based in South Africa, shipping nationwide.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/grabngoza"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[#18A374] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/grabngoza"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-[#18A374] transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>

          {/* Support column */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#18A374] mb-5">Support</p>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#18A374] mb-5">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map(link => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
              © 2026 Grab & Go. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {[
                { src: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882816/3840px-Visa_Inc._logo__282005_E2_80_932014_29.svg_l80vse.png", alt: "Visa" },
                { src: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882837/mastercard_r4oo9o.svg",                                          alt: "Mastercard" },
                { src: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882908/Apple_Pay_logo_mrpbqh.svg",                                     alt: "Apple Pay" },
                { src: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg",                                                     alt: "Google Pay" },
                { src: "https://res.cloudinary.com/dggitwduo/image/upload/v1775882870/yoco_ekl84d.svg",                                               alt: "Yoco" },
              ].map(p => (
                <img key={p.alt} src={p.src} alt={p.alt} className="h-4 w-auto opacity-40 hover:opacity-70 transition-opacity" />
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
