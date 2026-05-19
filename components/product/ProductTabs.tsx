"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  description?: string;
  brand?: string;
}

const SIZE_GUIDE = [
  { size: "XS", chest: "80-85", waist: "63-68", hip: "86-91" },
  { size: "S", chest: "86-91", waist: "69-74", hip: "92-97" },
  { size: "M", chest: "92-97", waist: "75-80", hip: "98-103" },
  { size: "L", chest: "98-103", waist: "81-86", hip: "104-109" },
  { size: "XL", chest: "104-109", waist: "87-92", hip: "110-115" },
  { size: "XXL", chest: "110-116", waist: "93-98", hip: "116-122" },
];

const TABS = ["Description", "Size Guide", "Returns"];

export default function ProductTabs({ description, brand }: Props) {
  const [active, setActive] = useState("Description");

  return (
    <div className="border-t border-brand-border mt-10 pt-10">
      {/* Tab buttons */}
      <div className="flex gap-0 border-b border-brand-border mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`relative px-6 py-3 text-[11px] tracking-[0.18em] uppercase font-bold flex-shrink-0 transition-colors duration-200 cursor-pointer ${active === tab ? "text-brand-primary" : "text-brand-muted hover:text-brand-text"}`}
          >
            {tab}
            {active === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {active === "Description" && (
          <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed">
            {description || `Premium quality from ${brand || "Grab & Go"}. Crafted for the culture — built to move different.`}
          </div>
        )}

        {active === "Size Guide" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-brand-surface">
                  {["Size", "Chest (cm)", "Waist (cm)", "Hip (cm)"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] tracking-[0.18em] uppercase font-bold text-brand-text border border-brand-border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-brand-surface"}>
                    <td className="px-4 py-3 font-bold text-brand-text border border-brand-border">{row.size}</td>
                    <td className="px-4 py-3 text-brand-muted border border-brand-border">{row.chest}</td>
                    <td className="px-4 py-3 text-brand-muted border border-brand-border">{row.waist}</td>
                    <td className="px-4 py-3 text-brand-muted border border-brand-border">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-brand-muted text-[11px] mt-3">Measurements in centimetres. If between sizes, size up.</p>
          </div>
        )}

        {active === "Returns" && (
          <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
            <p>We accept returns within <strong className="text-brand-text">30 days</strong> of delivery for items in original, unworn condition with tags attached.</p>
            <p>To initiate a return, visit our <a href="/returns" className="text-brand-accent underline">Returns Portal</a> or contact our help desk.</p>
            <p><strong className="text-brand-text">Exchanges:</strong> Items can be exchanged for a different size subject to availability.</p>
            <p><strong className="text-brand-text">Refunds:</strong> Processed within 5–7 business days after we receive the returned item.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}