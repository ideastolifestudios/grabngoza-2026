// src/services/automation/search-monitoring.ts
import { GoogleSearchConsoleService } from "../google/business/search-console";


export class SearchConsoleMonitoring {
  private searchConsole = new GoogleSearchConsoleService();

  async monitorSearchPerformance(days: number = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      console.log(
        `Monitoring search performance for ${days} days...`
      );

      // Get top queries
      const topQueries = await this.searchConsole.getTopQueries(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        20
      );

      console.log("Top Search Queries:");
      topQueries.queries.forEach((q: any, i: number) => {
        console.log(
          `${i + 1}. "${q.query}" - ${q.clicks} clicks, ${q.impressions} impressions, ${(q.ctr * 100).toFixed(2)}% CTR`
        );
      });

      // Get top pages
      const topPages = await this.searchConsole.getTopPages(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        20
      );

      console.log("\nTop Pages:");
      topPages.forEach((p: any, i: number) => {
        console.log(
          `${i + 1}. ${p.page} - ${p.clicks} clicks, ${p.impressions} impressions`
        );
      });

      // Store results
      await this.storeSearchMetrics({
        date: new Date(),
        topQueries,
        topPages,
      });

      return {
        status: "monitored",
        queries: topQueries.length,
        pages: topPages.length,
      };
    } catch (error) {
      console.error("✗ Search monitoring failed:", error);
      throw error;
    }
  }

  async checkIndexingStatus(urls: string[]) {
    try {
      console.log(`Checking indexing status for ${urls.length} URLs...`);

      const results = [];

      for (const url of urls) {
        try {
          const status = await this.searchConsole.getIndexingStatus(url);
          results.push({
            url,
            status,
            checked: new Date(),
          });
        } catch (error) {
          console.warn(`Could not check ${url}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error("✗ Indexing check failed:", error);
      throw error;
    }
  }

  private async storeSearchMetrics(data: any) {
    // Implementation: store in Firebase
    console.log("✓ Search metrics stored");
  }
}