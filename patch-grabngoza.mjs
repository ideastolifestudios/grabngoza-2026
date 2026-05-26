#!/usr/bin/env node
// ============================================================
// Grab & Go — App.tsx Patch Script
// Applies: Hero text, Footer link, HowToOrder route + import
// Run from repo root: node patch-grabngoza.mjs
// ============================================================

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const APP_PATH = resolve('./src/App.tsx');

console.log('🔧 Reading App.tsx...');
let src = readFileSync(APP_PATH, 'utf-8');

let patchCount = 0;
function patch(description, from, to) {
  if (!src.includes(from)) {
    console.error(`❌ PATCH FAILED — could not find target for: ${description}`);
    console.error(`   Expected substring:\n   ${from.slice(0, 120)}`);
    process.exit(1);
  }
  src = src.replace(from, to);
  patchCount++;
  console.log(`✅ [${patchCount}] ${description}`);
}

// ─────────────────────────────────────────────────────────────
// 1. Import HowToOrderPage at the top of file
// ─────────────────────────────────────────────────────────────
patch(
  'Add HowToOrderPage import',
  `import ReturnRequestPage from './pages/ReturnRequestPage';`,
  `import ReturnRequestPage from './pages/ReturnRequestPage';
import HowToOrderPage from './pages/HowToOrderPage';`
);

// ─────────────────────────────────────────────────────────────
// 2. Hero — Slide 1: "Shop the Next Big Thing"
//    Premium minimal — cleaner tagline, stronger headline,
//    refined subtext. Slides 2 & 3 untouched.
// ─────────────────────────────────────────────────────────────
patch(
  'Update Hero slide 1 to "Shop the Next Big Thing"',
  `{ tagline: "New Season", title: "Street Ready", sub: "Premium streetwear essentials \u2014 built for the culture" }`,
  `{ tagline: "New \u2014 2026", title: "Shop the Next Big Thing", sub: "Premium streetwear, fresh drops & exclusive finds \u2014 curated for you." }`
);

// ─────────────────────────────────────────────────────────────
// 3. Hero H1 — improve typography: loosen leading slightly,
//    allow natural word-wrap, reduce opacity of sub
// ─────────────────────────────────────────────────────────────
patch(
  'Refine Hero H1 typography + sub text opacity',
  `className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter text-white leading-[0.9] mb-6">
          {slide.title}
        </h1>
        <p className="text-xs md:text-sm text-white/60 uppercase tracking-widest font-bold mb-10 max-w-xs leading-relaxed">`,
  `className="text-[2.8rem] sm:text-6xl md:text-[5.5rem] font-display font-black uppercase tracking-tighter text-white leading-[0.88] mb-5">
          {slide.title}
        </h1>
        <p className="text-[11px] md:text-xs text-white/50 uppercase tracking-[0.25em] font-bold mb-10 max-w-sm leading-loose">`
);

// ─────────────────────────────────────────────────────────────
// 4. Footer — How to Order link: event → route
// ─────────────────────────────────────────────────────────────
patch(
  'Footer: How to Order — event dispatch → Link to /how-to-order',
  `<li><button onClick={() => window.dispatchEvent(new Event('open-how-to-order'))} className="hover:text-black transition-colors cursor-pointer">How to Order</button></li>`,
  `<li><Link to="/how-to-order" className="hover:text-black transition-colors">How to Order</Link></li>`
);

// ─────────────────────────────────────────────────────────────
// 5. Routes — add /how-to-order route (before /order-success)
// ─────────────────────────────────────────────────────────────
patch(
  'Add /how-to-order Route',
  `<Route path="/order-success"`,
  `<Route path="/how-to-order" element={<HowToOrderPage />} />
        <Route path="/order-success"`
);

// ─────────────────────────────────────────────────────────────
// 6. Toast — upgrade to top-right stack style for premium feel
//    (keep existing signature, just change position+styling)
// ─────────────────────────────────────────────────────────────
patch(
  'Toast — bottom-center pill → top-right minimal bar',
  `className={\`fixed bottom-10 left-1/2 z-[300] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border \${
        type === 'success' ? 'bg-black text-white border-white/10' : 'bg-red-600 text-white border-red-500'
      }\`}`,
  `className={\`fixed top-5 right-5 z-[300] px-5 py-3 shadow-xl flex items-center gap-3 border \${
        type === 'success' ? 'bg-gray-950 text-white border-gray-800' : 'bg-red-600 text-white border-red-500'
      }\`}`
);

// ─────────────────────────────────────────────────────────────
// Done
// ─────────────────────────────────────────────────────────────
console.log(`\n✨ All ${patchCount} patches applied.`);
writeFileSync(APP_PATH, src, 'utf-8');
console.log('💾 App.tsx written.\n');
console.log('Next steps:');
console.log('  git add src/App.tsx src/pages/HowToOrderPage.tsx');
console.log('  git commit -m "feat: hero text, how-to-order page, footer link, toast refine"');
console.log('  git push origin main');
