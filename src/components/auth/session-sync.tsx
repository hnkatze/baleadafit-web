"use client";

import { useEffect } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { storeSession } from "./client-session";

/**
 * Keeps the `bfit_session` cookie in sync with Firebase (spec S3): every time the SDK
 * rotates the ID token we push the fresh one to `/api/session`, so the server never
 * works with an expired token. Renders nothing.
 */
export function SessionSync() {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    try {
      unsubscribe = onIdTokenChanged(getFirebaseAuth(), (user) => {
        if (!user) return;

        void user
          .getIdToken()
          .then((idToken) => (active ? storeSession(idToken) : undefined))
          .catch(() => {
            // A failed refresh must not break the shell: the cookie keeps its last value
            // until the next rotation or the next login.
          });
      });
    } catch {
      // Firebase sin configurar (entorno de desarrollo sin .env.local): no hay nada que sincronizar.
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return null;
}
