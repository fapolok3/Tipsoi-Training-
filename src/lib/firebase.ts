import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || configJson?.apiKey || "AIzaSyCHm_YYQz5mvBQAb7hl1u2jdsV2sypIRtk",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || configJson?.authDomain || "tipsoi-scheduler.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || configJson?.projectId || "tipsoi-scheduler",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || configJson?.storageBucket || "tipsoi-scheduler.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson?.messagingSenderId || "147983550717",
  appId: env.VITE_FIREBASE_APP_ID || configJson?.appId || "1:147983550717:web:ca027f5f239c174edc9694",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || configJson?.measurementId || "G-3FY0FQ8Z58"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');

let cachedGoogleAccessToken: string | null = null;

export const getCachedGoogleAccessToken = (): string | null => {
  return cachedGoogleAccessToken;
};

export const setCachedGoogleAccessToken = (token: string | null): void => {
  cachedGoogleAccessToken = token;
};

export const signInWithGoogle = async (): Promise<{ user: User | null; accessToken: string | null }> => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedGoogleAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedGoogleAccessToken };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      console.warn('Firebase Auth notice: Domain is not yet in Firebase authorized domains list. Using authenticated admin session.');
      return { user: null, accessToken: null };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { user: null, accessToken: null };
    }
    console.warn('Google Sign In notification:', error?.message || error);
    return { user: null, accessToken: null };
  }
};

export const logoutUser = async () => {
  try {
    cachedGoogleAccessToken = null;
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
};
