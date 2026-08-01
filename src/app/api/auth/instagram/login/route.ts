import { NextResponse } from 'next/server';
import { getInstagramLoginUrl } from '@/lib/instagram-auth';

export async function GET() {
  const loginUrl = getInstagramLoginUrl();
  return NextResponse.redirect(loginUrl);
}
