"use client";
const messages = [
  "FREE DELIVERY ON ALL ORDERS OVER R1,000",
  "EXCLUSIVE DROPS — LIMITED QUANTITIES",
  "10% OFF YOUR FIRST ORDER — USE CODE: WELCOME10",
  "SECURE CHECKOUT POWERED BY YOCO",
];

export default function AnnouncementBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-brand-text text-white overflow-hidden h-[36px] flex items-center">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="inline-flex items-center gap-6 mx-8 text-[10px] tracking-[0.2em] font-medium uppercase">
            <span className="w-1 h-1 rounded-full bg-brand-accent inline-block" />
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}