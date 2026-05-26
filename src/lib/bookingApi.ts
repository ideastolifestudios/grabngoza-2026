// src/lib/bookingApi.ts
// Sizabantu Barbershop — CodeWords Calendar Booking API Client
// Drop this file into your React + Vite project

const API_BASE = "https://runtime.codewords.ai/run";
const SERVICE_ID = "sizabantu_calendar_booking_9a021c41";
const API_KEY = import.meta.env.NEXT_PUBLIC_CODEWORDS_API_KEY;

interface TimeSlot {
  start: string;
  end: string;
  display: string;
}

interface AvailabilityResponse {
  date: string;
  total_slots: number;
  slots: TimeSlot[];
}

interface BookingResponse {
  success: boolean;
  message: string;
  event_id: string | null;
  event_link: string | null;
  start: string | null;
  end: string | null;
}

interface CancelResponse {
  success: boolean;
  message: string;
}

async function callApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${API_BASE}/${SERVICE_ID}${path ? `/${path}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Booking API error ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Check available time slots for a given date.
 * @param date - Date in YYYY-MM-DD format (e.g. "2026-05-06")
 * @param durationMin - Appointment duration in minutes (default 30)
 * @returns Available time slots between 08:00-18:00 SAST
 */
export async function getAvailability(
  date: string,
  durationMin = 30
): Promise<AvailabilityResponse> {
  return callApi<AvailabilityResponse>("availability", {
    date,
    duration_minutes: durationMin,
  });
}

/**
 * Create a barbershop booking synced to Google Calendar.
 * Store the returned event_id in your Firestore booking document
 * so the admin dashboard can cancel it later.
 */
export async function createBooking(booking: {
  service_name: string;
  client_name: string;
  client_phone: string;
  start_time: string; // ISO 8601 with tz e.g. "2026-05-06T10:00:00+02:00"
  duration_minutes: number;
  verification_code: string;
  barber_name?: string;
  booking_type?: "scheduled" | "queue";
}): Promise<BookingResponse> {
  return callApi<BookingResponse>("", booking);
}

/**
 * Cancel a booking by removing the Google Calendar event.
 * @param eventId - The event_id returned from createBooking
 */
export async function cancelBooking(eventId: string): Promise<CancelResponse> {
  return callApi<CancelResponse>("cancel", { event_id: eventId });
}
