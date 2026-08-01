// @ts-nocheck
import { google } from "googleapis";
import { GoogleAuthService } from '../auth';

export class GoogleSearchConsoleService {
  private searchconsole = google.searchconsole({ version: "v1" });
  private siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || "";
  private authService = new GoogleAuthService();

  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensionFilter?: "QUERY" | "PAGE" | "DEVICE" | "COUNTRY"
  ) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const result = await this.searchconsole.searchanalytics.query({
        auth,
        siteUrl: this.siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: dimensionFilter ? [dimensionFilter] : undefined,
          rowLimit: 1000,
          dataState: "final",
        },
      } as any);

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async getTopQueries(
    startDate: string,
    endDate: string,
    limit: number = 10
  ) {
    try {
      const analyticsResult = await this.getSearchAnalytics(
        startDate,
        endDate,
        "QUERY"
      );

      if (!analyticsResult.success || !analyticsResult.data.rows) {
        return {
          success: false,
          queries: [],
          error: analyticsResult.error,
        };
      }

      const queries = analyticsResult.data.rows
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, limit)
        .map((row: any) => ({
          query: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr ? (row.ctr * 100).toFixed(2) : "0.00",
          position: row.position ? row.position.toFixed(2) : "0",
        }));

      return {
        success: true,
        queries,
      };
    } catch (error) {
      return {
        success: false,
        queries: [],
        error: String(error),
      };
    }
  }

  async getTopPages(startDate: string, endDate: string, limit: number = 10) {
    try {
      const analyticsResult = await this.getSearchAnalytics(
        startDate,
        endDate,
        "PAGE"
      );

      if (!analyticsResult.success || !analyticsResult.data.rows) {
        return {
          success: false,
          pages: [],
          error: analyticsResult.error,
        };
      }

      const pages = analyticsResult.data.rows
        .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, limit)
        .map((row: any) => ({
          page: row.keys[0],
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr ? (row.ctr * 100).toFixed(2) : "0.00",
          position: row.position ? row.position.toFixed(2) : "0",
        }));

      return {
        success: true,
        pages,
      };
    } catch (error) {
      return {
        success: false,
        pages: [],
        error: String(error),
      };
    }
  }

  async submitUrl(url: string) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const result = await this.searchconsole.urlInspection.index({
        auth,
        requestBody: {
          inspectionUrl: url,
        },
      } as any);

      return {
        success: true,
        url,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        url,
        error: String(error),
      };
    }
  }

  async getIndexingStatus(url: string) {
    try {
      const auth = await this.authService.getBusinessAuth();

      const result = await this.searchconsole.urlInspection.index({
        auth,
        requestBody: {
          inspectionUrl: url,
        },
      } as any);

      return {
        success: true,
        url,
        status: result.data?.inspectionResult?.indexStatusResult?.coverageState || "UNKNOWN",
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        url,
        error: String(error),
      };
    }
  }

  async getSearchMetrics(startDate: string, endDate: string) {
    try {
      const analyticsResult = await this.getSearchAnalytics(startDate, endDate);

      if (!analyticsResult.success) {
        return {
          success: false,
          metrics: null,
          error: analyticsResult.error,
        };
      }

      const rows = analyticsResult.data.rows || [];

      const metrics = {
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
        averagePosition: 0,
        topQuery: "",
        topPage: "",
      };

      if (rows.length > 0) {
        metrics.totalClicks = rows.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0);
        metrics.totalImpressions = rows.reduce((sum: number, row: any) => sum + (row.impressions || 0), 0);
        metrics.averageCTR = rows.reduce((sum: number, row: any) => sum + (row.ctr || 0), 0) / rows.length;
        metrics.averagePosition = rows.reduce((sum: number, row: any) => sum + (row.position || 0), 0) / rows.length;
      }

      return {
        success: true,
        metrics,
      };
    } catch (error) {
      return {
        success: false,
        metrics: null,
        error: String(error),
      };
    }
  }
}
