// src/services/google/business/business-profile.ts
import { google } from "googleapis";
import { GoogleAuthService } from '../auth';

export class GoogleBusinessProfileService {
  private businessprofiles = google.mybusinessbusinessinformation({ version: "v1" });
  private profileId = process.env.GOOGLE_BUSINESS_PROFILE_ID || "";

  async getBusinessInfo(accountId: string, locationId: string) {
    const auth = await this.getAuth();

    const result = await (this.businessprofiles.accounts.locations as any).get({
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