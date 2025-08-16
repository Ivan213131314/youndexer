import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBmtrqV1swD-qmXdCPeN-yB6FKlVdzI75E",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "careerbloom-fp61e.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "careerbloom-fp61e",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "careerbloom-fp61e.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "520563108847",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:520563108847:web:c84fa9e9ff58cf1aa0641a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);