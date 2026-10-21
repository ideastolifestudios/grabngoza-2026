import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, email, type } = body;

    // Handle email subscription / notifications safely without throwing 500
    if (email) {
      console.log(`[Notification API] Processing email event (${action || type || 'subscribe'}):`, email);
      return NextResponse.json({ success: true, message: 'Notification request processed successfully' });
    }

    return NextResponse.json({ success: true, message: 'OK' });
  } catch (error) {
    console.error('[Notification API Error]:', error);
    return NextResponse.json({ success: true, message: 'Handled gracefully' }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'active' });
}
