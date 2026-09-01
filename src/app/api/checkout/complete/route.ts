import { NextRequest, NextResponse } from 'next/server';
import { sendCAPIPurchaseEvent } from '@/lib/meta/capi';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, totalAmount, items, customer } = body;

    if (!orderId || !totalAmount) {
      return NextResponse.json({ success: false, error: 'Missing order details.' }, { status: 400 });
    }

    // Capture user headers & pixel cookies for CAPI attribution matching
    const fbp = req.cookies.get('_fbp')?.value;
    const fbc = req.cookies.get('_fbc')?.value;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined;
    const clientUserAgent = req.headers.get('user-agent') || undefined;

    // Trigger Meta CAPI asynchronously without blocking the client response
    sendCAPIPurchaseEvent({
      orderId,
      totalAmount,
      currency: 'ZAR',
      items: items || [],
      customer: customer || {},
      clientIp,
      clientUserAgent,
      fbp,
      fbc,
    }).catch((err) => console.error('Asynchronous CAPI dispatch failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Order processed and CAPI purchase event queued.',
    });
  } catch (error: any) {
    console.error('Checkout Completion Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
