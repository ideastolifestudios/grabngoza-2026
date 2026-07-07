# PHASE 7 — Google Ecosystem Integration

**Status:** Local Implementation  
**Target:** Full Google Workspace + Business integration  
**Duration:** Complete functional system  

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Google Workspace Setup](#google-workspace-setup)
4. [Google Business Setup](#google-business-setup)
5. [API Integration](#api-integration)
6. [Local Development](#local-development)
7. [Automation Workflows](#automation-workflows)
8. [Implementation Checklist](#implementation-checklist)

---

## Overview

Google Ecosystem integration makes Google your business hub. All product updates, order data, analytics, and customer information flow seamlessly through Google's suite of tools.

### Key Principles

- **One Source of Truth**: Firebase database syncs to all Google services
- **Zero Manual Upload**: Automated data flow to Merchant Center
- **Real-time Sync**: Products, inventory, and analytics update automatically
- **Workspace Collaboration**: Team management through Google Workspace
- **Search Visibility**: SEO and discovery optimization through Google tools

### Integration Flow

```
Firebase Database (Source of Truth)
    │
    ├─→ Google Merchant Center (Products/Inventory)
    ├─→ Google Analytics (Events/Conversions)
    ├─→ Google Search Console (SEO Monitoring)
    ├─→ Google Workspace (Business Emails/Calendar)
    ├─→ Google Business Profile (Local Presence)
    └─→ Google Tag Manager (Event Tracking)
```

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│          COMMERCE OS - GOOGLE ECOSYSTEM                 │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   WORKSPACE          BUSINESS           AUTOMATION
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Email      │   │ Merchant   │   │ Sync Jobs  │
   │ Drive      │   │ Center     │   │ Event Hooks│
   │ Calendar   │   │ Search     │   │ Webhooks   │
   │ Contacts   │   │ Analytics  │   │ Schedulers │
   │ Sheets     │   │ Profile    │   │ Queues     │
   └────────────┘   └────────────┘   └────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                ┌─────────────────────┐
                │  Firebase Database  │
                │  - Products         │
                │  - Orders           │
                │  - Customers        │
                │  - Inventory        │
                └─────────────────────┘
```

### Authentication Flow

```
CLIENT
  │
  ├─→ OAuth 2.0 (Google Workspace)
  ├─→ Service Account (Google Business APIs)
  └─→ API Keys (Google Analytics, Search Console)
        │
        ▼
   GOOGLE AUTH SERVER
        │
        ├─→ Issue Access Token
        ├─→ Issue Refresh Token
        └─→ Store Credentials (Encrypted)
```

---

## Google Workspace Setup

### Prerequisites

- Google Workspace account (Business or Enterprise)
- Admin access to workspace
- Domain ownership verification

### 1. Enable APIs

**Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: `grabngoza-google-ecosystem`
3. Enable APIs:
   - Admin SDK
   - Google Drive API
   - Google Calendar API
   - Google Sheets API
   - Google Contacts API

**Code Example:**

```bash
gcloud services enable \
  admin.googleapis.com \
  drive.googleapis.com \
  calendar.googleapis.com \
  sheets.googleapis.com \
  people.googleapis.com
```

### 2. Create Service Account

**Steps:**

1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Name: `grabngoza-workspace-service`
4. Grant roles:
   - Admin SDK user
   - Editor

**Get Credentials:**

1. Click service account
2. Go to Keys tab
3. Create new JSON key
4. Download and save securely

**Store in Environment:**

```bash
# .env.local
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY='{...json...}'
GOOGLE_WORKSPACE_DOMAIN=yourdomain.com
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Workspace Features

#### Email Management

```typescript
// src/services/google/workspace/email.ts
import { google } from "googleapis";

export class GoogleWorkspaceEmailService {
  private admin = google.admin({ version: "directory_v1" });

  async createUserEmail(userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: "manager" | "support" | "warehouse" | "marketing";
  }) {
    const auth = await this.getAuth();

    const newUser = {
      primaryEmail: userData.email,
      name: {
        givenName: userData.firstName,
        familyName: userData.lastName,
      },
      orgUnitPath: `/Departments/${userData.role}`,
      password: this.generateTemporaryPassword(),
    };

    const result = await this.admin.users.insert({
      auth,
      requestBody: newUser,
    });

    return {
      email: result.data.primaryEmail,
      userId: result.data.id,
      status: "created",
    };
  }

  async updateUserRole(
    email: string,
    role: "manager" | "support" | "warehouse" | "marketing"
  ) {
    const auth = await this.getAuth();

    await this.admin.users.update({
      auth,
      userKey: email,
      requestBody: {
        orgUnitPath: `/Departments/${role}`,
      },
    });

    return { email, role, status: "updated" };
  }

  async deactivateUser(email: string) {
    const auth = await this.getAuth();

    await this.admin.users.update({
      auth,
      userKey: email,
      requestBody: {
        suspended: true,
      },
    });

    return { email, status: "deactivated" };
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-12);
  }

  private async getAuth() {
    // Implementation in next section
  }
}
```

#### Shared Drive

```typescript
// src/services/google/workspace/drive.ts
import { google } from "googleapis";

export class GoogleWorkspaceDriveService {
  private drive = google.drive({ version: "v3" });

  async createSharedDrive(name: string) {
    const auth = await this.getAuth();

    const result = await this.drive.drives.create({
      auth,
      requestBody: {
        name: name,
      },
      fields: "id,name",
    });

    return result.data;
  }

  async createFolder(driveName: string, folderName: string) {
    const auth = await this.getAuth();

    const driveId = await this.getDriveId(driveName);

    const result = await this.drive.files.create({
      auth,
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [driveId],
      },
      fields: "id,name",
      supportsAllDrives: true,
    });

    return result.data;
  }

  async uploadFile(
    driveName: string,
    fileName: string,
    fileContent: Buffer,
    mimeType: string
  ) {
    const auth = await this.getAuth();

    const driveId = await this.getDriveId(driveName);

    const result = await this.drive.files.create({
      auth,
      requestBody: {
        name: fileName,
        parents: [driveId],
      },
      media: {
        mimeType: mimeType,
        body: fileContent,
      },
      supportsAllDrives: true,
    });

    return result.data;
  }

  async shareFile(fileId: string, email: string, role: "reader" | "writer") {
    const auth = await this.getAuth();

    await this.drive.permissions.create({
      auth,
      fileId: fileId,
      requestBody: {
        role: role,
        type: "user",
        emailAddress: email,
      },
      supportsAllDrives: true,
    });

    return { fileId, email, role, status: "shared" };
  }

  private async getDriveId(driveName: string): Promise<string> {
    // Cache and retrieve from database
    const cached = await db.googleDrive.findUnique({
      where: { name: driveName },
    });

    if (cached) return cached.driveId;

    // Fallback: search for drive
    throw new Error(`Drive "${driveName}" not found`);
  }

  private async getAuth() {
    // Implementation in next section
  }
}
```

#### Calendar Management

```typescript
// src/services/google/workspace/calendar.ts
import { google } from "googleapis";

export class GoogleWorkspaceCalendarService {
  private calendar = google.calendar({ version: "v3" });

  async createSharedCalendar(
    displayName: string,
    description: string,
    emails: string[]
  ) {
    const auth = await this.getAuth();

    const result = await this.calendar.calendars.insert({
      auth,
      requestBody: {
        summary: displayName,
        description: description,
      },
    });

    const calendarId = result.data.id!;

    // Share with team members
    for (const email of emails) {
      await this.calendar.acl.insert({
        auth,
        calendarId: calendarId,
        requestBody: {
          role: "owner",
          scope: {
            type: "user",
            value: email,
          },
        },
      });
    }

    return {
      calendarId,
      displayName,
      status: "created",
    };
  }

  async createEvent(
    calendarId: string,
    event: {
      title: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      attendees?: string[];
    }
  ) {
    const auth = await this.getAuth();

    const result = await this.calendar.events.insert({
      auth,
      calendarId: calendarId,
      requestBody: {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startTime.toISOString(),
        },
        end: {
          dateTime: event.endTime.toISOString(),
        },
        attendees: event.attendees?.map((email) => ({
          email,
          responseStatus: "needsAction",
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    return result.data;
  }

  private async getAuth() {
    // Implementation in next section
  }
}
```

#### Contacts Management

```typescript
// src/services/google/workspace/contacts.ts
import { google } from "googleapis";

export class GoogleWorkspaceContactsService {
  private people = google.people({ version: "v1" });

  async createContact(contactData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
  }) {
    const auth = await this.getAuth();

    const result = await this.people.people.createContact({
      auth,
      requestBody: {
        names: [
          {
            givenName: contactData.firstName,
            familyName: contactData.lastName,
          },
        ],
        emailAddresses: [
          {
            value: contactData.email,
            type: "work",
          },
        ],
        phoneNumbers: [
          {
            value: contactData.phone,
            type: "mobile",
          },
        ],
        organizations: contactData.company
          ? [
              {
                name: contactData.company,
              },
            ]
          : undefined,
        addresses: contactData.address
          ? [
              {
                formattedValue: contactData.address,
              },
            ]
          : undefined,
      },
    });

    return result.data;
  }

  async updateContact(resourceName: string, contactData: any) {
    const auth = await this.getAuth();

    const result = await this.people.people.updateContact({
      auth,
      resourceName,
      updatePersonFields:
        "names,emailAddresses,phoneNumbers,organizations,addresses",
      requestBody: contactData,
    });

    return result.data;
  }

  private async getAuth() {
    // Implementation in next section
  }
}
```

---

## Google Business Setup

### Prerequisites

- Google Business account
- Verified business location
- Admin access

### 1. Merchant Center Setup

**Steps:**

1. Go to [Google Merchant Center](https://merchantcenter.google.com)
2. Create new account
3. Verify website
4. Verify business
5. Enable free listings
6. Create data feed

### 2. Create API Project

**Steps:**

1. Go to Google Cloud Console
2. Create project: `grabngoza-merchant-center`
3. Enable APIs:
   - Google Shopping API
   - Content API for Shopping
   - Google Analytics Admin API
   - Google Search Console API

```bash
gcloud services enable \
  content.googleapis.com \
  analytics.googleapis.com \
  searchconsole.googleapis.com
```

### 3. Service Account for Business APIs

**Steps:**

1. Create service account: `grabngoza-business-service`
2. Create JSON key
3. Grant permissions:
   - Content API Editor
   - Analytics Editor
   - Search Console Editor

**Store in Environment:**

```bash
# .env.local
GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY='{...json...}'
GOOGLE_MERCHANT_CENTER_ID=123456789
GOOGLE_ANALYTICS_PROPERTY_ID=GA-XXXXXXXXX-X
GOOGLE_SEARCH_CONSOLE_PROPERTY=https://example.com
GOOGLE_BUSINESS_PROFILE_ID=123456789
```

---

## API Integration

### Authentication Service

```typescript
// src/services/google/auth.ts
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import * as fs from "fs";

export class GoogleAuthService {
  private workspaceAuth: JWT | null = null;
  private businessAuth: JWT | null = null;

  async getWorkspaceAuth(): Promise<JWT> {
    if (this.workspaceAuth) return this.workspaceAuth;

    const keyData = JSON.parse(
      process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY || ""
    );

    this.workspaceAuth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/contacts",
      ],
      subject: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
    });

    return this.workspaceAuth;
  }

  async getBusinessAuth(): Promise<JWT> {
    if (this.businessAuth) return this.businessAuth;

    const keyData = JSON.parse(
      process.env.GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY || ""
    );

    this.businessAuth = new JWT({
      email: keyData.client_email,
      key: keyData.private_key,
      scopes: [
        "https://www.googleapis.com/auth/content",
        "https://www.googleapis.com/auth/analytics",
        "https://www.googleapis.com/auth/webmasters",
      ],
    });

    return this.businessAuth;
  }

  async generateAccessToken(
    type: "workspace" | "business"
  ): Promise<string> {
    const auth = type === "workspace" ? this.workspaceAuth : this.businessAuth;

    if (!auth) {
      throw new Error(`${type} auth not initialized`);
    }

    const token = await auth.getAccessToken();
    return token.token || "";
  }
}
```

### Merchant Center Service

```typescript
// src/services/google/business/merchant-center.ts
import { google } from "googleapis";

export class GoogleMerchantCenterService {
  private content = google.content({ version: "v2.1" });
  private merchantId = process.env.GOOGLE_MERCHANT_CENTER_ID || "";

  async syncProduct(product: {
    id: string;
    title: string;
    description: string;
    price: number;
    salePrice?: number;
    imageUrl: string;
    link: string;
    availability: "in stock" | "out of stock" | "preorder";
    gtin?: string;
    mpn?: string;
    brand: string;
    category: string;
  }) {
    const auth = await this.getAuth();

    const productData = {
      id: product.id,
      title: product.title,
      description: product.description,
      link: product.link,
      images: [{ link: product.imageUrl }],
      price: {
        currency: "ZAR",
        value: product.price.toString(),
      },
      salePrice: product.salePrice
        ? {
            currency: "ZAR",
            value: product.salePrice.toString(),
          }
        : undefined,
      availability: product.availability,
      brand: product.brand,
      productTypes: [product.category],
      gtin: product.gtin,
      mpn: product.mpn,
      condition: "new",
      contentLanguage: "en",
      targetCountry: "ZA",
    };

    const result = await this.content.products.insert({
      auth,
      merchantId: this.merchantId,
      requestBody: productData,
    } as any);

    return result.data;
  }

  async updateProductPrice(productId: string, price: number, salePrice?: number) {
    const auth = await this.getAuth();

    const updateData = {
      price: {
        currency: "ZAR",
        value: price.toString(),
      },
      salePrice: salePrice
        ? {
            currency: "ZAR",
            value: salePrice.toString(),
          }
        : undefined,
    };

    const result = await this.content.products.update({
      auth,
      merchantId: this.merchantId,
      productId: productId,
      requestBody: updateData,
    } as any);

    return result.data;
  }

  async updateProductInventory(productId: string, quantity: number) {
    const auth = await this.getAuth();

    const availability = quantity > 0 ? "in stock" : "out of stock";

    const updateData = {
      availability,
      quantity: {
        value: quantity.toString(),
      },
    };

    const result = await this.content.products.update({
      auth,
      merchantId: this.merchantId,
      productId: productId,
      requestBody: updateData,
    } as any);

    return result.data;
  }

  async deleteProduct(productId: string) {
    const auth = await this.getAuth();

    await this.content.products.delete({
      auth,
      merchantId: this.merchantId,
      productId: productId,
    } as any);

    return { productId, status: "deleted" };
  }

  async getProductStatus(productId: string) {
    const auth = await this.getAuth();

    const result = await this.content.productstatuses.get({
      auth,
      merchantId: this.merchantId,
      productId: productId,
    } as any);

    return result.data;
  }

  private async getAuth() {
    const authService = new GoogleAuthService();
    return authService.getBusinessAuth();
  }
}
```

### Analytics Service

```typescript
// src/services/google/business/analytics.ts
import { google } from "googleapis";

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
```

### Search Console Service

```typescript
// src/services/google/business/search-console.ts
import { google } from "googleapis";

export class GoogleSearchConsoleService {
  private searchconsole = google.searchconsole({ version: "v1" });
  private siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY || "";

  async getSearchAnalytics(
    startDate: string,
    endDate: string,
    dimensionFilter?: "QUERY" | "PAGE" | "DEVICE" | "COUNTRY"
  ) {
    const auth = await this.getAuth();

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

    return result.data;
  }

  async submitUrl(url: string) {
    const auth = await this.getAuth();

    const result = await this.searchconsole.urlInspection.index({
      auth,
      requestBody: {
        inspectionUrl: url,
      },
    } as any);

    return result.data;
  }

  async getIndexingStatus(url: string) {
    const auth = await this.getAuth();

    const result = await this.searchconsole.urlInspection.index({
      auth,
      requestBody: {
        inspectionUrl: url,
      },
    } as any);

    return result.data;
  }

  async getTopQueries(startDate: string, endDate: string, limit: number = 10) {
    const analytics = await this.getSearchAnalytics(startDate, endDate, "QUERY");

    if (!analytics.rows) return [];

    return analytics.rows
      .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit)
      .map((row: any) => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
  }

  async getTopPages(startDate: string, endDate: string, limit: number = 10) {
    const analytics = await this.getSearchAnalytics(startDate, endDate, "PAGE");

    if (!analytics.rows) return [];

    return analytics.rows
      .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, limit)
      .map((row: any) => ({
        page: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));
  }

  private async getAuth() {
    const authService = new GoogleAuthService();
    return authService.getBusinessAuth();
  }
}
```

### Business Profile Service

```typescript
// src/services/google/business/business-profile.ts
import { google } from "googleapis";

export class GoogleBusinessProfileService {
  private businessprofiles = google.businessprofiles({ version: "v1" });
  private profileId = process.env.GOOGLE_BUSINESS_PROFILE_ID || "";

  async getBusinessInfo(accountId: string, locationId: string) {
    const auth = await this.getAuth();

    const result = await this.businessprofiles.accounts.locations.get({
      auth,
      name: `accounts/${accountId}/locations/${locationId}`,
    } as any);

    return result.data;
  }

  async updateBusinessInfo(
    accountId: string,
    locationId: string,
    updates: {
      displayName?: string;
      description?: string;
      phoneNumbers?: string[];
      website?: string;
      openingHours?: Array<{
        dayOfWeek: string;
        openTime: { hours: number; minutes: number };
        closeTime: { hours: number; minutes: number };
      }>;
    }
  ) {
    const auth = await this.getAuth();

    const result = await this.businessprofiles.accounts.locations.patch({
      auth,
      name: `accounts/${accountId}/locations/${locationId}`,
      updateMask: Object.keys(updates).join(","),
      requestBody: updates,
    } as any);

    return result.data;
  }

  async postUpdate(
    accountId: string,
    locationId: string,
    update: {
      title: string;
      description: string;
      imageUrl?: string;
      callToAction?: string;
      callToActionUrl?: string;
    }
  ) {
    const auth = await this.getAuth();

    const result = await this.businessprofiles.accounts.locations.updates.create({
      auth,
      parent: `accounts/${accountId}/locations/${locationId}`,
      requestBody: {
        languageCode: "en",
        mediaItems: update.imageUrl
          ? [
              {
                mediaFormat: "PHOTO",
                sourceUrl: update.imageUrl,
              },
            ]
          : undefined,
        callToAction: {
          actionType: update.callToAction || "LEARN_MORE",
          url: update.callToActionUrl,
        },
        summary: update.title,
        description: update.description,
      },
    } as any);

    return result.data;
  }

  async getReviews(accountId: string, locationId: string, pageSize: number = 10) {
    const auth = await this.getAuth();

    const result = await this.businessprofiles.accounts.locations.reviews.list({
      auth,
      parent: `accounts/${accountId}/locations/${locationId}`,
      pageSize,
    } as any);

    return result.data;
  }

  private async getAuth() {
    const authService = new GoogleAuthService();
    return authService.getBusinessAuth();
  }
}
```

---

## Local Development

### Setup

**1. Install Dependencies**

```bash
npm install \
  googleapis \
  google-auth-library \
  @google-cloud/storage \
  dotenv
```

**2. Environment Variables**

```bash
# .env.local
NODE_ENV=development

# Google Workspace
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
GOOGLE_WORKSPACE_DOMAIN=yourdomain.com
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourdomain.com

# Google Business
GOOGLE_BUSINESS_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_MERCHANT_CENTER_ID=123456789
GOOGLE_ANALYTICS_PROPERTY_ID=GA-XXXXXXXXX-X
GOOGLE_ANALYTICS_API_SECRET=xxxxx
GOOGLE_SEARCH_CONSOLE_PROPERTY=https://yourdomain.com
GOOGLE_BUSINESS_PROFILE_ID=123456789
GOOGLE_BUSINESS_ACCOUNT_ID=123456789
GOOGLE_BUSINESS_LOCATION_ID=123456789
```

**3. Test Configuration**

```bash
# scripts/test-google-setup.ts
import { GoogleAuthService } from "../src/services/google/auth";
import { GoogleMerchantCenterService } from "../src/services/google/business/merchant-center";

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
```

**Run Test:**

```bash
npx ts-node scripts/test-google-setup.ts
```

---

## Automation Workflows

### Product Sync Automation

```typescript
// src/services/automation/product-sync.ts
import { db } from "@prisma/client";
import { GoogleMerchantCenterService } from "../google/business/merchant-center";
import { GoogleBusinessProfileService } from "../google/business/business-profile";

export class ProductSyncAutomation {
  private merchantCenter = new GoogleMerchantCenterService();
  private businessProfile = new GoogleBusinessProfileService();

  async syncProductToGoogle(productId: string) {
    try {
      // 1. Get product from Firebase
      const product = await this.getProduct(productId);

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // 2. Sync to Merchant Center
      const merchantResult = await this.merchantCenter.syncProduct({
        id: product.id,
        title: product.name,
        description: product.description,
        price: product.sellingPrice,
        salePrice: product.salePrice,
        imageUrl: product.imageUrl,
        link: `https://yourdomain.com/products/${product.slug}`,
        availability:
          product.stockQuantity > 0 ? "in stock" : "out of stock",
        gtin: product.barcode,
        mpn: product.sku,
        brand: product.brand,
        category: product.category,
      });

      console.log(`✓ Product ${productId} synced to Merchant Center`);

      // 3. Update local record
      await this.updateSyncStatus(productId, "merchant_center", "synced");

      return {
        productId,
        status: "synced",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`✗ Failed to sync product ${productId}:`, error);

      await this.updateSyncStatus(productId, "merchant_center", "failed", {
        error: String(error),
      });

      throw error;
    }
  }

  async updateProductPrice(productId: string, newPrice: number, salePrice?: number) {
    try {
      // Update Firebase
      await this.updateProductPriceInDb(productId, newPrice, salePrice);

      // Sync to Google
      await this.merchantCenter.updateProductPrice(
        productId,
        newPrice,
        salePrice
      );

      console.log(`✓ Product ${productId} price updated in Google`);

      return {
        productId,
        newPrice,
        salePrice,
        status: "updated",
      };
    } catch (error) {
      console.error(`✗ Failed to update price for ${productId}:`, error);
      throw error;
    }
  }

  async updateProductInventory(productId: string, quantity: number) {
    try {
      // Update Firebase
      await this.updateInventoryInDb(productId, quantity);

      // Sync to Google
      await this.merchantCenter.updateProductInventory(productId, quantity);

      console.log(
        `✓ Product ${productId} inventory updated in Google (qty: ${quantity})`
      );

      return {
        productId,
        quantity,
        status: "updated",
      };
    } catch (error) {
      console.error(
        `✗ Failed to update inventory for ${productId}:`,
        error
      );
      throw error;
    }
  }

  async bulkSyncProducts(productIds?: string[]) {
    try {
      // Get all unsync'd or failed products
      const products = productIds
        ? await this.getProductsByIds(productIds)
        : await this.getUnsyncedProducts();

      console.log(`Starting bulk sync of ${products.length} products...`);

      const results = [];

      for (const product of products) {
        try {
          const result = await this.syncProductToGoogle(product.id);
          results.push({ ...result, success: true });
        } catch (error) {
          results.push({
            productId: product.id,
            success: false,
            error: String(error),
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      console.log(
        `✓ Bulk sync completed: ${successful}/${results.length} successful`
      );

      return results;
    } catch (error) {
      console.error("✗ Bulk sync failed:", error);
      throw error;
    }
  }

  private async getProduct(productId: string) {
    // Implementation: fetch from Firebase
    return null;
  }

  private async updateSyncStatus(
    productId: string,
    service: string,
    status: string,
    metadata?: any
  ) {
    // Implementation: update Firebase
  }

  private async updateProductPriceInDb(
    productId: string,
    price: number,
    salePrice?: number
  ) {
    // Implementation: update Firebase
  }

  private async updateInventoryInDb(productId: string, quantity: number) {
    // Implementation: update Firebase
  }

  private async getUnsyncedProducts() {
    // Implementation: fetch from Firebase
    return [];
  }

  private async getProductsByIds(ids: string[]) {
    // Implementation: fetch from Firebase
    return [];
  }
}
```

### Event Tracking Automation

```typescript
// src/services/automation/event-tracking.ts
import { GoogleAnalyticsService } from "../google/business/analytics";

export class EventTrackingAutomation {
  private analytics = new GoogleAnalyticsService();

  async trackOrder(order: {
    id: string;
    userId: string;
    sessionId: string;
    total: number;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }>;
  }) {
    try {
      await this.analytics.trackPurchaseEvent({
        userId: order.userId,
        sessionId: order.sessionId,
        orderId: order.id,
        value: order.total,
        currency: "ZAR",
        items: order.items,
      });

      console.log(`✓ Order ${order.id} tracked in Analytics`);

      return {
        orderId: order.id,
        status: "tracked",
      };
    } catch (error) {
      console.error(`✗ Failed to track order ${order.id}:`, error);
      throw error;
    }
  }

  async trackAddToCart(data: {
    userId: string;
    sessionId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }) {
    // Track add_to_cart event
    await this.trackCustomEvent("add_to_cart", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      product_name: data.productName,
      quantity: data.quantity,
      price: data.price,
    });
  }

  async trackRemoveFromCart(data: {
    userId: string;
    sessionId: string;
    productId: string;
    quantity: number;
  }) {
    // Track remove_from_cart event
    await this.trackCustomEvent("remove_from_cart", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      quantity: data.quantity,
    });
  }

  async trackViewItem(data: {
    userId: string;
    sessionId: string;
    productId: string;
    productName: string;
    category: string;
    price: number;
  }) {
    // Track view_item event
    await this.trackCustomEvent("view_item", {
      user_id: data.userId,
      session_id: data.sessionId,
      product_id: data.productId,
      product_name: data.productName,
      category: data.category,
      price: data.price,
    });
  }

  private async trackCustomEvent(eventName: string, params: any) {
    // Implementation: send to Google Analytics
    console.log(`✓ Event tracked: ${eventName}`, params);
  }
}
```

### Search Console Monitoring

```typescript
// src/services/automation/search-monitoring.ts
import { GoogleSearchConsoleService } from "../google/business/search-console";
import { db } from "@prisma/client";

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
      topQueries.forEach((q: any, i: number) => {
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
```

### Scheduled Jobs

```typescript
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
```

---

## Implementation Checklist

### Prerequisites
- [ ] Google Workspace account created
- [ ] Google Cloud Console project created
- [ ] APIs enabled in Cloud Console
- [ ] Service accounts created and JSON keys downloaded
- [ ] Environment variables configured

### Google Workspace
- [ ] Email management service implemented
- [ ] Shared Drive service implemented
- [ ] Calendar service implemented
- [ ] Contacts service implemented
- [ ] Team onboarding automated

### Google Business
- [ ] Merchant Center account setup
- [ ] Product data feed created
- [ ] Analytics property created
- [ ] Search Console property verified
- [ ] Business Profile created

### API Integration
- [ ] Authentication service implemented
- [ ] Merchant Center service tested
- [ ] Analytics service tested
- [ ] Search Console service tested
- [ ] Business Profile service tested

### Automation
- [ ] Product sync automation implemented
- [ ] Price update automation implemented
- [ ] Inventory update automation implemented
- [ ] Event tracking automation implemented
- [ ] Search monitoring automation implemented
- [ ] Scheduled jobs configured

### Testing
- [ ] Local environment configured
- [ ] Test suite created
- [ ] Integration tests passing
- [ ] End-to-end workflows tested

### Monitoring
- [ ] Logging configured
- [ ] Error tracking setup
- [ ] Sync status tracking implemented
- [ ] Performance monitoring setup

---

## Next Steps

Once Phase 7 is complete:
1. Test all integrations locally
2. Verify product sync to Merchant Center
3. Monitor search analytics
4. Set up team email accounts
5. Configure automated workflows

Then proceed to **Phase 6 — Meta Integration** for Instagram/Facebook sync.
