// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVXnaPLAftdNC6_wDJffXA7R11EXJ2InU",
  authDomain: "reward-streaks-app.firebaseapp.com",
  projectId: "reward-streaks-app",
  storageBucket: "reward-streaks-app.firebasestorage.app",
  messagingSenderId: "589296076268",
  appId: "1:589296076268:web:5d3888843524960b766cc9",
  measurementId: "G-B58W7BC2MB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app; 