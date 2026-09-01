import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'grabngo_meta_webhook_secret';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook] Verification successful.');
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[Meta Webhook] Verification failed. Token mismatch.');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.object === 'product_catalog') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const catalogId = entry.id;
        const changes = entry.changes || [];

        for (const change of changes) {
          const { field, value } = change;
          console.log(`[Meta Webhook] Catalog: ${catalogId} | Field: ${field}`);

          switch (field) {
            case 'items_batch':
              console.log('[Meta Items Batch Update]:', JSON.stringify(value, null, 2));
              break;

            case 'product_feed':
              console.log('[Meta Product Feed Status]:', JSON.stringify(value, null, 2));
              break;

            default:
              console.log(`[Meta Unhandled Field] ${field}:`, value);
              break;
          }
        }
      }
    }

    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook POST Error]:', error);
    return NextResponse.json({ status: 'ERROR_HANDLED', error: error.message }, { status: 200 });
  }
}
