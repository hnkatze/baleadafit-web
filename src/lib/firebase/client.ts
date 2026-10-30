import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

/**
 * Firebase Web App client.
 *
 * These values are public by design: they ship inside the browser bundle (spec S2).
 * Service account credentials never live here — see `.env.example`.
 *
 * Import this module only from client components: the Auth SDK needs a browser.
 * It never touches `window` at module scope so a server render does not crash.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Env var per config key. `NEXT_PUBLIC_*` must be read statically to be inlined. */
const ENV_NAME = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const satisfies Partial<Record<keyof FirebaseOptions, string>>;

export function missingFirebaseEnvVars(): string[] {
  return Object.entries(ENV_NAME)
    .filter(([key]) => {
      const value = firebaseConfig[key as keyof typeof ENV_NAME];
      return typeof value !== "string" || value.length === 0;
    })
    .map(([, envName]) => envName);
}

/**
 * Throws a descriptive error when the Web config is incomplete, so the caller can
 * show a human message instead of a cryptic Firebase failure.
 */
export function assertFirebaseConfig(): void {
  const missing = missingFirebaseEnvVars();

  if (missing.length > 0) {
    throw new Error(
      `Firebase no está configurado: falta ${missing.join(", ")}. Revisá .env.local (ver .env.example).`,
    );
  }
}

let cachedApp: FirebaseApp | undefined;

/** Initializes the Firebase app once and reuses it across HMR reloads. */
export function getFirebaseApp(): FirebaseApp {
  assertFirebaseConfig();
  cachedApp ??= getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  return cachedApp;
}

/** Auth instance for the shared app; safe to call repeatedly. */
export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
