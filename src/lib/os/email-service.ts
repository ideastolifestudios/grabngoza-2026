import { adminDb } from "@/lib/firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an order confirmation email via Resend and prevents duplicates
 * using a transactional check on the order document.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const orderRef = adminDb.collection("orders").doc(orderId);

  // 1. Transaction to prevent duplicate emails
  const emailTriggered = await adminDb.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found for email notification.`);
    }

    const orderData = orderDoc.data();
    if (orderData?.emailSent === true) {
      return false; // Already sent, skip
    }

    transaction.update(orderRef, {
      emailSent: true,
      emailSentAt: new Date().toISOString(),
    });

    return {
      customerEmail: orderData?.customerEmail || orderData?.shippingAddress?.email,
      customerName: orderData?.customerName || orderData?.shippingAddress?.name || "Valued Customer",
      items: orderData?.items || [],
      total: orderData?.total || 0,
    };
  });

  if (!emailTriggered) {
    console.log(`[Email] Confirmation email for order ${orderId} was already sent. Skipping.`);
    return { success: true, duplicate: true };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] RESEND_API_KEY is missing from environment variables.");
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  // 2. Send via Resend
  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "orders@shopgrabngo.online";

    const data = await resend.emails.send({
      from: `Grab & Go <${fromAddress}>`,
      to: [emailTriggered.customerEmail],
      subject: `Your Grab & Go Order Confirmation - #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #111;">Order Confirmed!</h2>
          <p>Hi ${emailTriggered.customerName},</p>
          <p>Thank you for shopping with Grab & Go! We've received your payment for order <strong>#${orderId}</strong> and are preparing your order.</p>
          <p><strong>Total Amount Paid:</strong> R${emailTriggered.total}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">If you have any questions, reply directly to this email.</p>
        </div>
      `,
    });

    console.log(`[Email] Dispatched confirmation email for order ${orderId} via Resend. ID: ${data.id}`);
    return { success: true, duplicate: false, emailId: data.id };
  } catch (error: any) {
    console.error(`[Email] Failed to send via Resend for order ${orderId}:`, error);
    return { success: false, error: error.message };
  }
}
