import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/story",           destination: "/our-story",         permanent: true },
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
          { key: "X-XSS-Protection",       value: "1; mode=block" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.yoco.com https://www.googletagmanager.com https://vitals.vercel-insights.com https://browser.sentry-cdn.com https://vercel.live https://apis.google.com https://accounts.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://www.google-analytics.com https://upload.wikimedia.org",
              "font-src 'self' https://fonts.gstatic.com https://vercel.live",
              "connect-src 'self' https://*.firebaseio.com https://*.firebaseapp.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://online.yoco.com https://www.google-analytics.com https://vitals.vercel-insights.com https://*.sentry.io https://api.cloudinary.com https://res.cloudinary.com",
              "frame-src 'self' https://js.yoco.com https://vercel.live https://accounts.google.com https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "ideas-to-life-studios",
  project: "nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});