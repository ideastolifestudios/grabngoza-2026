export type ProductStatus = "draft" | "published" | "archived" | "scheduled";

export interface ProductVariant {
  id: string;
  sku: string;
  title: string; // e.g., "Red / Large"
  price?: number;
  salePrice?: number;
  stockQuantity: number;
  options: Record<string, string>; // e.g., { Color: "Red", Size: "Large" }
  image?: string;
}

export interface ProductWeight {
  value: number;
  unit: "kg" | "g" | "lb" | "oz";
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "in" | "mm";
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string[];
  videos?: string[];
  tags: string[];
  variants?: ProductVariant[];
  weight?: ProductWeight;
  dimensions?: ProductDimensions;
  seo: ProductSEO;
  customSchema?: Record<string, any>; // Product schema override or extensions
  status: ProductStatus;
  scheduledAt?: string | null; // ISO Date String for future publishing
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export type BulkActionType = "publish" | "unpublish" | "archive" | "delete";
