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
      return NextResponse.json(
        {
          status: "active",
          provider: "yoco",
          publicKey: publicKey,
          configured: Boolean(publicKey),
        },
        { status: 200 }
      );
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
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body provided in request" },
        { status: 400 }
      );
    }

    const { amountInCents, currency = "ZAR", metadata, token } = body;
    const secretKey = process.env.YOCO_SECRET_KEY;

    if (!secretKey) {
      console.error("[API/Payments] Missing YOCO_SECRET_KEY in environment variables");
      return NextResponse.json(
        { error: "Payment gateway misconfigured: Missing YOCO_SECRET_KEY" },
        { status: 500 }
      );
    }

    // Extract token string if passed as an object ({ id: 'tok_...' }) or raw string
    const tokenString = typeof token === "object" && token?.id ? token.id : token;

    if (!tokenString) {
      console.error("[API/Payments] Missing token in payload:", body);
      return NextResponse.json(
        { error: "Missing charge token in request payload" },
        { status: 400 }
      );
    }

    // Convert and validate amount in cents
    const parsedAmount = Math.round(Number(amountInCents));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("[API/Payments] Invalid amountInCents:", amountInCents);
      return NextResponse.json(
        { error: "Invalid amount provided for payment processing" },
        { status: 400 }
      );
    }

    console.log(`[API/Payments] Charge request: ${parsedAmount} ${currency}`);

    const response = await fetch("https://online.yoco.com/v1/charges/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey.trim()}`,
      },
      body: JSON.stringify({
        token: tokenString,
        amountInCents: parsedAmount,
        currency,
        metadata: metadata || {},
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    if (!response.ok) {
      console.error(`[API/Payments] Yoco API error (${response.status}):`, data);
      return NextResponse.json(
        { error: data.errorMessage || data.message || "Yoco charge failed", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("[API/Payments] POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
