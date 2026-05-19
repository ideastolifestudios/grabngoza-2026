// src/lib/notificationApi.ts
// Sizabantu Barbershop — CodeWords Notification API Client

const API_BASE = "https://runtime.codewords.ai/run";
const SERVICE_ID = "sizabantu_notifications_1c72124a";
const API_KEY = import.meta.env.NEXT_PUBLIC_CODEWORDS_API_KEY;

interface NotifyResponse {
  success: boolean;
  whatsapp_sent: boolean;
  email_sent: boolean;
  message: string;
}

async function callNotifyApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
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
    throw new Error(`Notification API error ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Send booking confirmation via WhatsApp + Email.
 * Call this after createBooking() succeeds.
 */
export async function sendBookingConfirmation(params: {
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_name: string;
  date_display: string;   // "Tuesday 6 May 2026"
  time_display: string;   // "10:00 - 10:30"
  verification_code: string;
  barber_name?: string;
}): Promise<NotifyResponse> {
  return callNotifyApi<NotifyResponse>("", params);
}

/**
 * Send "you're next" queue alert via WhatsApp.
 * Call this when admin clicks "Call Next".
 */
export async function sendQueueAlert(params: {
  client_name: string;
  client_phone: string;
  client_email?: string;
  queue_position?: number;
}): Promise<NotifyResponse> {
  return callNotifyApi<NotifyResponse>("queue-alert", {
    ...params,
    queue_position: params.queue_position ?? 1,
  });
}

/**
 * Send appointment reminder via WhatsApp + Email.
 * Call this ~30 min before scheduled appointments.
 */
export async function sendBookingReminder(params: {
  client_name: string;
  client_phone: string;
  client_email?: string;
  service_name: string;
  date_display: string;
  time_display: string;
}): Promise<NotifyResponse> {
  return callNotifyApi<NotifyResponse>("reminder", params);
}
