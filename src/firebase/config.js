// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration - using environment variables for security
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('Missing required environment variables:', missingEnvVars);
  console.warn('Firebase features will be disabled. The app will run in local-only mode.');
  // Don't throw error, just log warning - app can still work with localStorage
}

// Only initialize Firebase if all required environment variables are present
let app = null;
let db = null;
let auth = null;
let analytics = null;

if (missingEnvVars.length === 0) {
  console.log('Firebase configuration loaded successfully');
  console.log('Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);
  console.log('Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);

  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firestore Database
  db = getFirestore(app);

  // Initialize Firebase Authentication
  auth = getAuth(app);

  // Initialize Analytics (optional)
  analytics = getAnalytics(app);

  console.log('Firebase services initialized successfully');
} else {
  console.log('Firebase services disabled due to missing environment variables');
}

export { db, auth, analytics };

export default app; 