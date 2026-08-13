export interface MetaCatalogProduct {
  id: string; // SKU or unique product ID matching Firestore doc ID
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'refurbished' | 'used';
  price: string; // Format: "100.00 ZAR" or "100.00 USD"
  link: string; // Direct URL to product page on your store
  image_link: string; // High-res product image URL
  brand: string;
  category?: string;
  inventory?: number;
}

export interface MetaBatchItemRequest {
  method: 'CREATE' | 'UPDATE' | 'DELETE';
  data: MetaCatalogProduct;
}

export interface MetaUserData {
  em?: string[]; // Hashed email (SHA-256)
  ph?: string[]; // Hashed phone number (SHA-256)
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string; // Facebook click ID cookie
  fbp?: string; // Facebook browser ID cookie
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number; price?: number }>;
  order_id?: string;
}

export interface MetaConversionEvent {
  event_name: 'PageView' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | 'ViewContent';
  event_time: number; // Unix timestamp in seconds
  event_id: string; // Unique string for deduplication with browser Pixel
  event_source_url: string;
  action_source: 'website';
  user_data: MetaUserData;
  custom_data?: MetaCustomData;
}