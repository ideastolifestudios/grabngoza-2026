// @ts-nocheck
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