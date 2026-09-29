import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "yoco") {
    return NextResponse.json({
      status: "active",
      provider: "yoco",
      publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY || "",
    });
  }

  return NextResponse.json({ error: "Invalid payment action" }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amountInCents, currency = "ZAR", metadata } = body;

    const response = await fetch("https://online.yoco.com/v1/charges/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
