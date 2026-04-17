export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size", "Color"
  options: string[]; // e.g. ["S", "M", "L"]
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  categories: string[];
  brandId?: string; // Reference to Brand entity
  brand?: string; // Keep for backward compatibility or display
  brandBanner?: string;
  brandDescription?: string;
  brandLogo?: string;
  soldBy?: string;
  soldByLogo?: string;
  tags?: string[];
  isDrop?: boolean;
  isBundle?: boolean;
  description: string;
  weight?: number; // in kg
  gender?: 'Men' | 'Women' | 'Kids' | 'Unisex';
  subCategory?: string;
  variants?: ProductVariant[];
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  banner?: string;
  logo?: string;
  soldBy?: string;
}

export interface Testimonial {
  id: string;
  user: string;
  handle: string;
  content: string;
  type: 'instagram';
  image?: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export type OrderStatus = 'payment_pending' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'returned';

export type ShippingMethod = 'standard' | 'pickup' | 'international';


export interface Order {
  id: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  deliveryMethod: ShippingMethod;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  shippingCost: number;
  paymentGateway?: 'yoco';
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  wishlist?: string[];
}

// ===== SHIPPING TYPES =====

export interface ShippingRate {
  serviceLevel: string;
  estimatedDelivery: string;
  amount: number;
  currency: string;
  carrier: string;
  type: 'standard' | 'opt-in';
}

export interface ShipmentDetails {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  serviceLevel: string;
  carrier: string;
  labelUrl?: string;
  createdAt: string;
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  events: TrackingEvent[];
}

// ===== STOCK TYPES =====

export interface StockLevel {
  [variantKey: string]: number; // e.g. { "S": 10, "M": 5, "L": 0, "_default": 25 }
}

export interface StockHistoryEntry {
  id: string;
  productId: string;
  variant: string;
  change: number; // positive = restock, negative = sale
  reason: 'sale' | 'restock' | 'adjustment' | 'return';
  orderId?: string;
  timestamp: string;
  newLevel: number;
}
