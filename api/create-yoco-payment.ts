/**
 * api/create-yoco-payment.ts  (replaces the inline handler in server.ts)
 *
 * Server-side price verification:
 *   1. Receives cart items from the client
 *   2. Fetches authoritative prices from Firestore (never trusts client totals)
 *   3. Recomputes total server-side
 *   4. Only then creates the Yoco checkout session
 *
 * This prevents price-manipulation attacks where a client sends amount=1.
 */

import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { log } from '../src/services/logger';

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  // Client-provided price is IGNORED — we fetch from Firestore
  clientPrice?: number;
}

interface VerifiedItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number; // cents, from Firestore
  lineTotal: number; // cents
  name: string;
}

const TOLERANCE_CENTS = 5; // Allow 5c rounding tolerance between client and server totals

/**
 * Fetches authoritative prices from Firestore and returns verified line items.
 * Throws if any product is not found or is out of stock.
 */
async function verifyCartPrices(items: CartItem[]): Promise<{
  verifiedItems: VerifiedItem[];
  serverTotalCents: number;
}> {
  const db = getFirestore();
  const verifiedItems: VerifiedItem[] = [];

  // Batch-fetch all products in parallel
  const productDocs = await Promise.all(
    items.map(item => db.collection('products').doc(item.productId).get())
  );

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const doc = productDocs[i];

    if (!doc.exists) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const product = doc.data()!;

    // Support variant pricing (e.g. size-based)
    let unitPriceCents: number;
    let productName: string = product.name;

    if (item.variantId && product.variants) {
      const variant = product.variants[item.variantId];
      if (!variant) throw new Error(`Variant not found: ${item.variantId} for product ${item.productId}`);
      unitPriceCents = Math.round(variant.price * 100);
      productName = `${product.name} (${variant.label})`;
    } else {
      if (typeof product.price !== 'number') {
        throw new Error(`Invalid price for product: ${item.productId}`);
      }
      unitPriceCents = Math.round(product.price * 100);
    }

    if (unitPriceCents <= 0) {
      throw new Error(`Invalid price (${unitPriceCents} cents) for product: ${item.productId}`);
    }

    const qty = Math.floor(item.quantity);
    if (qty < 1) throw new Error(`Invalid quantity for product: ${item.productId}`);

    verifiedItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: qty,
      unitPrice: unitPriceCents,
      lineTotal: unitPriceCents * qty,
      name: productName,
    });
  }

  const serverTotalCents = verifiedItems.reduce((sum, i) => sum + i.lineTotal, 0);
  return { verifiedItems, serverTotalCents };
}

export async function createYocoPaymentHandler(req: Request, res: Response): Promise<void> {
  const { items, currency = 'ZAR', metadata = {}, clientTotalCents, orderId } = req.body;

  // --- Input validation ---
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ success: false, error: 'items must be a non-empty array' });
    return;
  }
  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ success: false, error: 'orderId is required' });
    return;
  }

  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    log('error', 'yoco.missing_secret_key');
    res.status(500).json({ success: false, error: 'Payment gateway not configured' });
    return;
  }

  let verifiedItems: VerifiedItem[];
  let serverTotalCents: number;

  try {
    ({ verifiedItems, serverTotalCents } = await verifyCartPrices(items));
  } catch (err: any) {
    log('warn', 'payment.price_verification_failed', { orderId, error: err.message });
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  // --- Price tamper detection ---
  if (typeof clientTotalCents === 'number') {
    const delta = Math.abs(clientTotalCents - serverTotalCents);
    if (delta > TOLERANCE_CENTS) {
      log('warn', 'payment.price_mismatch', {
        orderId,
        clientTotalCents,
        serverTotalCents,
        delta,
      });
      res.status(400).json({
        success: false,
        error: 'Cart total mismatch. Please refresh your cart and try again.',
      });
      return;
    }
  }

  // --- Build redirect URLs ---
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${proto}://${host}`;

  try {
    const response = await fetch('https://online.yoco.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: serverTotalCents,  // ← authoritative server total, never the client value
        currency,
        cancelUrl: `${baseUrl}/?status=cancelled`,
        successUrl: `${baseUrl}/order-success?id=${orderId}`,
        failureUrl: `${baseUrl}/?status=failed`,
        metadata: {
          ...metadata,
          orderId,
          serverVerified: true,
          itemCount: verifiedItems.length,
        },
      }),
    });

    const data: any = await response.json();

    if (!response.ok) {
      log('error', 'yoco.checkout_failed', { orderId, status: response.status, data });
      res.status(response.status).json({ success: false, error: 'Payment gateway error', details: data });
      return;
    }

    log('info', 'payment.checkout_created', {
      orderId,
      serverTotalCents,
      items: verifiedItems.length,
    });

    res.json({
      success: true,
      data: {
        redirectUrl: data.redirectUrl,
        verifiedTotalCents: serverTotalCents,
        verifiedItems,
      },
    });
  } catch (err: any) {
    log('error', 'yoco.network_error', { orderId, error: err.message });
    res.status(500).json({ success: false, error: 'Failed to connect to payment gateway' });
  }
}
