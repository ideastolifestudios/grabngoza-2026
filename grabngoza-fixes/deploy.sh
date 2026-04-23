#!/usr/bin/env bash
# ============================================================
#  Grab & Go ZA — one-shot fix deployer
#  Usage:
#    chmod +x deploy.sh
#    GITHUB_TOKEN=ghp_xxxx ./deploy.sh
#
#  What it does (no manual editing needed):
#    1. Patches firestore.rules  — fixes open brand writes
#    2. Patches server.ts        — Cloudinary uploads, Shiplogic
#                                  shipping, real WhatsApp, labels
#    3. Patches .env.example     — adds Cloudinary + WA phone ID
#    4. Adds .github/workflows/ci.yml — CI/CD via GitHub Actions
#
#  Requirements: bash, curl, base64 (all pre-installed on macOS/Linux)
# ============================================================

set -euo pipefail

REPO="ideastolifestudios/grabngoza-2026"
BRANCH="main"
TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN=ghp_... before running}"
API="https://api.github.com/repos/${REPO}/contents"

# ── helpers ──────────────────────────────────────────────────────────────────
b64() { base64 < "$1" | tr -d '\n'; }

get_sha() {
  local path="$1"
  curl -s -H "Authorization: Bearer ${TOKEN}" \
       -H "Accept: application/vnd.github+json" \
       "${API}/${path}?ref=${BRANCH}" \
    | grep '"sha"' | head -1 | sed 's/.*"sha": "\(.*\)".*/\1/'
}

push_file() {
  local gh_path="$1"   # path in the repo
  local local_file="$2" # local file to read
  local message="$3"

  local sha
  sha=$(get_sha "${gh_path}" 2>/dev/null || echo "")

  local payload
  if [ -n "$sha" ]; then
    payload=$(jq -n \
      --arg msg "$message" \
      --arg content "$(b64 "$local_file")" \
      --arg sha "$sha" \
      --arg branch "$BRANCH" \
      '{message:$msg, content:$content, sha:$sha, branch:$branch}')
  else
    payload=$(jq -n \
      --arg msg "$message" \
      --arg content "$(b64 "$local_file")" \
      --arg branch "$BRANCH" \
      '{message:$msg, content:$content, branch:$branch}')
  fi

  local status
  status=$(curl -s -o /tmp/gh_response.json -w "%{http_code}" \
    -X PUT \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "${API}/${gh_path}" \
    -d "$payload")

  if [[ "$status" == "200" || "$status" == "201" ]]; then
    echo "  ✅  ${gh_path} (HTTP ${status})"
  else
    echo "  ❌  ${gh_path} failed (HTTP ${status})"
    cat /tmp/gh_response.json
    exit 1
  fi
}

# ── check deps ────────────────────────────────────────────────────────────────
for cmd in curl jq base64; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "❌ '$cmd' not found. Install it first."; exit 1; }
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "🚀  Grab & Go ZA — pushing fixes to ${REPO}@${BRANCH}"
echo ""

push_file "firestore.rules" \
  "${SCRIPT_DIR}/firestore.rules" \
  "fix: lock brands write to admin only, remove hardcoded email from isAdmin()"

push_file "server.ts" \
  "${SCRIPT_DIR}/server.ts" \
  "feat: wire Cloudinary uploads, Shiplogic shipping/labels, real WhatsApp, health check"

push_file ".env.example" \
  "${SCRIPT_DIR}/.env.example" \
  "chore: add CLOUDINARY_*, WHATSAPP_PHONE_NUMBER_ID, clean up duplicates"

push_file ".github/workflows/ci.yml" \
  "${SCRIPT_DIR}/.github/workflows/ci.yml" \
  "ci: add GitHub Actions lint + build + Vercel deploy pipeline"

echo ""
echo "🎉  All done! Check your repo:"
echo "    https://github.com/${REPO}"
echo ""
echo "Next steps:"
echo "  1. Add secrets to GitHub → Settings → Secrets:"
echo "     VERCEL_TOKEN, VITE_FIREBASE_API_KEY (and other VITE_ vars)"
echo "  2. Add to Vercel project env vars:"
echo "     CLOUDINARY_*, SHIPLOGIC_API_KEY, WHATSAPP_ACCESS_TOKEN,"
echo "     WHATSAPP_PHONE_NUMBER_ID, YOCO_SECRET_KEY, SMTP_*"
echo "  3. Set SHIPLOGIC_TEST_MODE=false when ready for live shipping"
