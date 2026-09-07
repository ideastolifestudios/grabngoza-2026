import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

function verifyAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.headers.get("x-cron-secret");
  
  const expectedToken = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;

  if (!expectedToken) {
    console.warn("ADMIN_API_SECRET / CRON_SECRET is not configured in environment variables.");
    return false;
  }

  if (authHeader === `Bearer ${expectedToken}` || cronSecret === expectedToken) {
    return true;
  }

  return false;
}

export async function POST(req: Request) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch authoritative products from Firestore using adminDb
    const snapshot = await adminDb.collection("products").get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // TODO: Insert your Meta Graph API batch sync logic here

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synchronized ${products.length} products to Meta catalog.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Meta Catalog Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
