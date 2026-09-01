import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'grabngo_meta_webhook_secret';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta Webhook verified successfully.');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('Meta Webhook verification failed. Token mismatch.');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Meta Webhook Payload:', JSON.stringify(body, null, 2));

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    console.error('Meta Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
