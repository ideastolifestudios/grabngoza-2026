import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      coupons: [
        { id: 'CPN-01', code: 'WELCOME10', discountType: 'percentage', value: 10, usageCount: 42, active: true, expiresAt: '2026-12-31' },
        { id: 'CPN-02', code: 'FREESHIP', discountType: 'shipping', value: 0, usageCount: 15, active: true, expiresAt: '2026-06-30' },
        { id: 'CPN-03', code: 'BULK20', discountType: 'fixed', value: 100, usageCount: 8, active: false, expiresAt: '2026-03-01' }
      ],
      bundles: [
        { id: 'BND-01', name: 'Snack Pack Combo', items: ['Biltong Snack Pack', 'Energy Bar Box'], bundlePrice: 500, originalPrice: 550, active: true },
        { id: 'BND-02', name: 'Hydration Starter Kit', items: ['Electrolyte Drink Mix', 'Stainless Bottle'], bundlePrice: 350, originalPrice: 400, active: true }
      ],
      giftCards: [
        { id: 'GC-9821', code: 'GC-ZA-8821', initialBalance: 500, remainingBalance: 350, recipientEmail: 'friend@example.co.za', status: 'active' },
        { id: 'GC-1102', code: 'GC-ZA-4402', initialBalance: 1000, remainingBalance: 0, recipientEmail: 'boss@example.co.za', status: 'depleted' }
      ],
      abandonedCarts: [
        { id: 'CART-101', customerEmail: 'abandoned@example.co.za', itemsCount: 3, cartTotal: 650.00, lastActive: new Date().toISOString(), recovered: false }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch marketing data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, code, discountType, value } = body;
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${type || 'promotion'}`,
      item: { id: `MKT-${Date.now()}`, code, discountType, value, active: true }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create marketing item' }, { status: 500 });
  }
}
