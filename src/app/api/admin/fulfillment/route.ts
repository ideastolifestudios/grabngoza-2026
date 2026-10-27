import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      shipments: [
        {
          id: 'SHP-1001',
          orderId: 'ORD-2026-001',
          customerName: 'Sipho Zulu',
          email: 'sipho@example.co.za',
          shippingAddress: '123 Rivonia Road, Johannesburg, Gauteng 2196',
          courier: 'The Courier Guy',
          trackingNumber: 'TCG-88219402',
          status: 'ready_to_pack', // ready_to_pack | packed | shipped | delivered
          itemsCount: 3,
          createdAt: new Date().toISOString()
        },
        {
          id: 'SHP-1002',
          orderId: 'ORD-2026-002',
          customerName: 'Lerato Mokoena',
          email: 'lerato@example.co.za',
          shippingAddress: '45 Beach Road, Cape Town, Western Cape 8001',
          courier: 'Bob Go / Dawn Wing',
          trackingNumber: 'BG-9910482',
          status: 'shipped',
          itemsCount: 1,
          createdAt: '2026-02-12T09:15:00Z'
        }
      ],
      returns: [
        {
          id: 'RET-01',
          orderId: 'ORD-2026-000',
          customerName: 'Thabo Molefe',
          email: 'thabo@example.co.za',
          reason: 'Damaged during transit',
          status: 'pending_approval', // pending_approval | approved | refunded | rejected
          refundAmount: 350.00,
          requestedAt: '2026-02-14T11:00:00Z'
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fulfillment data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, shipmentId, returnId, courier, trackingNumber } = body;

    if (action === 'update_fulfillment') {
      return NextResponse.json({
        success: true,
        message: `Shipment ${shipmentId} updated to ${courier} (${trackingNumber}). Customer notified!`,
      });
    }

    if (action === 'process_return') {
      return NextResponse.json({
        success: true,
        message: `Return ${returnId} processed successfully.`,
      });
    }

    return NextResponse.json({ success: true, message: 'Action recorded.' });
  } catch (error) {
    return NextResponse.json({ error: 'Fulfillment action failed' }, { status: 500 });
  }
}
