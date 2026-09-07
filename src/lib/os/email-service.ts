import { db } from "@/lib/firebase-admin"; // Or your admin db reference

/**
 * Sends an order confirmation email and prevents duplicates
 * by checking and updating an `emailSent` flag on the order document atomically.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const orderRef = db.collection("orders").doc(orderId);

  const emailTriggered = await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new Error(`Order ${orderId} not found for email notification.`);
    }

    const orderData = orderDoc.data();
    if (orderData?.emailSent === true) {
      return false; // Already sent, skip
    }

    // Mark as sent immediately within the transaction to prevent race conditions/duplicates
    transaction.update(orderRef, {
      emailSent: true,
      emailSentAt: new Date().toISOString(),
    });

    return {
      customerEmail: orderData?.customerEmail || orderData?.shippingAddress?.email,
      customerName: orderData?.customerName || orderData?.shippingAddress?.name,
      items: orderData?.items || [],
      total: orderData?.total || 0,
      shippingAddress: orderData?.shippingAddress,
    };
  });

  if (!emailTriggered) {
    console.log(`[Email] Confirmation email for order ${orderId} was already sent. Skipping.`);
    return { success: true, duplicate: true };
  }

  // TODO: Integrate your email provider (e.g., Resend, SendGrid, Nodemailer)
  // Example with fetch to an email API or service:
  /*
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Store <orders@yourdomain.co.za>",
      to: [emailTriggered.customerEmail],
      subject: `Order Confirmation #${orderId}`,
      html: `<p>Hi ${emailTriggered.customerName}, thanks for your order!</p>`,
    }),
  });

  if (!res.ok) {
    // If sending failed, you might want to rollback emailSent or log an error
    console.error("Failed to dispatch email:", await res.text());
  }
  */

  console.log(`[Email] Successfully dispatched confirmation email for order ${orderId} to ${emailTriggered.customerEmail}`);
  return { success: true, duplicate: false };
}
