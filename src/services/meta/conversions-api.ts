import axios from 'axios';
import crypto from 'crypto';
import { MetaAuthService } from './auth';

export class MetaConversionsAPIService {
  private auth = new MetaAuthService();
  private pixelId = process.env.META_CONVERSIONS_API_PIXEL_ID || '';
  private apiVersion = 'v18.0';

  async trackPurchase(order: {
    id: string;
    userId: string;
    value: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
    customerEmail: string;
    customerPhone: string;
  }) {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/${this.apiVersion}/${this.pixelId}/events`,
        {
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: `${order.id}_${Date.now()}`,
              user_data: {
                em: [this.hashData(order.customerEmail.toLowerCase().trim())],
                ph: [this.hashData(order.customerPhone.trim())],
                external_id: order.userId,
              },
              custom_data: {
                value: order.value,
                currency: order.currency,
                content_name: 'Purchase',
                content_type: 'product',
                contents: order.items.map((item) => ({
                  id: item.productId,
                  quantity: item.quantity,
                  item_price: item.price,
                  title: item.productName,
                })),
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );

      return {
        success: true,
        orderId: order.id,
        eventsReceived: response.data.events_received,
      };
    } catch (error) {
      return {
        success: false,
        orderId: order.id,
        error: String(error),
      };
    }
  }

  async trackAddToCart(data: {
    userId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }) {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/${this.apiVersion}/${this.pixelId}/events`,
        {
          data: [
            {
              event_name: 'AddToCart',
              event_time: Math.floor(Date.now() / 1000),
              event_id: `addtocart_${data.userId}_${Date.now()}`,
              user_data: {
                external_id: data.userId,
              },
              custom_data: {
                content_name: data.productName,
                content_type: 'product',
                content_id: data.productId,
                value: data.price * data.quantity,
                currency: 'ZAR',
                contents: [
                  {
                    id: data.productId,
                    quantity: data.quantity,
                    item_price: data.price,
                  },
                ],
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );

      return {
        success: true,
        eventsReceived: response.data.events_received,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
