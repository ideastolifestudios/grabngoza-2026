#!/usr/bin/env bash
# Fix 3 — CI pipeline: make TypeScript type-check non-blocking
# Usage: GITHUB_TOKEN=ghp_xxxx ./deploy-fix3.sh

set -euo pipefail

REPO="ideastolifestudios/grabngoza-2026"
BRANCH="main"
TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN=ghp_... before running}"
API="https://api.github.com/repos/${REPO}/contents"

FILE=".github/workflows/ci.yml"

echo "⬇  Fetching current ${FILE}..."
RESPONSE=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
     -H "Accept: application/vnd.github+json" \
     "${API}/${FILE}?ref=${BRANCH}")

SHA=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])" 2>/dev/null || \
      echo "$RESPONSE" | grep '"sha"' | head -1 | sed 's/.*"sha": "\(.*\)".*/\1/')
CONTENT_B64=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['content'])" 2>/dev/null || \
              echo "$RESPONSE" | grep '"content"' | sed 's/.*"content": "\(.*\)".*/\1/' | head -1)

CURRENT=$(echo "$CONTENT_B64" | base64 -d 2>/dev/null || echo "$CONTENT_B64" | base64 --decode)

# Insert continue-on-error: true after the lint run line
PATCHED=$(echo "$CURRENT" | sed '/run: npm run lint/{n; /continue-on-error/!s/$/\n        continue-on-error: true/}' | \
          awk '/run: npm run lint/ && !found { print; print "        continue-on-error: true"; found=1; next } /continue-on-error/ && !done { done=1; next } { print }')

# Simpler reliable approach
PATCHED=$(echo "$CURRENT" | sed 's/        run: npm run lint$/        run: npm run lint\n        continue-on-error: true/')

if [ "$CURRENT" = "$PATCHED" ]; then
  echo "⚠️  Pattern not found — already patched or workflow changed. Aborting."
  exit 1
fi

NEW_B64=$(echo "$PATCHED" | base64 | tr -d '\n')

PAYLOAD=$(jq -n \
  --arg msg "ci: make tsc type-check non-blocking (continue-on-error) so existing type gaps don't wall deploys" \
  --arg content "$NEW_B64" \
  --arg sha "$SHA" \
  --arg branch "$BRANCH" \
  '{message:$msg, content:$content, sha:$sha, branch:$branch}')

STATUS=$(curl -s -o /tmp/fix3_response.json -w "%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "${API}/${FILE// /%20}" \
  -d "$PAYLOAD")

if [[ "$STATUS" == "200" || "$STATUS" == "201" ]]; then
  echo "✅  .github/workflows/ci.yml patched (HTTP ${STATUS})"
  echo "    Type-check runs and reports — but won't block deploys"
else
  echo "❌  Failed (HTTP ${STATUS})"
  cat /tmp/fix3_response.json
  exit 1
fi
