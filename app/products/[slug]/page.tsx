"use client";
import { use, useRef } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useProduct } from "@/hooks/useProduct";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import StickyATC from "@/components/product/StickyATC";
import ProductTabs from "@/components/product/ProductTabs";
import RelatedProducts from "@/components/product/RelatedProducts";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { product, loading, error } = useProduct(slug);
  const atcRef = useRef<HTMLButtonElement>(null);

  if (loading) return <ProductDetailSkeleton />;
  if (error || !product) return notFound();

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image].filter(Boolean) as string[];

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] tracking-wider uppercase text-brand-muted mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/collections/${product.category.toLowerCase()}`} className="hover:text-brand-primary transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-brand-text font-medium">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <ProductGallery images={images} productName={product.name} />

          {/* Info */}
          <ProductInfo product={product} atcRef={atcRef} />
        </div>

        {/* Tabs */}
        <ProductTabs description={product.description} brand={product.brand} />
      </div>

      {/* Related products */}
      <RelatedProducts category={product.category} excludeId={product.id} />

      {/* Sticky ATC */}
      <StickyATC product={product} triggerRef={atcRef} />
    </>
  );
}