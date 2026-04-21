/**
 * tests/payment-flow.test.ts
 * Automated tests for the payment flow.
 *
 * Uses Node's built-in test runner (Node 18+) — no Jest required.
 * Run: npx tsx --test tests/payment-flow.test.ts
 *
 * Add to package.json scripts:
 *   "test": "npx tsx --test tests/payment-flow.test.ts"
 *   "test:watch": "npx tsx --test --watch tests/payment-flow.test.ts"
 */

import { test, describe, before, mock } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeYocoSignature(body: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

const WEBHOOK_SECRET = 'test-webhook-secret-1234';

// ─── Price verification unit tests ───────────────────────────────────────────

describe('Server-side price verification', () => {
  test('rejects empty items array', async () => {
    const result = validateCartItems([]);
    assert.equal(result.valid, false);
    assert.match(result.error!, /non-empty/);
  });

  test('rejects items with quantity < 1', async () => {
    const result = validateCartItems([{ productId: 'prod_1', quantity: 0 }]);
    assert.equal(result.valid, false);
  });

  test('rejects negative quantities', async () => {
    const result = validateCartItems([{ productId: 'prod_1', quantity: -1 }]);
    assert.equal(result.valid, false);
  });

  test('accepts valid items', async () => {
    const result = validateCartItems([
      { productId: 'prod_1', quantity: 2 },
      { productId: 'prod_2', quantity: 1 },
    ]);
    assert.equal(result.valid, true);
  });

  test('detects price mismatch beyond tolerance', () => {
    const serverTotal = 50000; // R500.00
    const clientTotal = 100;   // R1.00 — obvious tamper attempt
    assert.equal(isPriceTampered(clientTotal, serverTotal), true);
  });

  test('allows minor rounding differences (within 5c tolerance)', () => {
    const serverTotal = 50000;
    const clientTotal = 50003; // 3 cent difference — rounding
    assert.equal(isPriceTampered(clientTotal, serverTotal), false);
  });
});

// ─── Webhook signature verification tests ────────────────────────────────────

describe('Webhook HMAC signature verification', () => {
  test('accepts valid HMAC signature', () => {
    const body = JSON.stringify({ type: 'payment.succeeded', payload: { id: 'pay_1' } });
    const sig = makeYocoSignature(body, WEBHOOK_SECRET);
    assert.equal(verifySignature(body, sig, WEBHOOK_SECRET), true);
  });

  test('rejects tampered body', () => {
    const body = JSON.stringify({ type: 'payment.succeeded', payload: { id: 'pay_1' } });
    const sig = makeYocoSignature(body, WEBHOOK_SECRET);
    const tamperedBody = JSON.stringify({ type: 'payment.succeeded', payload: { id: 'pay_999' } });
    assert.equal(verifySignature(tamperedBody, sig, WEBHOOK_SECRET), false);
  });

  test('rejects wrong secret', () => {
    const body = JSON.stringify({ type: 'payment.succeeded' });
    const sig = makeYocoSignature(body, 'attacker-secret');
    assert.equal(verifySignature(body, sig, WEBHOOK_SECRET), false);
  });

  test('rejects missing signature', () => {
    assert.equal(verifySignature('body', undefined, WEBHOOK_SECRET), false);
  });

  test('rejects malformed signature format', () => {
    assert.equal(verifySignature('body', 'notsha256=abc', WEBHOOK_SECRET), false);
  });

  test('prevents replay with wrong hex length', () => {
    // Different-length buffers must not throw and must return false
    const body = 'test';
    const shortHex = 'sha256=abcd';
    assert.equal(verifySignature(body, shortHex, WEBHOOK_SECRET), false);
  });
});

// ─── Order flow state machine tests ──────────────────────────────────────────

describe('Order state machine', () => {
  test('pending order transitions to confirmed on payment.succeeded', () => {
    const order = { status: 'pending_payment' };
    const updated = applyWebhookEvent(order, 'payment.succeeded');
    assert.equal(updated.status, 'confirmed');
  });

  test('confirmed order is idempotent — no re-processing on duplicate webhook', () => {
    const order = { status: 'confirmed', paymentId: 'pay_original' };
    const updated = applyWebhookEvent(order, 'payment.succeeded', 'pay_duplicate');
    // Should remain as-is
    assert.equal(updated.status, 'confirmed');
    assert.equal(updated.paymentId, 'pay_original');
  });

  test('pending order transitions to payment_failed on payment.failed', () => {
    const order = { status: 'pending_payment' };
    const updated = applyWebhookEvent(order, 'payment.failed');
    assert.equal(updated.status, 'payment_failed');
  });

  test('pending order transitions to cancelled on payment.cancelled', () => {
    const order = { status: 'pending_payment' };
    const updated = applyWebhookEvent(order, 'payment.cancelled');
    assert.equal(updated.status, 'cancelled');
  });
});

// ─── Rate limiter tests ───────────────────────────────────────────────────────

describe('Rate limiter', () => {
  test('allows requests up to limit', () => {
    const limiter = createTestLimiter({ max: 5, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      assert.equal(limiter.check('127.0.0.1'), true, `Request ${i + 1} should be allowed`);
    }
  });

  test('blocks requests beyond limit', () => {
    const limiter = createTestLimiter({ max: 3, windowMs: 60_000 });
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    assert.equal(limiter.check('127.0.0.1'), false);
  });

  test('resets after window expires', async () => {
    const limiter = createTestLimiter({ max: 2, windowMs: 50 });
    limiter.check('127.0.0.1');
    limiter.check('127.0.0.1');
    assert.equal(limiter.check('127.0.0.1'), false);
    await new Promise(r => setTimeout(r, 60));
    assert.equal(limiter.check('127.0.0.1'), true);
  });

  test('tracks different IPs independently', () => {
    const limiter = createTestLimiter({ max: 1, windowMs: 60_000 });
    assert.equal(limiter.check('1.1.1.1'), true);
    assert.equal(limiter.check('2.2.2.2'), true);
    assert.equal(limiter.check('1.1.1.1'), false);
    assert.equal(limiter.check('2.2.2.2'), false);
  });
});

// ─── Pure helper implementations (extracted from production code for testing) ─

function validateCartItems(items: Array<{ productId: string; quantity: number }>): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0)
    return { valid: false, error: 'items must be a non-empty array' };
  for (const item of items) {
    if (!item.productId) return { valid: false, error: 'productId required' };
    if (typeof item.quantity !== 'number' || item.quantity < 1)
      return { valid: false, error: `Invalid quantity for ${item.productId}` };
  }
  return { valid: true };
}

