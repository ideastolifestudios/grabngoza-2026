import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'yoco') {
      const body = await request.json();
      const { amount, currency, metadata } = body;
      const amountInCents = Math.round(amount * 100);

      // Automatically get current origin (e.g., http://localhost:3000 or https://shopgrabngo.co.za)
      const origin = request.headers.get('origin') || 'http://localhost:3000';

      const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`, 
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: currency || 'ZAR',
          successUrl: `${origin}/order-success`,
          cancelUrl: `${origin}/checkout`,
          metadata: metadata
        }),
      });

      const yocoData = await yocoResponse.json();

      if (!yocoResponse.ok) {
        return NextResponse.json(yocoData, { status: yocoResponse.status });
      }

      return NextResponse.json({ redirectUrl: yocoData.redirectUrl }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Backend Payment Error:', error);
    return NextResponse.json(
      { error: 'Failed to create Yoco Checkout session' }, 
      { status: 500 }
    );
  }
}