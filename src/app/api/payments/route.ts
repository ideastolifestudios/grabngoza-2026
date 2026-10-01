import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    const publicKey = 
      process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || 
      process.env.YOCO_PUBLIC_KEY || 
      "";

    if (action === "yoco" || !action) {
      return NextResponse.json({
        status: "active",
        provider: "yoco",
        publicKey: publicKey,
        configured: Boolean(publicKey),
      }, { status: 200 });
    }

    return NextResponse.json({ status: "active", action }, { status: 200 });
  } catch (error: any) {
    console.error("[API/Payments] GET Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error", status: "error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amountInCents, currency = "ZAR", metadata, token } = body;
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment gateway misconfigured: Missing YOCO_SECRET_KEY in Vercel environment variables." },
        { status: 400 }
      );
    }

    const response = await fetch("https://online.yoco.com/v1/charges/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        token,
        amountInCents,
        currency,
        metadata,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API/Payments] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
