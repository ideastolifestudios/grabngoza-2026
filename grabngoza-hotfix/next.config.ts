import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // ── Redirect old slugs to new pages ───────────────────────
  async redirects() {
    return [
      { source: "/story",           destination: "/our-story",       permanent: true },
      { source: "/refunds",         destination: "/returns",         permanent: true },
      { source: "/helpdesk",        destination: "/help",            permanent: true },
      { source: "/shipping",        destination: "/shipping-policy", permanent: true },
      { source: "/privacy",         destination: "/legal",           permanent: true },
      { source: "/terms",           destination: "/legal",           permanent: true },
      { source: "/contact",         destination: "/help",            permanent: true },
      { source: "/support",         destination: "/help",            permanent: true },
      { source: "/returns-policy",  destination: "/returns",         permanent: true },
      { source: "/refund-policy",   destination: "/returns",         permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY"    },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;