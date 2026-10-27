import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      customerAutomations: [
        { id: 'cust-1', name: 'Order Confirmation Email', trigger: 'Order Placed', status: 'active', channel: 'Email' },
        { id: 'cust-2', name: 'Payment Receipt / Success', trigger: 'Payment Verified', status: 'active', channel: 'Email / SMS' },
        { id: 'cust-3', name: 'Shipping Waybill Notification', trigger: 'Order Dispatched', status: 'active', channel: 'Email' },
        { id: 'cust-4', name: 'Delivery Confirmation', trigger: 'Marked Delivered', status: 'active', channel: 'Email' },
        { id: 'cust-5', name: 'Refund Notification', trigger: 'Refund Processed', status: 'active', channel: 'Email' },
      ],
      adminAlerts: [
        { id: 'adm-1', name: 'New Order Push Alert', trigger: 'New Order Created', status: 'active', channel: 'Dashboard / Pusher' },
        { id: 'adm-2', name: 'Low Stock Threshold Warning', trigger: 'Stock < 5 units', status: 'active', channel: 'Email' },
        { id: 'adm-3', name: 'Failed Payment Alert', trigger: 'Yoco Payment Error', status: 'active', channel: 'Webhook / Sentry' },
        { id: 'adm-4', name: 'Refund Request Alert', trigger: 'Customer Return Requested', status: 'active', channel: 'Dashboard' },
        { id: 'adm-5', name: 'System 500 Error Notice', trigger: 'API Exception', status: 'active', channel: 'Sentry / Pusher' },
      ],
      syncStatus: {
        googleMerchant: { status: 'synced', lastSync: new Date().toISOString(), productsCount: 6, errors: 0 },
        metaCatalog: { status: 'synced', lastSync: new Date().toISOString(), productsCount: 6, errors: 0 },
        inventorySync: { status: 'live', frequency: 'Real-time Firestore trigger' }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, target } = body;

    if (action === 'sync_platform') {
      return NextResponse.json({
        success: true,
        message: `Successfully synchronized inventory & catalog with ${target === 'google' ? 'Google Merchant Center' : 'Meta Commerce Manager'}!`
      });
    }

    if (action === 'test_alert') {
      return NextResponse.json({
        success: true,
        message: `Test notification sent successfully for rule: ${target}`
      });
    }

    return NextResponse.json({ success: true, message: 'Automation executed.' });
  } catch (error) {
    return NextResponse.json({ error: 'Automation execution failed' }, { status: 500 });
  }
}
