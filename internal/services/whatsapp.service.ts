/**
 * internal/services/whatsapp.service.ts
 *
 * Sends a WhatsApp notification via Meta Cloud API.
 * Uses plain console.log/error — no custom logger import so the
 * TS2554 "expected 1-2 arguments, got 3" error cannot occur here.
 *
 * Required env vars:
 *   WHATSAPP_ACCESS_TOKEN       — Meta system user token
 *   WHATSAPP_PHONE_NUMBER_ID    — From Meta Business → WhatsApp → API Setup
 *   WHATSAPP_ADMIN_NUMBER       — Recipient number, E.164 without +  e.g. 27821234567
 */

const PREFIX = "[WHATSAPP]";

export interface WhatsAppOrderPayload {
  orderId: string;
  email: string;
  amountCents: number;
  itemCount: number;
  paymentId: string;
  createdAt: string;
}

function formatAmount(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatTimeSA(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function buildMessage(order: WhatsAppOrderPayload): string {
  const lines = [
    `New Grab n Go Order`,
    `Order: ${order.orderId}`,
    `Customer: ${order.email}`,
    `Amount: ${formatAmount(order.amountCents)}`,
    `Items: ${order.itemCount}`,
    `Payment ref: ${order.paymentId}`,
    `Time: ${formatTimeSA(order.createdAt)}`,
  ];
  return lines.join("\n");
}

/**
 * Sends an order notification to the admin WhatsApp number.
 * Never throws — all errors are caught and logged.
 * Returns true if message was sent, false if it failed or was skipped.
 */
export async function sendOrderNotification(
  order: WhatsAppOrderPayload
): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_ADMIN_NUMBER;

  if (!token || !phoneNumberId || !recipient) {
    console.warn(
      `${PREFIX} Missing env vars (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ADMIN_NUMBER) — skipping`
    );
    return false;
  }

  const body = buildMessage(order);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "(unreadable)");
      console.error(`${PREFIX} Send failed — status ${res.status}:`, errText);
      return false;
    }

    console.log(`${PREFIX} Notification sent for order: ${order.orderId}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${PREFIX} Network error:`, msg);
    return false;
  }
}
