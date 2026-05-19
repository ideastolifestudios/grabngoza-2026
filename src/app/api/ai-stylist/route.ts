import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AI fashion stylist for Grab & Go, a premium South African streetwear brand.
Your role: Help customers find outfits, suggest products, advise on sizing, and inspire their style.
Brand vibe: Premium streetwear. Urban. Cultural. South African. Community-first.
Product categories: Apparel (tees, hoodies, sweats), Bottoms (jeans, cargo, shorts), Footwear, Accessories, Bundles.
Pricing: ZAR. Products range from R350 (accessories) to R2,200 (tracksuits).
Tone: Friendly, knowledgeable, culturally aware. Keep responses concise — 2-3 sentences max unless asked for more.
Always end with a relevant call-to-action (e.g. check /collections/new-arrivals).`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Graceful fallback when GEMINI_API_KEY not configured
    if (!apiKey) {
      return NextResponse.json({
        reply: "AI Stylist is almost ready! Add your GEMINI_API_KEY to Vercel environment variables to activate it.",
      });
    }

    const { message, history = [] } = await req.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Lazy import to avoid build errors when package isn't installed
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: (history as Array<{ role: string; content: string }>).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    return NextResponse.json({ reply: result.response.text() });
  } catch (err) {
    console.error("AI Stylist error:", err);
    return NextResponse.json(
      { reply: "I'm having a moment — try again in a few seconds!" },
      { status: 200 } // Return 200 so the UI doesn't crash
    );
  }
}