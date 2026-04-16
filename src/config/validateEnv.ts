// Validate required environment variables at startup
export function validateEnvironment() {
  const required = [
    'APP_URL',
    'YOCO_SECRET_KEY',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'BUSINESS_EMAIL',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
  ];

  const missing: string[] = [];

  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn('⚠️  Warning: Some environment variables are missing. Features may not work.');
    }
  }

  console.log('✅ Environment validation passed');
}