#!/usr/bin/env ts-node

import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { GoogleAuthService } from "../src/services/google/auth";
import { GoogleMerchantCenterService } from "../src/services/google/business/merchant-center";
import { GoogleSearchConsoleService } from "../src/services/google/business/search-console";
import { GoogleWorkspaceEmailService } from "../src/services/google/workspace/email";
import { ProductSyncAutomation } from "../src/services/automation/product-sync";

// ============================================================================
// TEST 1: Verify Credentials & Authentication
// ============================================================================
async function testAuthentication() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 1: VERIFY CREDENTIALS & AUTHENTICATION");
  console.log("=".repeat(70) + "\n");

  const authService = new GoogleAuthService();

  try {
    console.log("🔍 Validating Google Workspace credentials...");
    const wsAuth = await authService.getWorkspaceAuth();
    console.log("✅ Workspace Auth: Valid\n");
  } catch (error) {
    console.log(
      "❌ Workspace Auth: Failed -",
      (error as Error).message + "\n"
    );
    return false;
  }

  try {
    console.log("🔍 Validating Google Business credentials...");
    const bsAuth = await authService.getBusinessAuth();
    console.log("✅ Business Auth: Valid\n");
  } catch (error) {
    console.log("❌ Business Auth: Failed -", (error as Error).message + "\n");
    return false;
  }

  try {
    console.log("🔍 Validating Merchant Center ID...");
    const merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID;
    if (!merchantId) throw new Error("GOOGLE_MERCHANT_CENTER_ID not set");
    console.log(`✅ Merchant Center ID: ${merchantId}\n`);
  } catch (error) {
    console.log("❌ Merchant Center ID: Failed -", (error as Error).message + "\n");
  }

  try {
    console.log("🔍 Validating Search Console Property...");
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY;
    if (!siteUrl) throw new Error("GOOGLE_SEARCH_CONSOLE_PROPERTY not set");
    console.log(`✅ Search Console Property: ${siteUrl}\n`);
  } catch (error) {
    console.log(
      "❌ Search Console Property: Failed -",
      (error as Error).message + "\n"
    );
  }

  return true;
}

// ============================================================================
// TEST 2: Product Sync to Merchant Center
// ============================================================================
async function testProductSync() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 2: PRODUCT SYNC TO MERCHANT CENTER");
  console.log("=".repeat(70) + "\n");

  const productSync = new ProductSyncAutomation();

  // Test products
  const testProducts = [
    {
      id: "test-001",
      name: "Premium Cotton T-Shirt",
      description: "High-quality, breathable cotton t-shirt",
      sku: "TS-001",
      barcode: "1234567890123",
      brand: "Grab & Go",
      category: "Clothing > Tops",
      costPrice: 50,
      sellingPrice: 149.99,
      salePrice: 99.99,
      stockQuantity: 25,
      imageUrl:
        "https://via.placeholder.com/300x300?text=T-Shirt",
      slug: "premium-cotton-tshirt",
    },
    {
      id: "test-002",
      name: "Classic Blue Jeans",
      description: "Durable, comfortable blue jeans",
      sku: "JN-001",
      barcode: "1234567890124",
      brand: "Grab & Go",
      category: "Clothing > Bottoms",
      costPrice: 80,
      sellingPrice: 249.99,
      salePrice: 199.99,
      stockQuantity: 15,
      imageUrl:
        "https://via.placeholder.com/300x300?text=Jeans",
      slug: "classic-blue-jeans",
    },
    {
      id: "test-003",
      name: "Summer Dress",
      description: "Light and airy summer dress",
      sku: "DR-001",
      barcode: "1234567890125",
      brand: "Grab & Go",
      category: "Clothing > Dresses",
      costPrice: 70,
      sellingPrice: 199.99,
      stockQuantity: 0, // Out of stock
      imageUrl:
        "https://via.placeholder.com/300x300?text=Dress",
      slug: "summer-dress",
    },
  ];

  console.log(`📦 Syncing ${testProducts.length} test products...\n`);

  const result = await productSync.bulkSyncProducts(testProducts);

  console.log("📋 Sync Results:");
  console.log(`   Total: ${result.total}`);
  console.log(`   Successful: ${result.successful}`);
  console.log(`   Failed: ${result.failed}`);
  console.log(`   Success Rate: ${((result.successful / result.total) * 100).toFixed(1)}%\n`);

  return result.successful > 0;
}

