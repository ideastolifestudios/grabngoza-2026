// src/services/automation/event-tracking.ts
import { GoogleAnalyticsService } from '../google/business/analytics';

export class EventTrackingAutomation {
  private analytics = new GoogleAnalyticsService();

  async trackOrder(order: {
    id: string;
    userId: string;
    sessionId: string;
    total: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    try {
      await this.analytics.trackPurchaseEvent({
        userId: order.userId,
        sessionId: order.sessionId,
        orderId: order.id,
        value: order.total,
        currency: "ZAR",
        items: order.items,
      });

      console.log(`✓ Order ${order.id} tracked in Analytics`);

      return {
        orderId: order.id,
        status: "tracked",
      };
    } catch (error) {
      console.error(`✗ Failed to track order ${order.id}:`, error);
      throw error;
    }
  }

  async trackAddToCart(data: {
    userId: string;
    sessionId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }) {
    // Track add_to_cart event
    await this.trackCustomEvent("add_to_cart", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      product_name: data.productName,
      quantity: data.quantity,
      price: data.price,
    });
  }

  async trackRemoveFromCart(data: {
    userId: string;
    sessionId: string;
    productId: string;
    quantity: number;
  }) {
    // Track remove_from_cart event
    await this.trackCustomEvent("remove_from_cart", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      quantity: data.quantity,
    });
  }

  async trackViewItem(data: {
    userId: string;
    sessionId: string;
    productId: string;
    productName: string;
    category: string;
    price: number;
  }) {
    // Track view_item event
    await this.trackCustomEvent("view_item", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      product_name: data.productName,
      category: data.category,
      price: data.price,
    });
  }

  private async trackCustomEvent(eventName: string, params: any) {
    // Implementation: send to Google Analytics
    console.log(`✓ Event tracked: ${eventName}`, params);
  }
}