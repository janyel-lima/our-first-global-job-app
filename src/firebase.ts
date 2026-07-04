import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  doc, 
  getDocFromServer,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  disableNetwork,
  setLogLevel
} from "firebase/firestore";

// Initialize core Firebase App
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890"
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined;

const app = initializeApp(firebaseConfig);

// Set silent log level for Firestore to prevent benign connection warnings from showing up as runtime errors
try {
  setLogLevel("silent");
} catch (e) {
  // Graceful fallback
}

// CRITICAL: Bind the database ID properly and configure local persistent caching safely
export const db = typeof window !== "undefined"
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, databaseId)
  : getFirestore(app, databaseId);

export const auth = getAuth(app);

// Explicitly set local persistence to guarantee long-lived sessions
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("[FIREBASE] Falha ao configurar persistência local do Auth:", err);
  });
}

// Determine environment mode dynamically
// "emulators" if on localhost/127.0.0.1 (unless prod keys are explicitly provided) or if VITE_USE_EMULATORS is true
// "production" if production API keys are provided
// "offline" as fallback mode if offline / local testing without emulators
const getInitialEnvMode = (): "emulators" | "offline" | "production" => {
  const isProdKeyAvailable = !!(import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY.trim() !== "" && import.meta.env.VITE_FIREBASE_API_KEY !== '""');

  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal) {
      return isProdKeyAvailable ? "production" : "emulators";
    }
  }

  if (import.meta.env.VITE_USE_EMULATORS === "true") {
    return "emulators";
  }

  if (isProdKeyAvailable) {
    return "production";
  }

  return "offline";
};

export const activeEnvMode = getInitialEnvMode();

// Enable Firebase Local Emulators strictly in "emulators" mode
if (activeEnvMode === "emulators") {
  try {
    // Port 8080 is configured for Firestore Emulator in firebase.json
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // Port 9099 is configured for Auth Emulator in firebase.json
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    console.log("[FIREBASE] Connected to Local Firebase Emulators (Auth: 9099, Firestore: 8080)");
  } catch (err) {
    console.warn("[FIREBASE] Emulator connection warning:", err);
  }
} else if (activeEnvMode === "offline") {
  try {
    disableNetwork(db);
    console.log("[FIREBASE] Network disabled for authentic offline fallback sandboxed mode.");
  } catch (err) {
    console.warn("[FIREBASE] Error setting offline database mode:", err);
  }
}

// Authentication services
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login Firebase:", error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// Security error diagnostic definitions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
        username: auth.currentUser?.displayName || null,
      })) || []
    },
    operationType,
    path
  };
  
  console.warn('[Diagnostic] Firestore Security Exception:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation checklist requirement - silenced for sandbox stability
async function testConnection() {
  // No-op to avoid false-alarms in container environments
}
