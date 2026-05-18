export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  comparePrice?: number;
  image: string;
  images?: string[];
  slug: string;
  isNew: boolean;
  inStock: boolean;
  stockCount?: number;
  description?: string;
  sizes?: string[];
  tags?: string[];
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId?: string;
  items: CartItem[];
  total: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  customerEmail: string;
  shippingAddress: Address;
  paymentReference?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt: string;
  wishlist?: string[];
  loyaltyPoints?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  productCount?: number;
}