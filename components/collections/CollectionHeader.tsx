const COLLECTION_META: Record<string, { title: string; tagline: string }> = {
  all: { title: "ALL PRODUCTS", tagline: "The full collection — everything we carry." },
  "new-arrivals": { title: "NEW ARRIVALS", tagline: "Fresh drops, just landed." },
  apparel: { title: "APPAREL", tagline: "Premium streetwear for the culture." },
  accessories: { title: "ACCESSORIES", tagline: "Finish the look." },
  footwear: { title: "FOOTWEAR", tagline: "Step different." },
  bundles: { title: "BUNDLES", tagline: "More value. Same drip." },
};

export default function CollectionHeader({ slug, count }: { slug: string; count: number }) {
  const meta = COLLECTION_META[slug] || { title: slug.toUpperCase().replace(/-/g, " "), tagline: "" };

  return (
    <div className="bg-brand-primary py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <p className="text-brand-accent text-[10px] tracking-[0.3em] uppercase font-bold mb-3">Grab & Go</p>
        <h1 className="text-white text-[40px] lg:text-[60px] font-extrabold tracking-tight leading-none uppercase mb-3">
          {meta.title}
        </h1>
        <p className="text-white/50 text-sm">{meta.tagline}</p>
        {count > 0 && <p className="text-white/30 text-[11px] tracking-wider uppercase mt-2">{count} {count === 1 ? "item" : "items"}</p>}
      </div>
    </div>
  );
}