"use client";
import { useEffect } from "react";
import Link from "next/link";
import { X, Instagram, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NavLink { label: string; href: string; }
interface Props { isOpen: boolean; onClose: () => void; navLinks: NavLink[]; }

export default function MobileDrawer({ isOpen, onClose, navLinks }: Props) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-[300px] bg-brand-primary z-50 flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <span className="text-white font-bold text-sm tracking-widest uppercase">Menu</span>
              <button onClick={onClose} aria-label="Close menu" className="text-white hover:text-brand-accent transition-colors cursor-pointer">
                <X size={22} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col p-6 gap-1" aria-label="Mobile navigation">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block text-white hover:text-brand-accent transition-colors py-3 text-sm tracking-[0.15em] font-semibold uppercase border-b border-white/10"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Link href="/account" onClick={onClose} className="block text-white hover:text-brand-accent transition-colors py-3 text-sm tracking-[0.15em] font-semibold uppercase border-b border-white/10">
                  ACCOUNT
                </Link>
              </motion.div>
            </nav>

            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:text-brand-accent transition-colors">
                  <Instagram size={20} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:text-brand-accent transition-colors">
                  <Facebook size={20} />
                </a>
              </div>
              <p className="text-white/40 text-[10px] tracking-widest uppercase mt-3">
                © 2026 Grab & Go
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}