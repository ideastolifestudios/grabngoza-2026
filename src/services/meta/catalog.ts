import axios from 'axios';
import { MetaAuthService } from './auth';

export class MetaCatalogService {
  private auth = new MetaAuthService();
  private catalogId = process.env.META_CATALOG_ID || '';
  private apiVersion = 'v18.0';

  async createProduct(product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    category: string;
    brand: string;
    sku: string;
    availability: 'in stock' | 'out of stock';
  }) {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/${this.apiVersion}/${this.catalogId}/products`,
        {
          retailer_id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          sale_price: product.salePrice,
          image_url: product.imageUrl,
          category: product.category,
          brand: product.brand,
          sku: product.sku,
          availability: product.availability,
        },
        {
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );

      return {
        success: true,
        productId: product.id,
        metaProductId: response.data.id,
      };
    } catch (error) {
      return {
        success: false,
        productId: product.id,
        error: String(error),
      };
    }
  }

  async updateProduct(
    metaProductId: string,
    updates: Partial<{
      name: string;
      description: string;
      price: number;
      sale_price: number;
      availability: string;
      image_url: string;
    }>
  ) {
    try {
      const response = await axios.post(
        `https://graph.instagram.com/${this.apiVersion}/${metaProductId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${this.auth.getAccessToken()}`,
          },
        }
      );

      return {
        success: true,
        metaProductId,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        metaProductId,
        error: String(error),
      };
    }
  }
}
