"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { Alert, Button } from "@heroui/react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { storeSession } from "./client-session";

/** Popup is not usable here; a full redirect does the same job (spec S1). */
const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
]);

/** The user closed the popup or opened another one: no error banner. */
const SILENT_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

const ERROR_MESSAGE =
  "No pudimos iniciar sesión con Google. Probá de nuevo en unos segundos.";

function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.27Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.6-4.12H3.05v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.05a10 10 0 0 0 0 8.96L6.4 13.9Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.52L6.4 10.1c.8-2.36 3-4.12 5.6-4.12Z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coming back from the redirect fallback: finish the sign-in here, since the
  // login page is not inside the app shell that keeps the cookie fresh.
  useEffect(() => {
    let cancelled = false;

    async function finishRedirect() {
      try {
        const credential = await getRedirectResult(getFirebaseAuth());
        if (!credential || cancelled) return;

        setPending(true);
        await storeSession(await credential.user.getIdToken());
        if (cancelled) return;

        router.replace("/");
        router.refresh();
      } catch (redirectError) {
        if (!cancelled) setError(errorMessage(redirectError));
      } finally {
        if (!cancelled) setPending(false);
      }
    }

    void finishRedirect();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      let idToken: string;

      try {
        const credential = await signInWithPopup(auth, provider);
        idToken = await credential.user.getIdToken();
      } catch (popupError) {
        const code = errorCode(popupError);
        if (code && SILENT_CODES.has(code)) return;
        if (!code || !REDIRECT_FALLBACK_CODES.has(code)) throw popupError;

        await signInWithRedirect(auth, provider);
        return;
      }

      await storeSession(idToken);
      router.replace("/");
      router.refresh();
    } catch (signInError) {
      const code = errorCode(signInError);
      if (code && SILENT_CODES.has(code)) return;

      setError(errorMessage(signInError));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-foreground/65">
          Portal clínico para nutricionistas. Entrá con tu cuenta clínica de
          BaleadaFit.
        </p>
      </header>

      <Button fullWidth isPending={pending} onPress={handleGoogleSignIn}>
        <GoogleIcon className="size-5" />
        {pending ? "Conectando…" : "Continuar con Google"}
      </Button>

      <p className="text-xs text-foreground/55">
        Usá la cuenta de Google habilitada como cuenta clínica de BaleadaFit. Si
        todavía no tenés acceso, pedíselo a la coordinación.
      </p>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No pudimos iniciar sesión</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </div>
  );
}

/** Same user-facing copy for every failure: never echo SDK details or tokens. */
function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("Firebase no está configurado")) {
    return "Este entorno no tiene configurado Firebase. Avisale al equipo técnico.";
  }

  return ERROR_MESSAGE;
}
