#!/usr/bin/env bash
# Fix 2 — WhatsApp number formatting (server.ts, line ~65)
# Usage: GITHUB_TOKEN=ghp_xxxx ./deploy-fix2.sh

set -euo pipefail

REPO="ideastolifestudios/grabngoza-2026"
BRANCH="main"
TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN=ghp_... before running}"
API="https://api.github.com/repos/${REPO}/contents"

echo "⬇  Fetching current server.ts..."
RESPONSE=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
     -H "Accept: application/vnd.github+json" \
     "${API}/server.ts?ref=${BRANCH}")

SHA=$(echo "$RESPONSE" | grep '"sha"' | head -1 | sed 's/.*"sha": "\(.*\)".*/\1/')
CONTENT_B64=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['content'])" 2>/dev/null || \
              echo "$RESPONSE" | grep '"content"' | head -1 | sed 's/.*"content": "\(.*\)".*/\1/')

# Decode, patch, re-encode
CURRENT=$(echo "$CONTENT_B64" | base64 -d 2>/dev/null || echo "$CONTENT_B64" | base64 --decode)

PATCHED=$(echo "$CURRENT" | sed \
  's|const e164 = to\.replace(/\\D/g, "")\.replace(/\^0/, "27");|const digits = to.replace(/\\D/g, "");\n  const e164 = digits.startsWith("27") ? digits : digits.replace(/^0/, "27");|')

if [ "$CURRENT" = "$PATCHED" ]; then
  echo "⚠️  Pattern not found — already patched or line changed. Aborting."
  exit 1
fi

NEW_B64=$(echo "$PATCHED" | base64 | tr -d '\n')

PAYLOAD=$(jq -n \
  --arg msg "fix: safe WhatsApp e164 formatting — handle 0xx, 27xx and +27xx" \
  --arg content "$NEW_B64" \
  --arg sha "$SHA" \
  --arg branch "$BRANCH" \
  '{message:$msg, content:$content, sha:$sha, branch:$branch}')

STATUS=$(curl -s -o /tmp/fix2_response.json -w "%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "${API}/server.ts" \
  -d "$PAYLOAD")

if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  echo "✅  server.ts patched (HTTP ${STATUS})"
  echo "    0xx  → 27xx  ✓"
  echo "    27xx → 27xx  ✓ (unchanged)"
  echo "    +27xx → 27xx ✓"
else
  echo "❌  Failed (HTTP ${STATUS})"
  cat /tmp/fix2_response.json
  exit 1
fi
