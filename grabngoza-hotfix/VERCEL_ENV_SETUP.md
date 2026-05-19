# Vercel Environment Variables Setup

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

## Add these (copy from your .env.local):

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same place |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same place |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same place |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same place |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same place |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Console → Project Settings → Service Accounts → Generate New Private Key |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Same JSON file |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Same JSON file — paste the full key INCLUDING `-----BEGIN/END PRIVATE KEY-----` |
| `NEXT_PUBLIC_YOCO_PUBLIC_KEY` | Yoco Dashboard → Developers → API Keys |
| `YOCO_SECRET_KEY` | Same place — the SECRET key |
| `GEMINI_API_KEY` | console.cloud.google.com → AI Studio → Get API Key |
| `NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN` | Leave blank (set to empty string) to suppress the error |

## IMPORTANT — FIREBASE_ADMIN_PRIVATE_KEY format:
In Vercel, paste the key EXACTLY as it appears in the downloaded JSON file.
Vercel preserves newlines correctly — do not replace \n with actual newlines.

## After adding variables:
Click "Redeploy" (or push a new commit) — Vercel does NOT automatically redeploy when you add env vars.