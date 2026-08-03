import { MetaAuthService } from '../src/services/meta/auth';
import { MetaShopService } from '../src/services/meta/shop';

async function testMetaSetup() {
  console.log('Testing Meta Ecosystem Setup...\n');

  const auth = new MetaAuthService();
  const shop = new MetaShopService();

  try {
    console.log('✓ Testing Meta Auth...');
    const isValid = await auth.validateToken();
    if (!isValid) {
      console.log('⚠️ Token validation returned false (expected if using placeholder credentials in .env.local).');
    } else {
      console.log('✓ Meta Auth: Valid\n');
    }

    console.log('✓ Testing Meta Shops...');
    const shopStatus = await shop.getSalesChannelStatus();
    console.log(`  Instagram Shop: ${shopStatus.instagram ? '✓ Connected' : '✗ Inactive/Placeholder'}`);
    console.log(`  Facebook Shop: ${shopStatus.facebook ? '✓ Connected' : '✗ Inactive/Placeholder'}\n`);

    console.log('✅ Meta Ecosystem configuration check completed!');
  } catch (error) {
    console.error('❌ Setup check encountered an error:', error);
  }
}

testMetaSetup();
