export default function handler(req: any, res: any) {
  res.json({ 
    yoco: process.env.YOCO_SECRET_KEY ? 'SET' : 'MISSING',
    appUrl: process.env.APP_URL ? 'SET' : 'MISSING',
    firebaseProject: process.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
    firebaseAuth: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING'
  });
}