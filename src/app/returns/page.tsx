import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Returns & Exchanges | Grab & Go" };
const STEPS = [
  { num: "01", title: "Check Eligibility",          body: "Items must be returned within 7 days of verified delivery, unworn, with original tags attached. Sale and custom items are final sale." },
  { num: "02", title: "Contact Support",             body: "Reach out via the Help Center or WhatsApp with your Order ID and the items you wish to return. We'll confirm eligibility and issue return instructions." },
  { num: "03", title: "Ship It Back",                body: "Package items securely. Drop off at your nearest courier. Return shipping costs are covered by the customer unless the item was defective." },
  { num: "04", title: "Quality Check",               body: "Once we receive your return, our team inspects it within 1–2 business days." },
  { num: "05", title: "Exchange or Store Credit",    body: "Approved returns receive store credit or an exchange within 5–7 business days. Full refunds issued for defective or incorrectly sent items." },
];
export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="bg-[#06402B] pt-28 pb-16 text-center px-6">
        <Link href="/help" className="text-[10px] font-black uppercase tracking-widest text-[#18A374] hover:text-[#18A374]/70 inline-flex items-center gap-1.5 mb-8 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> G&G Help
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-3">Hassle-Free</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-3">Returns</h1>
        <p className="text-sm text-white/60 max-w-md mx-auto">Not happy? We'll make it right. 7-day returns, no drama.</p>
      </div>
      <div className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18A374] block mb-6">Return Process</span>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-6 border border-gray-100 p-6 hover:border-[#06402B]/20 transition-colors">
              <span className="text-3xl font-black text-gray-100 flex-shrink-0 leading-none">{step.num}</span>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-black mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 bg-[#06402B]/5 border border-[#06402B]/10 p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#06402B] mb-2">Important Note</p>
          <p className="text-sm text-gray-600 leading-relaxed">Items that are worn, washed, damaged, or returned without original tags will not be accepted. For defective or incorrect items, we cover return shipping and issue a full refund.</p>
        </div>
      </div>
      <div className="bg-[#06402B] py-12 text-center px-6">
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/help" className="px-8 py-3 bg-[#18A374] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#18A374]/90 transition-colors">Help Center</Link>
          <a href="https://wa.me/27691630778" target="_blank" rel="noopener noreferrer"
            className="px-8 py-3 border border-white/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">WhatsApp Us</a>
        </div>
      </div>
    </div>
  );
}
