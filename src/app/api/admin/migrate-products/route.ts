import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

function verifyAdminAuth(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedToken = process.env.ADMIN_API_SECRET || process.env.CRON_SECRET;

  if (!expectedToken) {
    console.warn("ADMIN_API_SECRET / CRON_SECRET is not configured.");
    return false;
  }

  return authHeader === `Bearer ${expectedToken}` || cronSecret === expectedToken;
}

export async function POST(req: Request) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const products = body.products || [];

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided for migration" }, { status: 400 });
    }

    const batch = adminDb.batch();
    let migratedCount = 0;

    for (const product of products) {
      const productId = product.id || product.sku || adminDb.collection("products").doc().id;
      const productRef = adminDb.collection("products").doc(productId);
      
      batch.set(productRef, {
        ...product,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      migratedCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} products into Firestore source of truth.`,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
