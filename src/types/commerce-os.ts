// src/types/commerce-os.ts

export type ChannelSource = 'website' | 'meta' | 'google' | 'whatsapp';

export interface OSProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number; // ZAR
  compareAtPrice?: number;
  stockQuantity: number;
  category: string;
  images: string[];
  channels: {
    meta: { synced: boolean; metaItemId?: string; lastSyncedAt?: string };
    google: { synced: boolean; googleItemId?: string; lastSyncedAt?: string };
  };
  createdAt: string;
  updatedAt: string;
}

export interface OSOrder {
  id: string;
  source: ChannelSource;
  channelOrderId?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  currency: 'ZAR';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: 'PRODUCT_UPDATE' | 'STOCK_ADJUSTMENT' | 'ORDER_FULFILL' | 'CHANNEL_SYNC';
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}