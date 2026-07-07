// src/jobs/google-ecosystem-jobs.ts
import cron from "node-cron";
import { ProductSyncAutomation } from "../services/automation/product-sync";
import { SearchConsoleMonitoring } from "../services/automation/search-monitoring";

export function setupGoogleEcosystemJobs() {
  const productSync = new ProductSyncAutomation();
  const searchMonitoring = new SearchConsoleMonitoring();

  // Sync new/updated products every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("🔄 Running product sync job...");
    try {
      await productSync.bulkSyncProducts();
    } catch (error) {
      console.error("Product sync job failed:", error);
    }
  });

  // Monitor search performance daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("📊 Running search monitoring job...");
    try {
      await searchMonitoring.monitorSearchPerformance(7);
    } catch (error) {
      console.error("Search monitoring job failed:", error);
    }
  });

  // Check indexing status weekly
  cron.schedule("0 10 * * 1", async () => {
    console.log("🔍 Running indexing check job...");
    try {
      // Get product URLs
      const productUrls = []; // Implementation: fetch from Firebase
      await searchMonitoring.checkIndexingStatus(productUrls);
    } catch (error) {
      console.error("Indexing check job failed:", error);
    }
  });

  console.log("✓ Google Ecosystem jobs configured");
}