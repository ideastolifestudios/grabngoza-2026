import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Grab & Go | Premium Streetwear — SA",
    template: "%s | Grab & Go",
  },
  description:
    "Premium streetwear, curated drops, and a community that moves different. Based in South Africa, shipping nationwide.",
  keywords: ["streetwear", "fashion", "south africa", "drops", "premium", "grab and go"],
  openGraph: {
    title: "Grab & Go | Premium Streetwear",
    description: "Premium streetwear, curated drops, and a community that moves different.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://shopgrabngo.co.za",
    siteName: "Grab & Go",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grab & Go | Premium Streetwear",
    description: "Premium streetwear, curated drops, and a community that moves different.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-ZA" className={dmSans.variable}>
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
