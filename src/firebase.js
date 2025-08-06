import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmtrqV1swD-qmXdCPeN-yB6FKlVdzI75E",
  authDomain: "careerbloom-fp61e.firebaseapp.com",
  projectId: "careerbloom-fp61e",
  storageBucket: "careerbloom-fp61e.firebasestorage.app",
  messagingSenderId: "520563108847",
  appId: "1:520563108847:web:c84fa9e9ff58cf1aa0641a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);