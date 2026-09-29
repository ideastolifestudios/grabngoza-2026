import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customerEmail, customerName, shippingAddress, total, metadata } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order payload: items array is required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newOrder = {
      items,
      customerEmail: customerEmail || shippingAddress?.email || "",
      customerName: customerName || shippingAddress?.name || "Valued Customer",
      shippingAddress: shippingAddress || null,
      total: total || 0,
      metadata: metadata || {},
      paymentStatus: "pending",
      inventoryDeducted: false,
      emailSent: false,
      createdAt: now,
      updatedAt: now,
    };

    const orderRef = await adminDb.collection("orders").add(newOrder);

    return NextResponse.json(
      { success: true, orderId: orderRef.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[API/Orders] Order Creation Failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error creating order." },
      { status: 500 }
    );
  }
}
