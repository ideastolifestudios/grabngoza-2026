import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // TODO: Add your email subscription logic here (e.g. Save to DB, Mailchimp, etc.)
    console.log('Subscribed email:', email);

    return NextResponse.json({ success: true, message: 'Subscribed successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}