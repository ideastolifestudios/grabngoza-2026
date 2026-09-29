import { Product } from "@/types/product";

/**
 * Generates JSON-LD Structured Data for Google Search Rich Results.
 */
export function generateProductJsonLd(product: Product, domain: string = "https://shopgrabngo.online") {
  const currentPrice = product.salePrice ?? product.price;

  const schema: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.seo?.description || product.description,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      url: `${domain}/products/${product.id}`,
      priceCurrency: "ZAR",
      price: currentPrice,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.stockQuantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  if (product.weight) {
    schema.weight = {
      "@type": "QuantitativeValue",
      value: product.weight.value,
      unitCode: product.weight.unit.toUpperCase(),
    };
  }

  // Merge any custom user-defined schema overrides
  if (product.customSchema) {
    return { ...schema, ...product.customSchema };
  }

  return schema;
}
