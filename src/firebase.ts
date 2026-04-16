import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcQWjvjcwO5S-KQoTP-6sRIOJkHCKBj1I",
  authDomain: "grab-go-za.firebaseapp.com",
  projectId: "grab-go-za",
  storageBucket: "grab-go-za.firebasestorage.app",
  messagingSenderId: "111606509611",
  appId: "1:111606509611:web:10dcbcdb2e39a052b47a6e",
  measurementId: "G-L979BBPS1K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'grab-go-za');
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export default app;