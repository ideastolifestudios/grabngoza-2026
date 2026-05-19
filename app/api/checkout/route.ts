import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface CheckoutBody {
  token: string;
  amountInCents: number;
  customerEmail: string;
  customerName: string;
  phone: string;
  shippingAddress: {
    firstName: string; lastName: string; line1: string; line2?: string;
    city: string; province: string; postalCode: string; country: string;
  };
  items: Array<{
    productId: string; productName: string; productImage: string;
    price: number; size: string; quantity: number;
  }>;
  shippingCost: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();
    const { token, amountInCents, customerEmail, customerName, phone, shippingAddress, items, shippingCost } = body;

    if (!token || !amountInCents || !customerEmail || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 1. Charge via Yoco ──
    const yocoRes = await fetch("https://payments.yoco.com/api/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify({ token, amountInCents, currency: "ZAR" }),
    });

    const charge = await yocoRes.json();

    if (!yocoRes.ok || charge.status !== "successful") {
      return NextResponse.json(
        { error: charge.displayMessage || "Payment failed. Please try again." },
        { status: 400 }
      );
    }

    // ── 2. Create order in Firestore (server-side, trusted) ──
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + shippingCost;

    const orderRef = await adminDb.collection("orders").add({
      items,
      customerEmail,
      customerName,
      phone,
      shippingAddress,
      subtotal,
      shippingCost,
      total,
      paymentReference: charge.id,
      yocoChargeId: charge.id,
      status: "paid",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // ── 3. Mark cart as converted (best-effort) ──
    const cartId = req.headers.get("x-cart-id");
    if (cartId) {
      try {
        await adminDb.collection("carts").doc(cartId).update({
          converted: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch {}
    }

    return NextResponse.json({ orderId: orderRef.id, success: true });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}