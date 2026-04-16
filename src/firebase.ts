import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = require('../../firebase-applet-config.json');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use the databaseId if provided
export const db = firebaseConfig.databaseId 
  ? getFirestore(app, firebaseConfig.databaseId)
  : getFirestore(app);

export default app;