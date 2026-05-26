# Firebase Functions Setup

## Prerequisites
- Firebase Blaze plan (required for Cloud Functions + scheduled functions)
- Node.js 20+

## 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

## 2. Configure email (SMTP) for abandoned cart emails
```bash
firebase functions:config:set \
  smtp.host="smtp.gmail.com" \
  smtp.port="587" \
  smtp.user="your@email.com" \
  smtp.pass="your_app_password" \
  app.url="https://shopgrabngo.co.za"
```
> For Gmail: use an App Password (Google Account > Security > App Passwords)

## 3. Add Firebase Admin credentials to Next.js .env.local
```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxx@project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"
```
Get these from Firebase Console > Project Settings > Service Accounts > Generate New Private Key

## 4. Add firebase-admin to Next.js dependencies
```bash
npm install firebase-admin
```

## 5. Deploy functions
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 6. Firestore indexes needed
Create composite indexes in Firebase Console for:
- Collection: `carts`, fields: `emailSent ASC`, `converted ASC`, `updatedAt ASC`

## 7. Test locally
```bash
firebase emulators:start --only functions,firestore
```