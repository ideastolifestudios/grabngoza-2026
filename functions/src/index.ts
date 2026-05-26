import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// ── Email transporter ─────────────────────────────────────────────────────────
// Configure via Firebase environment: firebase functions:config:set smtp.host="..." etc.
function createTransporter() {
  const config = functions.config();
  return nodemailer.createTransport({
    host: config.smtp?.host || "smtp.gmail.com",
    port: parseInt(config.smtp?.port || "587"),
    secure: false,
    auth: {
      user: config.smtp?.user,
      pass: config.smtp?.pass,
    },
  });
}

// ── Abandoned cart recovery (runs every hour) ─────────────────────────────────
export const abandonedCartReminder = functions
  .region("us-central1")
  .pubsub.schedule("every 60 minutes")
  .onRun(async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const snapshot = await db
      .collection("carts")
      .where("updatedAt", "<", oneHourAgo)
      .where("updatedAt", ">", threeDaysAgo) // Don't email stale carts
      .where("emailSent", "==", false)
      .where("converted", "==", false)
      .limit(50) // Rate limit — process 50 per run
      .get();

    if (snapshot.empty) {
      functions.logger.info("No abandoned carts found");
      return null;
    }

    const transporter = createTransporter();
    const siteUrl = functions.config().app?.url || "https://shopgrabngo.co.za";
    let sent = 0;
    let failed = 0;

    for (const cartDoc of snapshot.docs) {
      const cart = cartDoc.data();
      if (!cart.email || !cart.items?.length) {
        await cartDoc.ref.update({ emailSent: true }); // Skip invalid
        continue;
      }

      try {
        const itemsHtml = cart.items
          .map((item: { productName: string; size: string; quantity: number; price: number }) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #eee;">
                <strong style="color:#0a0a0a;font-size:13px;">${item.productName}</strong><br/>
                <span style="color:#999;font-size:11px;">Size: ${item.size} · Qty: ${item.quantity}</span>
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700;color:#0a0a0a;">
                R${(item.price * item.quantity).toLocaleString("en-ZA")}
              </td>
            </tr>
          `)
          .join("");

        const totalAmount = cart.totalPrice || 0;
        const freeDeliveryRemaining = Math.max(1000 - totalAmount, 0);

        await transporter.sendMail({
          from: `"Grab & Go" <${functions.config().smtp?.user}>`,
          to: cart.email,
          subject: "You left something behind 👀 — Your cart is waiting",
          html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">

    <!-- Header -->
    <div style="background:#104431;padding:32px 40px;text-align:center;">
      <p style="color:white;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:700;margin:0 0 4px;">GRAB &amp; GO</p>
      <p style="color:rgba(255,255,255,0.5);font-size:10px;letter-spacing:0.1em;text-transform:uppercase;margin:0;">Premium Streetwear · South Africa</p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">
      <h1 style="font-size:28px;font-weight:800;color:#0a0a0a;text-transform:uppercase;letter-spacing:-0.5px;margin:0 0 12px;">
        Your cart misses you
      </h1>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
        You left some heat behind. Your items are still here — but they won't last long.
      </p>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td style="padding-top:12px;font-size:13px;font-weight:700;color:#0a0a0a;text-transform:uppercase;letter-spacing:0.05em;">Total</td>
            <td style="padding-top:12px;text-align:right;font-size:18px;font-weight:800;color:#0a0a0a;">R${totalAmount.toLocaleString("en-ZA")}</td>
          </tr>
        </tfoot>
      </table>

      ${freeDeliveryRemaining > 0 ? `
      <!-- Free delivery nudge -->
      <div style="background:#104431;padding:14px 18px;margin-bottom:24px;">
        <p style="color:white;font-size:12px;font-weight:600;margin:0;">
          🚚 Add <strong style="color:#18A374;">R${freeDeliveryRemaining.toLocaleString("en-ZA")}</strong> more to get FREE delivery!
        </p>
      </div>` : `
      <div style="background:#18A374;padding:14px 18px;margin-bottom:24px;">
        <p style="color:white;font-size:12px;font-weight:600;margin:0;">✓ Your order qualifies for FREE delivery!</p>
      </div>`}

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${siteUrl}/cart"
          style="display:inline-block;background:#18A374;color:white;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;padding:16px 40px;">
          COMPLETE MY ORDER →
        </a>
      </div>

      <!-- Limited stock note -->
      <p style="text-align:center;color:#999;font-size:11px;letter-spacing:0.05em;">
        Limited quantities available. Don't miss out.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f6f6f6;padding:24px 40px;text-align:center;border-top:1px solid #e5e5e5;">
      <p style="color:#999;font-size:10px;letter-spacing:0.1em;margin:0 0 8px;text-transform:uppercase;">
        © 2026 Grab &amp; Go. All rights reserved.
      </p>
      <p style="color:#bbb;font-size:10px;margin:0;">
        Based in South Africa · shipping nationwide ·
        <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(cart.email)}" style="color:#bbb;">unsubscribe</a>
      </p>
    </div>
  </div>
</body></html>`,
        });

        await cartDoc.ref.update({ emailSent: true, emailSentAt: admin.firestore.FieldValue.serverTimestamp() });
        sent++;
        functions.logger.info(`Abandoned cart email sent to ${cart.email}`);
      } catch (emailErr) {
        failed++;
        functions.logger.error(`Failed to send abandoned cart email to ${cart.email}:`, emailErr);
      }
    }

    functions.logger.info(`Abandoned cart run complete: ${sent} sent, ${failed} failed`);
    return null;
  });

// ── Order status webhook (optional — for future shipping integrations) ────────
export const onOrderCreated = functions
  .region("us-central1")
  .firestore.document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();
    functions.logger.info(`New order created: ${context.params.orderId}`, {
      email: order.customerEmail,
      total: order.total,
    });
    // TODO: Send order confirmation email, notify admin via WhatsApp, etc.
    return null;
  });