#!/bin/bash
# ──────────────────────────────────────────────────────────────
# scripts/monitor.sh — Grab & Go backend health check + logs
#
# Usage:
#   chmod +x scripts/monitor.sh
#   ./scripts/monitor.sh              # full health check
#   ./scripts/monitor.sh orders       # just orders
#   ./scripts/monitor.sh webhook-test # simulate webhook
#   ./scripts/monitor.sh logs         # tail Vercel logs
# ──────────────────────────────────────────────────────────────

BASE="https://shopgrabngo.co.za"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

header() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}  $1${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_endpoint() {
  local name=$1
  local url=$2
  local method=${3:-GET}

  echo -n "  [$name] "
  local start=$(date +%s%N)
  local response
  response=$(curl -sL -w "\n%{http_code}" -X "$method" "$url" 2>/dev/null)
  local status=$(echo "$response" | tail -1)
  local body=$(echo "$response" | head -n -1)
  local end=$(date +%s%N)
  local ms=$(( (end - start) / 1000000 ))

  if [ "$status" -ge 200 ] && [ "$status" -lt 300 ]; then
    echo -e "${GREEN}✓ $status${NC} (${ms}ms)"
  elif [ "$status" -ge 300 ] && [ "$status" -lt 400 ]; then
    echo -e "${YELLOW}↗ $status redirect${NC} (${ms}ms)"
  else
    echo -e "${RED}✗ $status${NC} (${ms}ms)"
  fi

  # Pretty-print JSON if jq available
  if command -v jq &>/dev/null; then
    echo "$body" | jq -C '.' 2>/dev/null | head -20
  else
    echo "$body" | head -5
  fi
  echo ""
}

# ── ORDERS ───────────────────────────────────────────────────
cmd_orders() {
  header "📦 Orders API"
  check_endpoint "List all orders" "$BASE/api/orders"
  check_endpoint "Filter processing" "$BASE/api/orders?status=processing"
  check_endpoint "Stats only" "$BASE/api/store-api?resource=orders&action=stats"
}

# ── HEALTH CHECK ─────────────────────────────────────────────
cmd_health() {
  header "🏥 Health Check — $(timestamp)"

  echo ""
  echo "  Testing core endpoints..."
  echo ""

  check_endpoint "Orders API" "$BASE/api/orders"
  check_endpoint "Store API" "$BASE/api/store-api?resource=orders&action=list"
  check_endpoint "Webhook (GET=405)" "$BASE/api/webhooks?source=yoco"
}

# ── WEBHOOK TEST ─────────────────────────────────────────────
cmd_webhook_test() {
  header "🔗 Webhook Dry Run"
  echo ""
  echo -e "${YELLOW}  ⚠ This sends a POST to your webhook without HMAC — will be rejected (401).${NC}"
  echo -e "  Use this to confirm the endpoint is alive and rejecting unsigned requests."
  echo ""

  check_endpoint "Webhook reject test" "$BASE/api/webhooks?source=yoco" "POST"
}

# ── VERCEL LOGS ──────────────────────────────────────────────
cmd_logs() {
  header "📋 Vercel Logs"

  if ! command -v vercel &>/dev/null; then
    echo -e "  ${RED}Vercel CLI not installed.${NC}"
    echo ""
    echo "  Install:  npm i -g vercel"
    echo "  Login:    vercel login"
    echo "  Logs:     vercel logs shopgrabngo.co.za --follow"
    echo ""
    echo "  Or view in browser:"
    echo -e "  ${CYAN}https://vercel.com/dashboard → grabngoza-2026 → Logs${NC}"
    return
  fi

  echo "  Tailing live logs (Ctrl+C to stop)..."
  echo ""
  vercel logs shopgrabngo.co.za --follow
}

# ── CREATE TEST ORDER ────────────────────────────────────────
cmd_test_order() {
  header "🧪 Create Test Order"

  echo "  Sending test order to store-api..."
  echo ""

  curl -sL -X POST "$BASE/api/store-api?resource=orders&action=create" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@grabandgo.co.za",
      "firstName": "Test",
      "lastName": "Customer",
      "phone": "+27821234567",
      "items": [
        {"productId": "test-1", "name": "Test Hoodie", "price": 499.99, "quantity": 1}
      ],
      "total": 499.99
    }' | {
      if command -v jq &>/dev/null; then
        jq -C '.'
      else
        cat
      fi
    }

  echo ""
  echo "  Now check orders:"
  echo "  curl -L $BASE/api/orders"
}

# ── ROUTER ───────────────────────────────────────────────────
case "${1:-health}" in
  orders)       cmd_orders ;;
  health)       cmd_health ;;
  webhook-test) cmd_webhook_test ;;
  logs)         cmd_logs ;;
  test-order)   cmd_test_order ;;
  *)
    echo "Usage: $0 {health|orders|webhook-test|logs|test-order}"
    exit 1
    ;;
esac

echo -e "${CYAN}Done — $(timestamp)${NC}"