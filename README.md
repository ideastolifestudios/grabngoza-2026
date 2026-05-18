# Grab N Go ZA — Next.js Overhaul (Phase 1)

> Premium streetwear. Curated drops. A community that moves different.

## Stack
- **Next.js 15** (App Router, SSR/SSG)
- **TypeScript**
- **Tailwind CSS 3.4**
- **Framer Motion** (animations)
- **Firebase 10** (Firestore)
- **Cloudinary** (images)
- **Yoco** (payments — Phase 3)

## Setup

```bash
# 1. Clone this repo
git clone <this-repo-url>
cd grabngoza-2026

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your Firebase credentials in .env.local

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables
See `.env.example` for required variables. Copy to `.env.local` and fill in your values.

## Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#104431` | Navbar, sections, headings |
| `brand-accent` | `#18A374` | CTAs, badges, highlights |
| `brand-background` | `#ffffff` | Page background |
| `brand-text` | `#0a0a0a` | Body text |
| `brand-surface` | `#f6f6f6` | Cards, subtle backgrounds |

## Structure
```
app/              — Next.js App Router pages
components/
  layout/         — Navbar, Footer, MobileNav, etc.
  home/           — Homepage sections
  ui/             — Reusable components
lib/              — Firebase, types, utils
public/           — Static assets
```

## Phases
- [x] **Phase 1**: Foundation + Homepage
- [ ] **Phase 2**: Product system (collections, PDP)
- [ ] **Phase 3**: Cart + Yoco checkout
- [ ] **Phase 4**: Supporting pages
- [ ] **Phase 5**: AI features + advanced