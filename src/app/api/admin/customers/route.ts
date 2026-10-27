import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      customers: [
        {
          id: 'USR-001',
          name: 'Sipho Zulu',
          email: 'sipho@example.co.za',
          phone: '+27 82 123 4567',
          role: 'customer',
          ordersCount: 3,
          totalSpent: 2450.00,
          lastOrderDate: new Date().toISOString(),
          status: 'active',
          joinedAt: '2026-01-15T10:00:00Z'
        },
        {
          id: 'USR-002',
          name: 'Lerato Mokoena',
          email: 'lerato@example.co.za',
          phone: '+27 73 987 6543',
          role: 'customer',
          ordersCount: 1,
          totalSpent: 850.00,
          lastOrderDate: '2026-02-10T14:30:00Z',
          status: 'active',
          joinedAt: '2026-02-10T12:00:00Z'
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
