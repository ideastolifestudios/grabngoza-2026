import { google } from "googleapis";
import { GoogleAuthService } from "../auth";

export class GoogleMerchantCenterService {
  private content = google.content({ version: "v2.1" });
  private merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || "";
  private authService = new GoogleAuthService();

  async syncProduct(product: {
    id: string;
    title: string;
    description: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    link: string;
    availability: "in stock" | "out of stock" | "preorder";
    gtin?: string;
    mpn?: string;
    brand: string;
    category: string;
  }) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const productData = {
        id: product.id,
        title: product.title,
        description: product.description,
        link: product.link,
        images: [{ link: product.imageUrl }],
        price: {
          currency: "ZAR",
          value: product.price.toString(),
        },
        salePrice: product.salePrice
          ? {
              currency: "ZAR",
              value: product.salePrice.toString(),
            }
          : undefined,
        availability: product.availability,
        brand: product.brand,
        productTypes: [product.category],
        gtin: product.gtin,
        mpn: product.mpn,
        condition: "new",
        contentLanguage: "en",
        targetCountry: "ZA",
      };

      const result = await this.content.products.insert({
        auth,
        merchantId: this.merchantId,
        requestBody: productData,
      } as any);

      return {
        success: true,
        productId: product.id,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        productId: product.id,
        error: String(error),
      };
    }
  }

  async updateProductPrice(
    productId: string,
    price: number,
    salePrice?: number
  ) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const updateData = {
        price: {
          currency: "ZAR",
          value: price.toString(),
        },
        salePrice: salePrice
          ? {
              currency: "ZAR",
              value: salePrice.toString(),
            }
          : undefined,
      };

      const result = await this.content.products.update({
        auth,
        merchantId: this.merchantId,
        productId: productId,
        requestBody: updateData,
      } as any);

      return {
        success: true,
        productId,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        productId,
        error: String(error),
      };
    }
  }

  async updateProductInventory(productId: string, quantity: number) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const availability = quantity > 0 ? "in stock" : "out of stock";

      const updateData = {
        availability,
        quantity: {
          value: quantity.toString(),
        },
      };

      const result = await this.content.products.update({
        auth,
        merchantId: this.merchantId,
        productId: productId,
        requestBody: updateData,
      } as any);

      return {
        success: true,
        productId,
        quantity,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        productId,
        quantity,
        error: String(error),
      };
    }
  }

  async getProductStatus(productId: string) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const result = await this.content.productstatuses.get({
        auth,
        merchantId: this.merchantId,
        productId: productId,
      } as any);

      return {
        success: true,
        productId,
        status: result.data,
      };
    } catch (error) {
      return {
        success: false,
        productId,
        error: String(error),
      };
    }
  }

  async deleteProduct(productId: string) {
    try {
      const auth = await this.authService.getBusinessAuth();

      await this.content.products.delete({
        auth,
        merchantId: this.merchantId,
        productId: productId,
      } as any);

      return {
        success: true,
        productId,
      };
    } catch (error) {
      return {
        success: false,
        productId,
        error: String(error),
      };
    }
  }
}
