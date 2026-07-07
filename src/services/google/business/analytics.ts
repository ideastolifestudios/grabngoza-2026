// src/services/google/business/analytics.ts
import { google } from "googleapis";
import { GoogleAuthService } from "../auth";


export class GoogleAnalyticsService {
  private analyticsadmin = google.analyticsadmin({ version: "v1alpha" });
  private analyticsreporting = google.analyticsreporting({ version: "v4" });
  private propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || "";

  async trackPurchaseEvent(data: {
    userId: string;
    sessionId: string;
    orderId: string;
    value: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    const auth = await this.getAuth();

    const eventData = {
      measurement_id: this.propertyId,
      api_secret: process.env.GOOGLE_ANALYTICS_API_SECRET,
      events: [
        {
          name: "purchase",
          params: {
            session_id: data.sessionId,
            user_id: data.userId,
            transaction_id: data.orderId,
            value: data.value,
            currency: data.currency,
            items: data.items.map((item) => ({
              item_id: item.productId,
              item_name: item.productName,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      ],
    };

    // Use REST API for event tracking
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${data.userId}&api_secret=${process.env.GOOGLE_ANALYTICS_API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify(eventData),
      }
    );

    return { status: "tracked", orderId: data.orderId };
  }

  async getConversionReport(startDate: string, endDate: string) {
    const auth = await this.getAuth();

    const result = await this.analyticsreporting.reports.batchGet({
      auth,
      requestBody: {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { expression: "ga:sessions" },
              { expression: "ga:users" },
              { expression: "ga:transactions" },
              { expression: "ga:transactionRevenue" },
            ],
            dimensions: [
              { name: "ga:date" },
              { name: "ga:deviceCategory" },
            ],
          },
        ],
      },
    } as any);

    return result.data;
  }

  async getProductReport(startDate: string, endDate: string) {
    const auth = await this.getAuth();

    const result = await this.analyticsreporting.reports.batchGet({
      auth,
      requestBody: {
        reportRequests: [
          {
            viewId: this.propertyId,
            dateRanges: [
              {
                startDate: startDate,
                endDate: endDate,
              },
            ],
            metrics: [
              { expression: "ga:itemQuantity" },
              { expression: "ga:itemRevenue" },
            ],
            dimensions: [{ name: "ga:productName" }],
            orderBys: [
              {
                fieldName: "ga:itemRevenue",
                sortOrder: "DESCENDING",
              },
            ],
          },
        ],
      },
    } as any);

    return result.data;
  }

  private async getAuth() {
    const authService = new GoogleAuthService();
    return authService.getBusinessAuth();
  }
}