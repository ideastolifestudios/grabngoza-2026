#!/usr/bin/env bash
# =============================================================================
# curl-tests.sh — Live API smoke tests for GrabNGoza
#
# Runs curl commands against the live Vercel deployment to confirm:
#   - Rate limiting is active
#   - Webhook rejects unsigned requests
#   - Payment endpoint validates inputs
#   - Health check is up
#
# Usage:
#   chmod +x curl-tests.sh
#   ./curl-tests.sh
#   ./curl-tests.sh https://your-preview-url.vercel.app
# =============================================================================

set -euo pipefail

BASE="${1:-https://grabngoza-2026.vercel.app}"
WEBHOOK_SECRET="${YOCO_WEBHOOK_SECRET:-}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS=0; FAIL=0

pass() { echo -e "${GREEN}✓ PASS${NC}  $*"; ((PASS++)); }
fail() { echo -e "${RED}✗ FAIL${NC}  $*"; ((FAIL++)); }
skip() { echo -e "${YELLOW}⊘ SKIP${NC}  $*"; }
section() { echo -e "\n${CYAN}── $* ──${NC}"; }

expect_status() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    pass "$desc (HTTP $actual)"
  else
    fail "$desc — expected HTTP $expected, got $actual"
  fi
}

echo ""
echo "GrabNGoza Live API Smoke Tests"
echo "Target: $BASE"
echo "Date:   $(date)"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
section "Health check"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
expect_status "GET /api/health returns 200" "200" "$STATUS"

BODY=$(curl -s "$BASE/api/health")
if echo "$BODY" | grep -q '"status"'; then
  pass "Health response contains status field"
else
  fail "Health response missing status field: $BODY"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "404 on unknown API routes"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/nonexistent-route")
expect_status "Unknown /api/* returns 404" "404" "$STATUS"

# ─────────────────────────────────────────────────────────────────────────────
section "Webhook — signature verification"

echo "  Testing unsigned request (expect 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/yoco-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.succeeded","payload":{"id":"pay_fake"}}')
expect_status "Webhook without signature returns 401" "401" "$STATUS"

echo "  Testing wrong signature (expect 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/yoco-webhook" \
  -H "Content-Type: application/json" \
  -H "X-Yoco-Signature: sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" \
  -d '{"type":"payment.succeeded","payload":{"id":"pay_fake"}}')
expect_status "Webhook with wrong signature returns 401" "401" "$STATUS"

if [[ -n "$WEBHOOK_SECRET" ]]; then
  echo "  Testing valid HMAC signature..."
  BODY='{"type":"payment.succeeded","payload":{"id":"pay_smoke_test","amount":10000,"currency":"ZAR","metadata":{"orderId":"order_smoke"}}}'
  SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE/api/yoco-webhook" \
    -H "Content-Type: application/json" \
    -H "X-Yoco-Signature: $SIG" \
    -d "$BODY")
  expect_status "Webhook with valid signature returns 200" "200" "$STATUS"
else
  skip "Valid webhook test — set YOCO_WEBHOOK_SECRET env var to enable"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "Payment endpoint — input validation"

echo "  Testing empty body (expect 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/create-yoco-payment" \
  -H "Content-Type: application/json" \
  -d '{}')
expect_status "Payment with no items returns 400" "400" "$STATUS"

echo "  Testing empty items array (expect 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/create-yoco-payment" \
  -H "Content-Type: application/json" \
  -d '{"items":[],"orderId":"test_123"}')
expect_status "Payment with empty items returns 400" "400" "$STATUS"

echo "  Testing missing orderId (expect 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/api/create-yoco-payment" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"p1","quantity":1}]}')
expect_status "Payment without orderId returns 400" "400" "$STATUS"

# ─────────────────────────────────────────────────────────────────────────────
section "Rate limiting"

echo "  Hammering /api/create-yoco-payment 15x (limit is 10/min)..."
RATE_LIMITED=false
for i in $(seq 1 15); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE/api/create-yoco-payment" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"productId":"test","quantity":1}],"orderId":"rate_test"}')
  if [[ "$CODE" == "429" ]]; then
    RATE_LIMITED=true
    break
  fi
done

if $RATE_LIMITED; then
  pass "Rate limiter triggered 429 on payment endpoint"
else
  fail "Rate limiter did NOT trigger after 15 requests — check rateLimit.ts is mounted"
fi

# ─────────────────────────────────────────────────────────────────────────────
section "Response shape"

echo "  Checking error response shape..."
BODY=$(curl -s -X POST "$BASE/api/create-yoco-payment" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$BODY" | grep -q '"success":false'; then
  pass "Error response contains success:false"
else
  fail "Error response missing success:false — got: $BODY"
fi

if echo "$BODY" | grep -q '"error"'; then
  pass "Error response contains error field"
else
  fail "Error response missing error field"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  Results: ${GREEN}${PASS} passed${NC}  ${RED}${FAIL} failed${NC}"
echo "══════════════════════════════════════════"
echo ""

[[ $FAIL -eq 0 ]] && echo -e "${GREEN}All smoke tests passed ✓${NC}" || echo -e "${RED}${FAIL} test(s) failed — investigate before going live${NC}"
exit $FAIL
