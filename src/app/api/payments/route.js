import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'yoco') {
      const body = await request.json();
      const { amount, currency, metadata } = body;

      // Convert Rands to Cents for Yoco
      const amountInCents = Math.round(amount * 100);

      // Create a Checkout Session using Yoco's Redirect API
      const yocoResponse = await fetch('https://online.yoco.com/v1/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`, 
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: currency || 'ZAR',
          successUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shopgrabngo.co.za'}/order-success`,
          cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://shopgrabngo.co.za'}/checkout`,
          metadata: metadata
        }),
      });

      const yocoData = await yocoResponse.json();

      if (!yocoResponse.ok) {
        return NextResponse.json(yocoData, { status: yocoResponse.status });
      }

      // Return the redirectUrl exactly as HybridCheckoutModal.tsx expects
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