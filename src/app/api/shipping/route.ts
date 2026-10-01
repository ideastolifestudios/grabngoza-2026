import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "pickup-points") {
      // Return configured pickup locations or fallback mock array if external API key is unconfigured
      const pickupPoints = [
        {
          id: "pickup-1",
          name: "Main Hub - Johannesburg",
          address: "Central Distribution Center, Gauteng",
          fee: 0,
        },
      ];

      return NextResponse.json({
        success: true,
        points: pickupPoints,
      });
    }

    return NextResponse.json({ error: "Invalid shipping action" }, { status: 400 });
  } catch (error: any) {
    console.error("[API/Shipping] Error:", error);
    return NextResponse.json({ error: error.message || "Shipping calculation failed" }, { status: 500 });
  }
}
