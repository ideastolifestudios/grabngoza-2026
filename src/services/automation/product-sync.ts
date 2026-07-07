import { GoogleMerchantCenterService } from "../google/business/merchant-center";

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  brand: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  salePrice?: number;
  stockQuantity: number;
  imageUrl: string;
  slug: string;
}

export class ProductSyncAutomation {
  private merchantCenter = new GoogleMerchantCenterService();
  private syncLog: Array<{
    productId: string;
    timestamp: Date;
    status: "success" | "failed";
    message: string;
  }> = [];

  async syncProductToGoogle(product: Product) {
    try {
      const result = await this.merchantCenter.syncProduct({
        id: product.id,
        title: product.name,
        description: product.description,
        price: product.sellingPrice,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        link: `https://grabngoza.com/products/${product.slug}`,
        availability:
          product.stockQuantity > 0 ? "in stock" : "out of stock",
        gtin: product.barcode,
        mpn: product.sku,
        brand: product.brand,
        category: product.category,
      });

      const logEntry = {
        productId: product.id,
        timestamp: new Date(),
        status: result.success ? ("success" as const) : ("failed" as const),
        message: result.success
          ? `Synced to Merchant Center`
          : result.error || "Unknown error",
      };

      this.syncLog.push(logEntry);

      return {
        productId: product.id,
        status: result.success ? "synced" : "failed",
        result,
      };
    } catch (error) {
      const logEntry = {
        productId: product.id,
        timestamp: new Date(),
        status: "failed" as const,
        message: String(error),
      };

      this.syncLog.push(logEntry);

      return {
        productId: product.id,
        status: "failed",
        error: String(error),
      };
    }
  }

  async updateProductPrice(
    productId: string,
    newPrice: number,
    salePrice?: number
  ) {
    try {
      const result = await this.merchantCenter.updateProductPrice(
        productId,
        newPrice,
        salePrice
      );

      const logEntry = {
        productId,
        timestamp: new Date(),
        status: result.success ? ("success" as const) : ("failed" as const),
        message: result.success
          ? `Price updated: ${newPrice}${salePrice ? ` (sale: ${salePrice})` : ""}`
          : result.error || "Unknown error",
      };

      this.syncLog.push(logEntry);

      return {
        productId,
        status: result.success ? "updated" : "failed",
        result,
      };
    } catch (error) {
      const logEntry = {
        productId,
        timestamp: new Date(),
        status: "failed" as const,
        message: String(error),
      };

      this.syncLog.push(logEntry);

      return {
        productId,
        status: "failed",
        error: String(error),
      };
    }
  }

  async updateProductInventory(productId: string, quantity: number) {
    try {
      const result = await this.merchantCenter.updateProductInventory(
        productId,
        quantity
      );

      const logEntry = {
        productId,
        timestamp: new Date(),
        status: result.success ? ("success" as const) : ("failed" as const),
        message: result.success
          ? `Inventory updated: ${quantity} units`
          : result.error || "Unknown error",
      };

      this.syncLog.push(logEntry);

      return {
        productId,
        quantity,
        status: result.success ? "updated" : "failed",
        result,
      };
    } catch (error) {
      const logEntry = {
        productId,
        timestamp: new Date(),
        status: "failed" as const,
        message: String(error),
      };

      this.syncLog.push(logEntry);

      return {
        productId,
        quantity,
        status: "failed",
        error: String(error),
      };
    }
  }

  async bulkSyncProducts(products: Product[]) {
    console.log(`\n📦 Starting bulk sync of ${products.length} products...\n`);

    const results = [];

    for (const product of products) {
      const result = await this.syncProductToGoogle(product);
      results.push(result);

      const icon = result.status === "synced" ? "✅" : "❌";
      console.log(`${icon} ${product.name} - ${result.status}`);
    }

    const successful = results.filter((r) => r.status === "synced").length;
    console.log(
      `\n📊 Summary: ${successful}/${products.length} products synced successfully\n`
    );

    return {
      total: products.length,
      successful,
      failed: products.length - successful,
      results,
    };
  }

  getSyncLog() {
    return this.syncLog;
  }

  clearSyncLog() {
    this.syncLog = [];
  }

  getLastNSyncEntries(n: number = 10) {
    return this.syncLog.slice(-n);
  }
}
