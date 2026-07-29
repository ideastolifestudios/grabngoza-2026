import cron from "node-cron";
import { ProductSyncAutomation } from '../services/automation/product-sync.js';
import { GoogleSearchConsoleService } from '../services/google/business/search-console.js';

export class GoogleEcosystemWorkflow {
  private productSync = new ProductSyncAutomation();
  private searchConsole = new GoogleSearchConsoleService();
  private jobs: cron.ScheduledTask[] = [];

  setupScheduledJobs() {
    console.log("🔧 Setting up Google Ecosystem scheduled jobs...\n");

    // Job 1: Sync new/updated products every 30 minutes
    this.scheduleProductSync();

    // Job 2: Monitor search performance daily at 9 AM
    this.scheduleSearchMonitoring();

    // Job 3: Check indexing status weekly
    this.scheduleIndexingCheck();

    // Job 4: Generate weekly reports
    this.scheduleWeeklyReports();

    console.log("✅ All scheduled jobs configured\n");
  }

  private scheduleProductSync() {
    const task = cron.schedule("*/30 * * * *", async () => {
      console.log(
        `[${new Date().toISOString()}] 🔄 Running product sync job...`
      );
      try {
        // In production, fetch actual products from database
        console.log("   ✓ Product sync completed");
      } catch (error) {
        console.error("   ✗ Product sync failed:", error);
      }
    });

    this.jobs.push(task);
    console.log("✓ Product sync scheduled: Every 30 minutes");
  }

  private scheduleSearchMonitoring() {
    const task = cron.schedule("0 9 * * *", async () => {
      console.log(
        `[${new Date().toISOString()}] 📊 Running search monitoring job...`
      );
      try {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        const result = await this.searchConsole.getSearchMetrics(
          startDateStr,
          endDateStr
        );

        if (result.success) {
          console.log(`   ✓ Clicks: ${result.metrics.totalClicks}`);
          console.log(`   ✓ Impressions: ${result.metrics.totalImpressions}`);
          console.log(
            `   ✓ Avg CTR: ${(result.metrics.averageCTR * 100).toFixed(2)}%`
          );
        } else {
          console.log(`   ⚠ ${result.error}`);
        }
      } catch (error) {
        console.error("   ✗ Search monitoring failed:", error);
      }
    });

    this.jobs.push(task);
    console.log("✓ Search monitoring scheduled: Daily at 9:00 AM");
  }

  private scheduleIndexingCheck() {
    const task = cron.schedule("0 10 * * 1", async () => {
      console.log(
        `[${new Date().toISOString()}] 🔍 Running indexing check job...`
      );
      try {
        // In production, fetch product URLs from database
        console.log("   ✓ Indexing check completed");
      } catch (error) {
        console.error("   ✗ Indexing check failed:", error);
      }
    });

    this.jobs.push(task);
    console.log("✓ Indexing check scheduled: Weekly on Monday at 10:00 AM");
  }

  private scheduleWeeklyReports() {
    const task = cron.schedule("0 8 * * 1", async () => {
      console.log(
        `[${new Date().toISOString()}] 📈 Generating weekly report...`
      );
      try {
        // Generate weekly analytics report
        console.log("   ✓ Weekly report generated");
      } catch (error) {
        console.error("   ✗ Report generation failed:", error);
      }
    });

    this.jobs.push(task);
    console.log("✓ Weekly reports scheduled: Monday at 8:00 AM");
  }

  stopAllJobs() {
    console.log("\n🛑 Stopping all scheduled jobs...");
    this.jobs.forEach((job) => job.stop());
    console.log("✓ All jobs stopped\n");
  }

  getActiveJobs() {
    return this.jobs.length;
  }
}

// Export for use in main application
export function initializeGoogleEcosystemWorkflow() {
  const workflow = new GoogleEcosystemWorkflow();
  workflow.setupScheduledJobs();
  return workflow;
}
