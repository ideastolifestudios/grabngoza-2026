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
  category: string;
  brand?: string;
  soldBy?: string;
  soldByLogo?: string;
  isDrop?: boolean;
  isBundle?: boolean;
  description: string;
  weight?: number; // in kg
  variants?: ProductVariant[];
}

export interface Testimonial {
  id: string;
  user: string;
  handle: string;
  content: string;
  type: 'whatsapp' | 'instagram';
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

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'returned';

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnRequest {
  id: string;
  orderId: string;
  email: string;
  items: {
    productId: string;
    quantity: number;
    reason: string;
    selectedVariants?: Record<string, string>;
  }[];
  status: ReturnStatus;
  date: string;
  notes?: string;
}

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
  paymentGateway?: 'ikhokha' | 'yoco';
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
}
