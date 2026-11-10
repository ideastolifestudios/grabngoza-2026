import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty or invalid' }, { status: 400 });
    }

    let calculatedTotalCents = 0;
    const verifiedLineItems = [];

    for (const item of items) {
      if (!item.id || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json({ error: 'Invalid item structure in cart' }, { status: 400 });
      }

      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 });
      }

      const productData = productSnap.data();
      let unitPriceZAR = Number(productData.price || 0);
      let stockAvailable = Number(productData.stock ?? productData.quantity ?? 0);
      let variantTitle = null;

      // Handle variant pricing/stock if variantId is provided
      if (item.variantId && productData.variants && Array.isArray(productData.variants)) {
        const variant = productData.variants.find((v: any) => v.id === item.variantId || v.sku === item.variantId);
        if (variant) {
          if (variant.price !== undefined) unitPriceZAR = Number(variant.price);
          if (variant.stock !== undefined) stockAvailable = Number(variant.stock);
          variantTitle = variant.name || variant.title || item.variantId;
        }
      }

      if (stockAvailable < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${productData.name || item.id} ${variantTitle ? `(${variantTitle})` : ''}` }, { status: 400 });
      }

      const unitPriceCents = Math.round(unitPriceZAR * 100);
      const lineTotalCents = unitPriceCents * item.quantity;
      calculatedTotalCents += lineTotalCents;

      verifiedLineItems.push({
        productId: item.id,
        variantId: item.variantId || null,
        title: productData.name || productData.title || 'Product',
        variantTitle,
        unitPriceCents,
        quantity: item.quantity,
        lineTotalCents,
      });
    }

    const shippingCents = calculatedTotalCents > 100000 ? 0 : 6000; // Free over R1000, else R60
    const finalTotalCents = calculatedTotalCents + shippingCents;

    const orderRef = await addDoc(collection(db, 'orders'), {
      items: verifiedLineItems,
      subtotalCents: calculatedTotalCents,
      shippingCents,
      totalCents: finalTotalCents,
      currency: 'ZAR',
      status: 'pending',
      customer: customer || {},
      shippingAddress: shippingAddress || {},
      createdAt: serverTimestamp(),
    });

    const orderId = orderRef.id;
    const yocoSecretKey = process.env.YOCO_SECRET_KEY;
    if (!yocoSecretKey) {
      throw new Error('YOCO_SECRET_KEY is not configured on the server.');
    }

    const successUrl = `${req.nextUrl.origin}/order-success?orderId=${orderId}`;
    const cancelUrl = `${req.nextUrl.origin}/cart`;

    const yocoResponse = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${yocoSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: finalTotalCents,
        currency: 'ZAR',
        successUrl,
        cancelUrl,
        metadata: { orderId },
        lineItems: verifiedLineItems.map((item) => ({
          displayName: `${item.title}${item.variantTitle ? ` - ${item.variantTitle}` : ''}`,
          quantity: item.quantity,
          pricingDetails: { price: item.unitPriceCents },
        })),
      }),
    });

    if (!yocoResponse.ok) {
      const errorBody = await yocoResponse.text();
      console.error('Yoco Checkout API Error:', errorBody);
      return NextResponse.json({ error: 'Failed to initialize payment gateway session' }, { status: 502 });
    }

    const yocoData = await yocoResponse.json();

    return NextResponse.json({
      redirectUrl: yocoData.redirectUrl,
      checkoutId: yocoData.id,
      orderId,
    });

  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Internal server error during payment initialization' }, { status: 500 });
  }
}
