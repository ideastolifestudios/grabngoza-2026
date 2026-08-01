// @ts-nocheck
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