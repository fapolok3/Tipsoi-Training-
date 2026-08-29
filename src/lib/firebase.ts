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

const firebaseConfig = configJson || {
  projectId: "abiding-bloom-4c9s2",
  appId: "1:170400716318:web:c987edf512ec3b8b0cc00f",
  apiKey: "AIzaSyCk14CSkFuwe6By2eVdCOZy2xDukkTMFJs",
  authDomain: "abiding-bloom-4c9s2.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9e61b7d5-36f6-4f51-abdc-95a09a20d392",
  storageBucket: "abiding-bloom-4c9s2.firebasestorage.app",
  messagingSenderId: "170400716318"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-9e61b7d5-36f6-4f51-abdc-95a09a20d392');
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    // If popup blocked inside iframe sandbox, throw so UI can show fallback or instructions
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
};