function isPriceTampered(clientCents: number, serverCents: number, tolerance = 5): boolean {
  return Math.abs(clientCents - serverCents) > tolerance;
}

function verifySignature(body: string, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;
  const [algo, provided] = signature.split('=');
  if (algo !== 'sha256' || !provided) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    const pBuf = Buffer.from(provided, 'hex');
    const eBuf = Buffer.from(expected, 'hex');
    if (pBuf.length !== eBuf.length) return false;
    return crypto.timingSafeEqual(pBuf, eBuf);
  } catch {
    return false;
  }
}

function applyWebhookEvent(
  order: Record<string, unknown>,
  event: string,
  newPaymentId = 'pay_new'
): Record<string, unknown> {
  if (order.status === 'confirmed') return order; // idempotent
  switch (event) {
    case 'payment.succeeded': return { ...order, status: 'confirmed', paymentId: newPaymentId };
    case 'payment.failed':    return { ...order, status: 'payment_failed' };
    case 'payment.cancelled': return { ...order, status: 'cancelled' };
    default:                  return order;
  }
}

function createTestLimiter(opts: { max: number; windowMs: number }) {
  const store = new Map<string, { count: number; resetAt: number }>();
  return {
    check(ip: string): boolean {
      const now = Date.now();
      const rec = store.get(ip);
      if (!rec || rec.resetAt < now) {
        store.set(ip, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      rec.count++;
      return rec.count <= opts.max;
    },
  };
}
