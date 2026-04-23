#!/usr/bin/env bash
# ============================================================
#  Grab & Go ZA — Rectifications + Return Flow deployer
#  Usage: GITHUB_TOKEN=ghp_xxxx ./deploy-rectifications.sh
#
#  Pushes NEW files only (won't overwrite existing src):
#    src/pages/ReturnRequestPage.tsx
#    src/services/returnService.ts
#    src/components/ui/FreeDeliveryBar.tsx   ← full rewrite
#    firestore-returns.rules                 ← paste guide
#    RECTIFICATIONS.md                       ← patch guide for 1-7
# ============================================================

set -euo pipefail

REPO="ideastolifestudios/grabngoza-2026"
BRANCH="main"
TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN=ghp_... before running}"
API="https://api.github.com/repos/${REPO}/contents"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

b64() { base64 < "$1" | tr -d '\n'; }

get_sha() {
  curl -s -H "Authorization: Bearer ${TOKEN}" \
       -H "Accept: application/vnd.github+json" \
       "${API}/$1?ref=${BRANCH}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sha',''))" 2>/dev/null || echo ""
}

push_file() {
  local gh_path="$1"
  local local_file="$2"
  local message="$3"

  local sha
  sha=$(get_sha "${gh_path}")

  local payload
  if [ -n "$sha" ]; then
    payload=$(jq -n \
      --arg msg "$message" --arg content "$(b64 "$local_file")" \
      --arg sha "$sha" --arg branch "$BRANCH" \
      '{message:$msg,content:$content,sha:$sha,branch:$branch}')
  else
    payload=$(jq -n \
      --arg msg "$message" --arg content "$(b64 "$local_file")" \
      --arg branch "$BRANCH" \
      '{message:$msg,content:$content,branch:$branch}')
  fi

  local status
  status=$(curl -s -o /tmp/rect_response.json -w "%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "${API}/${gh_path}" \
    -d "$payload")

  if [[ "$status" == "200" || "$status" == "201" ]]; then
    echo "  ✅  ${gh_path} (HTTP ${status})"
  else
    echo "  ❌  ${gh_path} (HTTP ${status})"
    cat /tmp/rect_response.json
    exit 1
  fi
}

echo ""
echo "🚀  Pushing rectifications to ${REPO}@${BRANCH}"
echo ""

push_file "src/pages/ReturnRequestPage.tsx" \
  "${SCRIPT_DIR}/src/pages/ReturnRequestPage.tsx" \
  "feat: add ReturnRequestPage — item selector, reason, refund preview, Firestore write"

push_file "src/services/returnService.ts" \
  "${SCRIPT_DIR}/src/services/returnService.ts" \
  "feat: returnService — customer + admin queries, approve/reject/refund actions"

push_file "src/components/ui/FreeDeliveryBar.tsx" \
  "${SCRIPT_DIR}/src/components/ui/FreeDeliveryBar.tsx" \
  "fix(rect3): FreeDeliveryBar now uses cartTotal in Rands (not item count)"

push_file "firestore-returns.rules" \
  "${SCRIPT_DIR}/firestore-returns.rules" \
  "docs: Firestore rules snippet for returns collection"

push_file "RECTIFICATIONS.md" \
  "${SCRIPT_DIR}/RECTIFICATIONS.md" \
  "docs: surgical patch guide for rectifications 1-7"

echo ""
echo "🎉  Done! Three manual patches still needed (see RECTIFICATIONS.md):"
echo "    Rect 1 — remove double Logo in auth drawer"
echo "    Rect 4 — spread #06402B to header/footer/cards/CTAs"
echo "    Rect 5 — add useEffect autoplay to Hero"
echo "    Rect 6 — standardise label colours"
echo ""
echo "    Rect 2 (cart icon), Rect 3 (FreeDeliveryBar) — files pushed ✅"
echo "    Return flow (page + service + rules) — files pushed ✅"
echo ""
echo "    Add the route in App.tsx:"
echo '    <Route path="/orders/:orderId/return" element={<ReturnRequestPage />} />'
echo ""
echo "    Add return button in order detail (when isOrderReturnable(order)):"
echo '    import { isOrderReturnable } from "../services/returnService";'
echo '    {isOrderReturnable(order) && ('
echo '      <Link to={`/orders/${order.id}/return`}>Request a return</Link>'
echo '    )}'
