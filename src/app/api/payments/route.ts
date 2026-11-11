import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

function initAdminDb() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  // 1. Check individual FIREBASE_ADMIN_* variables first
  const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (adminProjectId && adminClientEmail && adminPrivateKey) {
    const formattedKey = adminPrivateKey.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: adminProjectId,
        clientEmail: adminClientEmail,
        privateKey: formattedKey,
      }),
    });
    return getFirestore();
  }

  // 2. Fall back to FIREBASE_SERVICE_ACCOUNT_KEY JSON string
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey) {
    try {
      const cleanedKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
      const serviceAccount = JSON.parse(cleanedKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert(serviceAccount) });
      return getFirestore();
    } catch (e: any) {
      console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
    }
  }

  // 3. Fallback to Project ID
  initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'grab-go-za',
  });
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const db = initAdminDb();
    const body = await req.json();
    const { items, customer, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      console.error('CRITICAL: YOCO_SECRET_KEY is missing on server.');
      return NextResponse.json({ error: 'Payment gateway configuration error' }, { status: 500 });
    }

    let subtotalCents = 0;
    const validatedItems = [];

    // Authoritative Server-Side Pricing Calculation
    for (const item of items) {
      const productRef = db.collection('products').doc(item.id);
      const productSnap = await productRef.get();

      if (!productSnap.exists) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 });
      }

      const productData = productSnap.data() || {};
      let itemPriceRands = Number(productData.price ?? productData.originalPrice ?? 0);

      if (item.variantId && Array.isArray(productData.variants)) {
        const matchedVariant = productData.variants.find((v: any) => v.id === item.variantId || v.sku === item.variantId);
        if (matchedVariant && matchedVariant.price) {
          itemPriceRands = Number(matchedVariant.price);
        }
      }

      const unitPriceCents = Math.round(itemPriceRands * 100);
      const quantity = Math.max(1, Number(item.quantity || 1));
      const lineTotalCents = unitPriceCents * quantity;

      subtotalCents += lineTotalCents;

      validatedItems.push({
        productId: item.id,
        variantId: item.variantId || null,
        title: productData.name || productData.title || 'Product',
        variantTitle: item.variantTitle || null,
        unitPriceCents,
        quantity,
        lineTotalCents,
      });
    }

    const shippingCents = subtotalCents >= 100000 ? 0 : 6000;
    const totalCents = subtotalCents + shippingCents;

    // Create Pending Order Document
    const orderRef = await db.collection('orders').add({
      items: validatedItems,
      subtotalCents,
      shippingCents,
      totalCents,
      currency: 'ZAR',
      status: 'pending',
      customer: customer || {},
      shippingAddress: shippingAddress || {},
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create Yoco Hosted Checkout Session
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: totalCents,
        currency: 'ZAR',
        successUrl: `https://shopgrabngo.co.za/checkout/success?orderId=${orderRef.id}`,
        cancelUrl: `https://shopgrabngo.co.za/checkout/cancel?orderId=${orderRef.id}`,
        failureUrl: `https://shopgrabngo.co.za/checkout/failure?orderId=${orderRef.id}`,
        metadata: {
          orderId: orderRef.id,
          customerEmail: customer?.email || '',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Yoco API Session Creation Error:', errorText);
      return NextResponse.json({ error: 'Failed to initiate Yoco payment session' }, { status: 502 });
    }

    const yocoData = await response.json();

    return NextResponse.json({
      success: true,
      redirectUrl: yocoData.redirectUrl,
      checkoutId: yocoData.id,
      orderId: orderRef.id,
    });

  } catch (error: any) {
    console.error('Payment initialization failure:', error.message || error);
    return NextResponse.json({ error: error.message || 'Internal server error during payment initialization' }, { status: 500 });
  }
}
