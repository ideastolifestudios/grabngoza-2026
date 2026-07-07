# LOCAL DEVELOPMENT SETUP - Google Ecosystem Integration

## Quick Start

This guide walks you through setting up the Google Ecosystem integration locally.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud Console access
- Google Workspace admin account
- Google Business account

---

## Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project

```bash
# Navigate to https://console.cloud.google.com
# Create new project: grabngoza-google-ecosystem
# Enable billing
```

### 1.2 Enable Required APIs

```bash
gcloud auth login
gcloud config set project grabngoza-google-ecosystem

# Enable Workspace APIs
gcloud services enable admin.googleapis.com
gcloud services enable drive.googleapis.com
gcloud services enable calendar.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable people.googleapis.com

# Enable Business APIs
gcloud services enable content.googleapis.com
gcloud services enable analytics.googleapis.com
gcloud services enable searchconsole.googleapis.com
```

### 1.3 Create Service Accounts

#### Workspace Service Account

```bash
# Create service account
gcloud iam service-accounts create grabngoza-workspace-service \
  --display-name="Grab & Go Workspace Service"

# Get the service account email
gcloud iam service-accounts list --filter="displayName:Workspace"

# Grant admin directory user role
gcloud projects add-iam-policy-binding grabngoza-google-ecosystem \
  --member=serviceAccount:grabngoza-workspace-service@grabngoza-google-ecosystem.iam.gserviceaccount.com \
  --role=roles/admin.googleapis.com/admin.directory.user

# Create and download JSON key
gcloud iam service-accounts keys create workspace-key.json \
  --iam-account=grabngoza-workspace-service@grabngoza-google-ecosystem.iam.gserviceaccount.com
```

#### Business Service Account

```bash
# Create service account
gcloud iam service-accounts create grabngoza-business-service \
  --display-name="Grab & Go Business Service"

# Grant necessary roles
gcloud projects add-iam-policy-binding grabngoza-google-ecosystem \
  --member=serviceAccount:grabngoza-business-service@grabngoza-google-ecosystem.iam.gserviceaccount.com \
  --role=roles/editor

# Create and download JSON key
gcloud iam service-accounts keys create business-key.json \
  --iam-account=grabngoza-business-service@grabngoza-google-ecosystem.iam.gserviceaccount.com
```

---

## Step 2: Environment Configuration

### 2.1 Create .env.local File

```bash
cp .env.example .env.local
```

### 2.2 Add Workspace Credentials

```bash
# Open workspace-key.json
cat workspace-key.json

# Copy entire JSON content and paste into .env.local
# Set GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY to the full JSON string
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"grabngoza-google-ecosystem","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"grabngoza-workspace-service@grabngoza-google-ecosystem.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Set workspace domain and admin email
GOOGLE_WORKSPACE_DOMAIN=yourdomain.com
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourdomain.com
```

### 2.3 Add Business Credentials

```bash
# Copy business-key.json content
cat business-key.json

# Set in .env.local
GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"grabngoza-google-ecosystem",...}'
```

### 2.4 Add Business IDs

```bash
# Get from Google Merchant Center
GOOGLE_MERCHANT_CENTER_ID=123456789

# Get from Google Analytics
GOOGLE_ANALYTICS_PROPERTY_ID=GA-XXXXXXXXX-X
GOOGLE_ANALYTICS_API_SECRET=xxxxx

# Get from Google Search Console
GOOGLE_SEARCH_CONSOLE_PROPERTY=https://yourdomain.com

# Get from Google Business Profile
GOOGLE_BUSINESS_PROFILE_ID=123456789
GOOGLE_BUSINESS_ACCOUNT_ID=123456789
GOOGLE_BUSINESS_LOCATION_ID=123456789
```

### 2.5 Complete .env.local Example

```bash
# Environment
NODE_ENV=development

# Google Workspace
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY='...'
GOOGLE_WORKSPACE_DOMAIN=yourdomain.com
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourdomain.com

# Google Business
GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY='...'
GOOGLE_MERCHANT_CENTER_ID=123456789
GOOGLE_ANALYTICS_PROPERTY_ID=GA-XXXXXXXXX-X
GOOGLE_ANALYTICS_API_SECRET=xxxxx
GOOGLE_SEARCH_CONSOLE_PROPERTY=https://yourdomain.com
GOOGLE_BUSINESS_PROFILE_ID=123456789
GOOGLE_BUSINESS_ACCOUNT_ID=123456789
GOOGLE_BUSINESS_LOCATION_ID=123456789

# App
DATABASE_URL=...
FIREBASE_CONFIG=...
```

---

## Step 3: Install Dependencies

```bash
npm install googleapis google-auth-library dotenv node-cron
npm install --save-dev @types/node-cron typescript
```

---

## Step 4: Run Integration Tests

