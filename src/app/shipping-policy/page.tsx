import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Shipping Policy | Grab & Go" };
const RATES = [
  { method: "Standard Courier",  time: "2–5 Business Days", cost: "R80",  note: "Nationwide door-to-door" },
  { method: "Express Courier",   time: "1–2 Business Days", cost: "R150", note: "Major cities only"        },
  { method: "Free Delivery",     time: "2–5 Business Days", cost: "FREE", note: "All orders over R1,000"   },
];
const SECTIONS = [
  { title: "Processing Time",        body: "Orders are processed within 1–3 business days. Orders placed before 14:00 SAST Mon–Fri are dispatched same day. Weekend orders ship on the next business day." },
  { title: "Tracking",               body: "A tracking number is emailed once your order is dispatched. Use the Track Order page at any time to check your shipment status." },
  { title: "Delays",                 body: "While we aim for the timeframes above, public holidays, extreme weather, and courier backlogs can occasionally cause delays. We'll keep you updated by email." },
  { title: "Failed Delivery",        body: "If no one is available to receive your package, the courier will leave a notification. Contact us within 24 hours to arrange re-delivery." },
  { title: "International Shipping", body: "We currently ship within South Africa only. International shipping is coming soon — register your email on the homepage to be notified first." },
];
export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Fast & Trackable</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Shipping</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">We get your gear to you fast, tracked, and safe.</p>
      </div>
      <div className="max-w-4xl mx-auto w-full px-6 py-16 flex-1 space-y-8">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-4">Delivery Rates</span>
          <div className="overflow-x-auto border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Method", "Timeframe", "Cost", "Notes"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {RATES.map(r => (
                  <tr key={r.method} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-sm text-black">{r.method}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{r.time}</td>
                    <td className={`px-5 py-4 font-black text-sm ${r.cost === "FREE" ? "text-[#06402B]" : "text-black"}`}>{r.cost}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {SECTIONS.map(sec => (
          <div key={sec.title} className="border border-gray-100 p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-3">{sec.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/track-order" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Track Order</Link>
          <Link href="/help" className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Help Center</Link>
        </div>
      </div>
    </div>
  );
}