// ============================================================================
// TEST 3: Monitor Search Analytics
// ============================================================================
async function testSearchAnalytics() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 3: MONITOR SEARCH ANALYTICS");
  console.log("=".repeat(70) + "\n");

  const searchConsole = new GoogleSearchConsoleService();

  // Get last 7 days of data
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  console.log(
    `📊 Fetching search analytics for ${startDateStr} to ${endDateStr}\n`
  );

  // Get top queries
  console.log("🔍 Top Search Queries:");
  const queriesResult = await searchConsole.getTopQueries(
    startDateStr,
    endDateStr,
    10
  );

  if (queriesResult.success && queriesResult.queries.length > 0) {
    queriesResult.queries.forEach((q, i) => {
      console.log(`   ${i + 1}. "${q.query}"`);
      console.log(`      Clicks: ${q.clicks}, Impressions: ${q.impressions}`);
      console.log(`      CTR: ${q.ctr}%, Avg Position: ${q.position}`);
    });
  } else {
    console.log("   ℹ️  No query data available (first week of Search Console)\n");
  }

  // Get top pages
  console.log("\n📄 Top Landing Pages:");
  const pagesResult = await searchConsole.getTopPages(
    startDateStr,
    endDateStr,
    10
  );

  if (pagesResult.success && pagesResult.pages.length > 0) {
    pagesResult.pages.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.page}`);
      console.log(`      Clicks: ${p.clicks}, Impressions: ${p.impressions}`);
      console.log(`      CTR: ${p.ctr}%, Avg Position: ${p.position}`);
    });
  } else {
    console.log("   ℹ️  No page data available (first week of Search Console)\n");
  }

  // Get overall metrics
  console.log("\n📈 Overall Search Metrics:");
  const metricsResult = await searchConsole.getSearchMetrics(
    startDateStr,
    endDateStr
  );

  if (metricsResult.success) {
    console.log(`   Total Clicks: ${metricsResult.metrics.totalClicks}`);
    console.log(`   Total Impressions: ${metricsResult.metrics.totalImpressions}`);
    console.log(`   Average CTR: ${(metricsResult.metrics.averageCTR * 100).toFixed(2)}%`);
    console.log(`   Average Position: ${metricsResult.metrics.averagePosition.toFixed(2)}\n`);
  } else {
    console.log(`   ℹ️  ${metricsResult.error}\n`);
  }

  return queriesResult.success || pagesResult.success;
}

// ============================================================================
// TEST 4: Set Up Team Email Accounts
// ============================================================================
async function testEmailSetup() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 4: SET UP TEAM EMAIL ACCOUNTS");
  console.log("=".repeat(70) + "\n");

  const emailService = new GoogleWorkspaceEmailService();
  const domain = process.env.GOOGLE_WORKSPACE_DOMAIN;

  if (!domain) {
    console.log(
      "❌ GOOGLE_WORKSPACE_DOMAIN not set. Skipping email setup test.\n"
    );
    return false;
  }

  const teamMembers = [
    {
      firstName: "John",
      lastName: "Manager",
      email: `john.manager@${domain}`,
      role: "manager" as const,
    },
    {
      firstName: "Sarah",
      lastName: "Support",
      email: `sarah.support@${domain}`,
      role: "support" as const,
    },
    {
      firstName: "Mike",
      lastName: "Warehouse",
      email: `mike.warehouse@${domain}`,
      role: "warehouse" as const,
    },
    {
      firstName: "Emma",
      lastName: "Marketing",
      email: `emma.marketing@${domain}`,
      role: "marketing" as const,
    },
  ];

  console.log(`👥 Creating ${teamMembers.length} team email accounts...\n`);

  const results = [];

  for (const member of teamMembers) {
    console.log(`Creating: ${member.email} (${member.role})`);
    const result = await emailService.createUserEmail(member);

    if (result.success) {
      console.log(`✅ Account created`);
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Temp Password: ${result.tempPassword}`);
      console.log(`   Note: User must change password on first login\n`);
      results.push({ email: member.email, success: true });
    } else {
      console.log(`❌ Failed: ${result.error}\n`);
      results.push({ email: member.email, success: false });
    }
  }

  const successful = results.filter((r) => r.success).length;
  console.log(
    `📊 Summary: ${successful}/${teamMembers.length} accounts created\n`
  );

  return successful > 0;
}

