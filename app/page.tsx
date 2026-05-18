import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import TrustBar from "@/components/home/TrustBar";
import FeaturedDrops from "@/components/home/FeaturedDrops";
import BestSellers from "@/components/home/BestSellers";
import EditorialSection from "@/components/home/EditorialSection";
import NewsletterSignup from "@/components/home/NewsletterSignup";

export const metadata: Metadata = {
  title: "Home | Premium Streetwear & Curated Drops — SA",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBar />
      <FeaturedDrops />
      <BestSellers />
      <EditorialSection />
      <NewsletterSignup />
    </>
  );
}