### 4.1 Test Authentication

```bash
npm run test:integrations

# Expected output:
# ✅ Workspace Auth: Valid
# ✅ Business Auth: Valid
# ✅ Merchant Center ID: Valid
# ✅ Search Console Property: Valid
```

### 4.2 Test Product Sync

The test will automatically:
- Create 3 test products
- Sync to Merchant Center
- Verify sync status
- Show results

### 4.3 Test Search Analytics

The test will fetch:
- Top search queries (last 7 days)
- Top landing pages
- Overall metrics
- Display in formatted output

### 4.4 Test Email Setup

The test will create team accounts:
- Manager: john.manager@yourdomain.com
- Support: sarah.support@yourdomain.com
- Warehouse: mike.warehouse@yourdomain.com
- Marketing: emma.marketing@yourdomain.com

### 4.5 Test Automated Workflow

The test will simulate:
- Product price updates
- Inventory updates
- Sync log verification

---

## Step 5: Verify Setup

### 5.1 Check Google Merchant Center

```bash
# Visit: https://merchantcenter.google.com
# Verify:
# ✓ Test products appear in feed
# ✓ Product statuses show correctly
# ✓ Images are loaded
# ✓ Prices are accurate
```

### 5.2 Check Google Search Console

```bash
# Visit: https://search.google.com/search-console
# Verify:
# ✓ Property is verified
# ✓ Can see search analytics
# ✓ Indexing status shows pages
```

### 5.3 Check Google Analytics

```bash
# Visit: https://analytics.google.com
# Verify:
# ✓ Property is connected
# ✓ Can see real-time data
# ✓ Events are being tracked
```

### 5.4 Check Google Workspace

```bash
# Visit: https://admin.google.com
# Verify:
# ✓ New user accounts created
# ✓ Departments organized by role
# ✓ Email accounts active
```

---

## Step 6: Run Automated Workflows

### 6.1 Local Development Mode

```bash
npm run dev

# This will:
# 1. Start application server
# 2. Initialize scheduled jobs
# 3. Start monitoring logs
```

### 6.2 Production Deployment

```bash
npm run build
npm run start

# Application will automatically:
# 1. Sync products every 30 minutes
# 2. Monitor search every day at 9 AM
# 3. Check indexing every Monday at 10 AM
# 4. Generate reports every Monday at 8 AM
```

---

## Troubleshooting

### Issue: "Invalid Credentials"

**Solution:**
```bash
# Verify JSON keys are valid
node -e "console.log(JSON.parse(process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY))"

# Check environment variables are set
echo $GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY
```

### Issue: "Merchant Center ID not found"

**Solution:**
```bash
# Get correct ID from:
# 1. Visit https://merchantcenter.google.com
# 2. Click "Settings" → "Business Information"
# 3. Copy "Merchant Center ID"
```

### Issue: "Search Console not connected"

**Solution:**
```bash
# Verify property:
# 1. Visit https://search.google.com/search-console
# 2. Check property is verified
# 3. Ensure URL format matches: https://yourdomain.com
```

### Issue: "Workspace admin email wrong"

**Solution:**
```bash
# Get correct email:
# 1. Visit https://admin.google.com
# 2. Go to Users
# 3. Find account with "Super Admin" role
# 4. Copy email address
```

---

## Next Steps

1. ✅ Complete local setup
2. ✅ Run integration tests
3. ✅ Verify all connections
4. ✅ Deploy to development server
5. → Proceed to Phase 6 — Meta Integration

---

## Support

For issues or questions:
- Check `.env.local` is in `.gitignore`
- Review test output for specific errors
- Verify all credentials in Google Cloud Console
- Check API quotas and usage limits

---

## File Structure

```
src/
├── services/
│   ├── google/
│   │   ├── auth.ts                    (Authentication)
│   │   ├── business/
│   │   │   ├── merchant-center.ts     (Product sync)
│   │   │   └── search-console.ts      (SEO monitoring)
│   │   └── workspace/
│   │       └── email.ts               (Team management)
│   └── automation/
│       └── product-sync.ts            (Sync automation)
├── workflow/
│   └── google-ecosystem-workflow.ts   (Scheduled jobs)
scripts/
├── test-integrations.ts               (Integration tests)

.env.local                             (Configuration)
```

---

## Configuration Checklist

- [ ] Google Cloud Project created
- [ ] APIs enabled
- [ ] Workspace service account created
- [ ] Business service account created
- [ ] JSON keys downloaded
- [ ] `.env.local` created with all credentials
- [ ] Dependencies installed
- [ ] Integration tests passing
- [ ] Merchant Center verified
- [ ] Search Console verified
- [ ] Analytics connected
- [ ] Workspace users created
- [ ] Workflows scheduled

---

**Ready to go!** 🚀

Run `npm run test:integrations` to start testing.
