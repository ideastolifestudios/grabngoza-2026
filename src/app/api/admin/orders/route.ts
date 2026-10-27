import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      orders: [
        {
          id: 'ORD-2026-001',
          customerName: 'Sipho Zulu',
          email: 'sipho@example.co.za',
          phone: '+27 82 123 4567',
          total: 850.00,
          status: 'paid',
          paymentStatus: 'verified',
          fulfillmentStatus: 'processing',
          createdAt: new Date().toISOString(),
          items: [
            { name: 'Grab & Go Energy Bar Box', quantity: 2, price: 300 },
            { name: 'Biltong Snack Pack', quantity: 1, price: 250 }
          ],
          shippingAddress: {
            street: '123 Rivonia Road',
            city: 'Johannesburg',
            province: 'Gauteng',
            postalCode: '2196'
          },
          trackingNumber: 'TRK-987654321',
          courier: 'The Courier Guy',
          notes: 'Customer requested fast delivery.',
          history: [
            { timestamp: new Date().toISOString(), action: 'Order placed by customer', user: 'Customer' },
            { timestamp: new Date().toISOString(), action: 'Payment verified via Yoco', user: 'System' }
          ]
        }
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, paymentStatus, trackingNumber, courier, notes } = body;
    
    return NextResponse.json({
      success: true,
      message: `Order ${orderId} updated successfully`,
      updatedOrder: { orderId, status, paymentStatus, trackingNumber, courier, notes }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
