import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';

// Embedded Firestore Database Configuration for Dunwell Youth Clinic & COJ Homeless Outreach
// Direct in-code connection guarantees persistent cloud synchronization on Render and all hosting platforms without manual typing
export const FIREBASE_CONFIG = {
  projectId: "buoyant-achievment-4lxdt",
  appId: "1:851147240403:web:e6019f23a453bfb9277526",
  apiKey: "AIzaSyD-T-f7pI4EYamginTshu7Tc00P16dFdmE",
  authDomain: "buoyant-achievment-4lxdt.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-cojxdunwelloutre-f1d464a2-fd65-4bf9-84d8-a9b3abd9ea86",
  storageBucket: "buoyant-achievment-4lxdt.firebasestorage.app",
  messagingSenderId: "851147240403",
} as const;

// Dynamically resolve configuration with priority:
// 1. Environment variables (e.g. Render Dashboard / .env.production)
// 2. Bundled default credentials
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CONFIG.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_CONFIG.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CONFIG.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || FIREBASE_CONFIG.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CONFIG.messagingSenderId,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target designated Firestore database ID
const targetDatabaseId = firebaseConfig.firestoreDatabaseId || FIREBASE_CONFIG.firestoreDatabaseId || '(default)';

// Initialize Firestore with multi-tab offline persistence & designated databaseId
let firestoreDb: Firestore;

try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, targetDatabaseId);
} catch (e) {
  // If already initialized or fallback
  firestoreDb = initializeFirestore(app, {}, targetDatabaseId);
}

export { app, firestoreDb, firebaseConfig, targetDatabaseId };

