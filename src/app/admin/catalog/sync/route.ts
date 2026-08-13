import { NextResponse } from 'next/server';
import { bulkSyncFirestoreToMeta } from '@/services/meta/catalog';

export async function POST(req: Request) {
  try {
    // Optional: Secret Key Verification to protect the endpoint
    const authHeader = req.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized request.' },
        { status: 401 }
      );
    }

    console.log('[API /api/admin/catalog/sync] Starting catalog bulk sync...');

    const result = await bulkSyncFirestoreToMeta();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bulk catalog sync completed with errors.',
          details: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${result.totalSynced} items across ${result.batchesProcessed} batch(es).`,
      details: result,
    });
  } catch (error: any) {
    console.error('[API /api/admin/catalog/sync] Route handler failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}