// ============================================================================
// TEST 5: Configure Automated Workflow
// ============================================================================
async function testAutomatedWorkflow() {
  console.log("\n" + "=".repeat(70));
  console.log("TEST 5: CONFIGURE AUTOMATED WORKFLOW");
  console.log("=".repeat(70) + "\n");

  const productSync = new ProductSyncAutomation();

  console.log("🔄 Workflow Scenario: Product Price & Inventory Updates\n");

  // Simulate a product price update
  console.log("Step 1: Update product price...");
  const priceUpdate = await productSync.updateProductPrice(
    "test-001",
    139.99,
    89.99
  );
  console.log(
    `   ${priceUpdate.status === "updated" ? "✅" : "❌"} ${priceUpdate.status}`
  );

  // Simulate inventory update
  console.log("\nStep 2: Update product inventory...");
  const inventoryUpdate = await productSync.updateProductInventory(
    "test-002",
    12
  );
  console.log(
    `   ${inventoryUpdate.status === "updated" ? "✅" : "❌"} ${inventoryUpdate.status}`
  );

  // Simulate out of stock
  console.log("\nStep 3: Mark product as out of stock...");
  const outOfStock = await productSync.updateProductInventory("test-003", 0);
  console.log(
    `   ${outOfStock.status === "updated" ? "✅" : "❌"} ${outOfStock.status}`
  );

  // View sync log
  console.log("\n📋 Sync Activity Log:");
  const syncLog = productSync.getLastNSyncEntries(10);
  syncLog.forEach((entry, i) => {
    const timestamp = entry.timestamp.toLocaleTimeString();
    const icon = entry.status === "success" ? "✅" : "❌";
    console.log(`   ${i + 1}. [${timestamp}] ${icon} ${entry.message}`);
  });

  console.log("\n");

  return true;
}

// ============================================================================
// Main Execution
// ============================================================================
async function runAllTests() {
  console.clear();
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(15) + "GOOGLE ECOSYSTEM - LOCAL INTEGRATION TESTS" + " ".repeat(11) + "║");
  console.log("╚" + "═".repeat(68) + "╝");

  const tests = [
    { name: "Authentication", fn: testAuthentication },
    { name: "Product Sync", fn: testProductSync },
    { name: "Search Analytics", fn: testSearchAnalytics },
    { name: "Email Setup", fn: testEmailSetup },
    { name: "Automated Workflow", fn: testAutomatedWorkflow },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(
        `\n❌ Test "${test.name}" crashed:`,
        (error as Error).message + "\n"
      );
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("TEST SUMMARY");
  console.log("=".repeat(70) + "\n");

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "⚠️ ";
    const status = result.passed ? "PASSED" : "CHECK REQUIRED";
    console.log(`${icon} ${result.name.padEnd(25)} ${status}`);
  });

  const passedCount = results.filter((r) => r.passed).length;
  console.log(
    `\n📊 Overall: ${passedCount}/${results.length} tests passed\n`
  );

  if (passedCount === results.length) {
    console.log("🎉 All tests passed! Google Ecosystem is ready.\n");
    process.exit(0);
  } else {
    console.log(
      "⚠️  Some tests require attention. Check configurations above.\n"
    );
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error("\n💥 Test suite failed:", error);
  process.exit(1);
});
