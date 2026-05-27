#!/usr/bin/env bash
# ================================================================
# Grab & Go — App.tsx Build-Fix (SURGICAL)
# Run from the root of: grabngoza-2026/
# ================================================================
set -euo pipefail

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  App.tsx Build-Fix — 4 Surgical Repairs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > /tmp/fix-gng-build.mjs << 'NODEEOF'
import { readFileSync, writeFileSync } from 'fs';

const file = 'src/App.tsx';
let lines = readFileSync(file, 'utf8').split(/\r?\n/);
const log = [];

// ── FIX 1: Product card allImages cycling img — corrupted ─────────────────────
// Current:  key={i}<img src={banner || ''}   (L1836)
//           onError=.../>                     (L1837)
// Fix:      key={i}  /  src={img}  /  className  /  />
const fix1 = lines.findIndex(l => l.includes("key={i}<img src={banner"));
if (fix1 > -1) {
  lines.splice(fix1, 2,
    "            key={i}",
    "            src={img}",
    '            alt=""',
    '            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"',
    '            referrerPolicy="no-referrer"',
    "          />"
  );
  log.push("✅  Fix 1: Product card cycling img restored (src={img})");
} else {
  log.push("ℹ️   Fix 1: No corrupted key+img line found");
}

// ── FIX 2: Our Story Image Grid — floating src={banner} (lines ~3089-3090) ────
// The <motion.div ...className="...">  is missing its closing >
// Two floating lines: src={banner || ''}  /  onError=.../>
// Fix: insert > to close motion.div + proper <img> with brand image
const fix2 = lines.findIndex((l, i) =>
  l.includes("src={banner || ''}") &&
  i > 2900 && i < 3300 &&
  !(lines[i - 1] || "").trim().startsWith("<img")
);
if (fix2 > -1) {
  lines.splice(fix2, 2,
    "        >",
    "          <img",
    '            src="https://res.cloudinary.com/dggitwduo/image/upload/v1774452514/WhatsApp_Image_2026-03-25_at_17.25.44_zsxof4.jpg"',
    '            alt="Grab & Go"',
    '            className="w-full h-full object-cover"',
    '            referrerPolicy="no-referrer"',
    "          />"
  );
  log.push("✅  Fix 2: Our Story Image Grid motion.div + img restored");
} else {
  log.push("ℹ️   Fix 2: Image Grid floating src not found");
}

// ── FIX 3: BrandBanner <img<img → <img ────────────────────────────────────────
const fix3 = lines.findIndex(l => l.includes("<img<img"));
if (fix3 > -1) {
  lines[fix3] = lines[fix3].replace("<img<img", "<img");
  log.push("✅  Fix 3: BrandBanner <img<img corrected to <img");
} else {
  log.push("ℹ️   Fix 3: BrandBanner img tag already clean");
}

// ── FIX 4: Duplicate ChatWidget import ────────────────────────────────────────
const cwIdx = lines.reduce((acc, l, i) =>
  l.includes("import ChatWidget") ? [...acc, i] : acc, []);
if (cwIdx.length > 1) {
  // Remove all duplicates from the bottom up (so indices stay valid)
  for (let i = cwIdx.length - 1; i >= 1; i--) {
    lines.splice(cwIdx[i], 1);
  }
  log.push(`✅  Fix 4: Removed ${cwIdx.length - 1} duplicate ChatWidget import(s)`);
} else {
  log.push("ℹ️   Fix 4: ChatWidget import already clean");
}

writeFileSync(file, lines.join('\n'), 'utf8');
log.forEach(l => console.log("  " + l));
console.log("\n🎉  Done — build should pass now\n");
NODEEOF

node /tmp/fix-gng-build.mjs

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Commit & push:"
echo ""
echo "  git add src/App.tsx"
echo '  git commit -m "fix: restore corrupted img tags, remove duplicate import"'
echo "  git push"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
