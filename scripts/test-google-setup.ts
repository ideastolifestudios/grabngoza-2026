// scripts/test-google-setup.ts
import { GoogleAuthService } from '../src/services/google/auth.js';
import { GoogleMerchantCenterService } from '../src/services/google/business/merchant-center.js';

async function testSetup() {
  console.log("Testing Google Ecosystem Setup...\n");

  try {
    const authService = new GoogleAuthService();

    console.log("✓ Testing Workspace Auth...");
    const workspaceAuth = await authService.getWorkspaceAuth();
    console.log("✓ Workspace Auth OK\n");

    console.log("✓ Testing Business Auth...");
    const businessAuth = await authService.getBusinessAuth();
    console.log("✓ Business Auth OK\n");

    console.log("✓ Testing Merchant Center...");
    const merchantService = new GoogleMerchantCenterService();
    console.log("✓ Merchant Center Service Ready\n");

    console.log("✅ All Google services configured correctly!");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

testSetup();