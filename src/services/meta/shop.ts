import axios from 'axios';
import { MetaAuthService } from './auth';

export class MetaShopService {
  private auth = new MetaAuthService();
  private apiVersion = 'v18.0';
  private instagramShopId = process.env.META_INSTAGRAM_SHOP_ID || '';
  private facebookPageId = process.env.META_FACEBOOK_PAGE_ID || '';

  async getInstagramShopInfo() {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${this.apiVersion}/${this.instagramShopId}`,
        {
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );
      return { success: true, shop: response.data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getFacebookShopInfo() {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${this.apiVersion}/${this.facebookPageId}`,
        {
          params: { fields: 'shop,catalog' },
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );
      return { success: true, shop: response.data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getSalesChannelStatus() {
    try {
      const instagramShop = await this.getInstagramShopInfo();
      const facebookShop = await this.getFacebookShopInfo();

      return {
        instagram: instagramShop.success,
        facebook: facebookShop.success,
        status: {
          instagramActive: instagramShop.success,
          facebookActive: facebookShop.success,
          lastChecked: new Date(),
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
