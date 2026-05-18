"use client";
import { Zap, Truck, Shield, Tag } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Zap, label: "EXCLUSIVE DROPS", sub: "First access to limited releases" },
  { icon: Truck, label: "FREE DELIVERY", sub: "On orders over R1,000" },
  { icon: Tag, label: "10% OFF FIRST ORDER", sub: "Use code: WELCOME10" },
  { icon: Shield, label: "SECURE CHECKOUT", sub: "Powered by Yoco" },
];

export default function TrustBar() {
  return (
    <section className="bg-brand-primary py-8 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                <Icon size={14} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-white text-[10px] tracking-[0.18em] font-bold uppercase">{label}</p>
                <p className="text-white/50 text-[10px] tracking-wide mt-0.5 hidden sm:block">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}