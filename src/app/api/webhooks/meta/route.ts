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

    // Verify incoming object type
    if (body.object === 'product_catalog') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const catalogId = entry.id;
        const changes = entry.changes || [];

        for (const change of changes) {
          const { field, value } = change;
          const retailerId = value?.retailer_id || value?.product_item_id || value?.id;

          console.log(`[Meta Webhook] Catalog: ${catalogId} | Field: ${field} | Item: ${retailerId}`);

          switch (field) {
            case 'availability':
              // Handle stock status updates (in stock / out of stock)
              console.log(`[Meta Stock Update] Item ${retailerId} status: ${value?.availability}`);
              break;

            case 'price':
              // Handle price changes updated via Meta Commerce Manager
              console.log(`[Meta Price Update] Item ${retailerId} price: ${value?.price} ${value?.currency}`);
              break;

            case 'inventory_level':
              // Handle real-time quantity level changes
              console.log(`[Meta Inventory Update] Item ${retailerId} stock count: ${value?.inventory_level}`);
              break;

            case 'product_item':
              // Handle item deletion or structural modifications
              console.log(`[Meta Product Change] Action: ${value?.action} on Item: ${retailerId}`);
              break;

            default:
              console.log(`[Meta Unhandled Field] ${field}:`, value);
              break;
          }
        }
      }
    }

    // Always respond with 200 within 20 seconds to prevent Meta retries
    return NextResponse.json({ status: 'EVENT_RECEIVED' }, { status: 200 });
  } catch (error: any) {
    console.error('[Meta Webhook POST Error]:', error);
    // Return 200 to prevent Meta retry loop overhead on corrupt payloads
    return NextResponse.json({ status: 'ERROR_HANDLED', error: error.message }, { status: 200 });
  }
}
