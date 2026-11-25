import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
let authInstance: any = null;
let dbInstance: any = null;
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

try {
  authInstance = getAuth(app);
  dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
} catch (e) {
  console.warn('Firebase initialized with fallback:', e);
}

export const auth = authInstance;
export const db = dbInstance;

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'siteConfig', 'main'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Configure Google Provider with Drive Scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;

// Sign in with Google (to grant Drive access for photographer backend)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};
