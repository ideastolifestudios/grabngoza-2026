import { NextRequest, NextResponse } from 'next/server';
import { bulkSyncFirestoreToMeta } from '@/services/meta/catalog';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

    console.log('Received Header:', authHeader);
    console.log('Expected Secret:', expectedSecret);

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized request.' },
        { status: 401 }
      );
    }

    const result = await bulkSyncFirestoreToMeta();

    return NextResponse.json({
      success: true,
      message: 'Successfully executed catalog sync.',
      details: result,
    });
  } catch (error: any) {
    console.error('Catalog Sync Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error during catalog sync.',
      },
      { status: 500 }
    );
  }
}
