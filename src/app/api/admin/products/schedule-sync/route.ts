import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Triggered via Vercel Cron or manual ping to publish products whose scheduled release time has arrived.
 */
export async function POST() {
  try {
    const now = new Date().toISOString();

    const snapshot = await adminDb
      .collection("products")
      .where("status", "==", "scheduled")
      .where("scheduledAt", "<=", now)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, publishedCount: 0 });
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "published",
        scheduledAt: null,
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      publishedCount: snapshot.size,
      productIds: snapshot.docs.map((doc) => doc.id),
    });
  } catch (error: any) {
    console.error("[API/Products/ScheduleSync] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
