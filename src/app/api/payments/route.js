import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Check the ?action= query parameter
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'yoco') {
      const body = await request.json();
      const { token, amountInCents, currency } = body;

      // 1. Validate token presence
      if (!token) {
        return NextResponse.json(
          { error: 'Missing charge token in request payload' }, 
          { status: 400 }
        );
      }

      // 2. Send the charge request to Yoco
      const yocoResponse = await fetch('https://online.yoco.com/v1/charges/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.YOCO_SECRET_KEY}`, 
        },
        body: JSON.stringify({
          token: token,
          amountInCents: amountInCents,
          currency: currency || 'ZAR',
        }),
      });

      const chargeResult = await yocoResponse.json();

      // 3. Return errors directly from Yoco if it fails
      if (!yocoResponse.ok) {
        return NextResponse.json(chargeResult, { status: yocoResponse.status });
      }

      // 4. Success!
      return NextResponse.json(chargeResult, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Backend Payment Error:', error);
    return NextResponse.json(
      { error: 'Failed to contact Yoco Gateway' }, 
      { status: 500 }
    );
  }
}
