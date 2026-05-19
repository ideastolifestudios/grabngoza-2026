# Grab & Go ZA - Production Readiness Audit Report
**Date:** May 2024
**Auditor:** Senior E-commerce Systems Architect & Production QA Engineer

---

## 1. Critical Issues

### [SECURITY] Missing Webhook Signature Verification
- **Status:** **FIXED** (Applied during audit)
- **Technical Detail:** The Yoco webhook endpoint (`src/app/api/yoco-webhook/route.ts`) was accepting POST requests without validating the `yoco-signature`. This allowed for spoofed payment success events, potentially leading to order fulfillment for unpaid items.
- **Fix:** Implemented HMAC SHA256 verification using `crypto.timingSafeEqual`.

### [ARCHITECTURE] Monolithic Component Anti-pattern
- **Technical Detail:** `src/App.tsx` is an ~8,500 line file containing dozens of components (Hero, ProductCard, CheckoutModal, Drawers, Management UIs, etc.) and all global state logic.
- **Risk:** Extreme maintenance difficulty, high bundle size for the initial route, and significant risk of unintended side effects during updates. Hydration mismatches are likely as the component grows.

### [API] Route Duplication and Inconsistency
- **Technical Detail:** Functionality is split between legacy `api/*.ts` serverless functions and modern Next.js App Router `src/app/api/*/route.ts` handlers.
- **Risk:** Confusing developer experience, split security logic (some have HMAC, others don't), and potential for "stale" logic being hit by clients using old path assumptions.

---

## 2. High Priority Fixes

### [PERFORMANCE] Massive Main Bundle
- **Issue:** Because the entire application (including Admin Dashboards and all pages) is inside `App.tsx`, the initial JS payload for a visitor is unnecessarily large.
- **Fix:** Refactor into separate files and use Next.js dynamic imports (`next/dynamic`) or standard App Router page structures.

### [SECURITY] Inactive Rate Limiting
- **Issue:** `middleware/upstashRateLimit.ts` exists but is not enforced within the Next.js `middleware.ts` or imported/called in the route handlers.
- **Fix:** Implement a global `src/middleware.ts` to apply the `ratelimit` to sensitive paths (`/api/payments`, `/api/yoco-webhook`, `/api/ai-stylist`).

### [SEO] Meta Tag Conflict
- **Issue:** `src/app/layout.tsx` uses the Next.js Metadata API, while `src/components/SEO.tsx` uses `react-helmet-async`.
- **Risk:** Search engines may see duplicate or conflicting titles/descriptions. Next.js 15+ may suppress helmet tags in favor of its built-in API.
- **Fix:** Standardize on the Next.js Metadata API and remove `react-helmet-async`.

---

## 3. Recommended Enhancements

### [UX] Inventory Locking
- **Detail:** Inventory checks currently happen at "Add to Cart" and "Checkout".
- **Recommendation:** Implement a temporary inventory reserve (5-10 mins) when a user enters the payment flow to prevent race conditions for limited drops.

### [A11Y] Accessibility Gaps
- **Detail:** Many custom buttons and icons (Drawers, Filter Dropdowns) lack `aria-label` or proper focus management.
- **Recommendation:** Audit `App.tsx` for `aria-*` attributes and ensure the mobile sidebar traps focus when open.

### [DEV] Environment Hygiene
- **Issue:** `.bak` files and `App.tsx` backups are present in the source tree.
- **Recommendation:** Clean up all `.bak` files and rely on Git for version history.

---

## 4. Production Readiness Score
### **62 / 100**

- **Security:** 75/100 (Webhook fixed, but rate-limiting missing)
- **Architecture:** 30/100 (Monolithic `App.tsx` is a major debt)
- **Performance:** 50/100 (Monolith affects LCP/TBT)
- **UX/Checkout:** 85/100 (Flow is functional and aesthetically polished)
- **SEO/Metadata:** 70/100 (Conflict between Metadata API and Helmet)

---

## 5. Launch Blockers
1. [DONE] **Fix Webhook Spoofing:** HMAC verification must be active.
2. **Apply Rate Limiting:** Prevent API abuse/denial of service on checkout and AI endpoints.
3. **Resolve Metadata Conflict:** Remove Helmet to ensure clean SEO.
4. **Remove Production Backups:** Delete `.bak` files to prevent accidental deployment/exposure.

---

## 6. Post-launch Recommendations
1. **Component Extraction:** Systematically move components from `App.tsx` to `src/components/`.
2. **Sentry Integration:** Ensure `sentryClient.ts` is fully initialized in production to catch hydration errors.
3. **Structured Data Audit:** Enhance `organizationSchema` with social profiles and physical address.

---

## 7. Exact Implementation Fixes

### A. Webhook HMAC Verification
Applied to `src/app/api/yoco-webhook/route.ts`:
```typescript
const expectedSignatureBuffer = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest();
const signatureHeaderBuffer = Buffer.from(signatureHeader, 'base64');
if (!crypto.timingSafeEqual(signatureHeaderBuffer, expectedSignatureBuffer)) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### B. Enforce Rate Limiting
Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiLimiter } from '../middleware/upstashRateLimit';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Note: Upstash rate limiter needs adjustment for Next.js Middleware Edge Runtime
    // or called directly in route.ts
  }
  return NextResponse.next();
}
```

### C. Standardize SEO
In `src/app/layout.tsx`:
- Keep the `metadata` export.
- Remove `<SEO />` calls from child pages.
- Delete `src/components/SEO.tsx` and uninstall `react-helmet-async`.
