/**
 * api/_lib/types.ts — Shared types for API layer
 * Fixes missing module errors in order.service.ts, zohoInventoryService.ts, zohoCRMService.ts
 */

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariants?: Record<string, string>;
  variantId?: string;
}

export interface Order {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  confirmedAt?: string;
  // Yoco fields
  yocoCheckoutId?: string;
  yocoPaymentId?: string;
  paymentId?: string;
  paymentAmountCents?: number;
  paymentCurrency?: string;
  // Shipping
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  deliveryMethod?: 'standard' | 'express' | 'pickup' | 'bobgo';
  trackingNumber?: string;
  trackingUrl?: string;
  // Bob Go
  bobGoPickupPoint?: {
    id: string;
    name: string;
    address: string;
    suburb: string;
    city: string;
    province: string;
    postal_code: string;
  };
  // Zoho
  zohoOrderId?: string;
  zohoCrmContactId?: string;
  // Notes
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  images?: string[];
  brand?: string;
  brandId?: string;
  categories?: string[];
  variants?: ProductVariant[];
  stock?: number;
  variantStock?: Record<string, number>;
  active?: boolean;
  featured?: boolean;
  createdAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  price?: number;
  label?: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  orders?: string[];
  zohoCrmId?: string;
  createdAt?: string;
}
