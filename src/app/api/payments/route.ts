import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "yoco") {
      const publicKey = process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY;
      if (!publicKey) {
        console.warn("[API/Payments] NEXT_PUBLIC_YOCO_PUBLIC_KEY is not defined in Vercel env.");
      }

      return NextResponse.json({
        status: "active",
        provider: "yoco",
        publicKey: publicKey || "",
      });
    }

    return NextResponse.json({ error: "Invalid payment action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API/Payments] GET Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amountInCents, currency = "ZAR", metadata } = body;
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Payment gateway misconfigured: Missing YOCO_SECRET_KEY" },
        { status: 500 }
      );
    }

    const response = await fetch("https://online.yoco.com/v1/charges/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        token: body.token,
        amountInCents,
        currency,
        metadata,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("[API/Payments] POST Error:", error);
    return NextResponse.json({ error: error.message || "Payment processing failed" }, { status: 500 });
  }
}
