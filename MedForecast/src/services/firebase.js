import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDayQUyiJ6X8SBTF9uqDmeTbrmvVWdXMUE",
  authDomain: "hospital-connection.firebaseapp.com",
  projectId: "hospital-connection",
  storageBucket: "hospital-connection.firebasestorage.app",
  messagingSenderId: "686104783934",
  appId: "1:686104783934:web:95b0bb9e05adddbea4756f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);