"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { Alert, Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  errorCode,
  googleSignInMessage,
  isSilentCode,
  needsRedirectFallback,
  passwordSignInMessage,
} from "@/lib/firebase/errors";
import { storeSession } from "./client-session";

type Method = "google" | "password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
  const [pending, setPending] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isEmailInvalid = submitted && !EMAIL_PATTERN.test(email.trim());
  const isPasswordInvalid = submitted && password.length === 0;

  /** Same bridge for both methods: ID token in, httpOnly cookie out (spec S3). */
  async function finishSignIn(idToken: string) {
    await storeSession(idToken);
    router.replace("/");
    router.refresh();
  }

  // Coming back from the redirect fallback: finish the sign-in here, since the
  // login page is not inside the app shell that keeps the cookie fresh.
  useEffect(() => {
    let cancelled = false;

    async function finishRedirect() {
      try {
        const credential = await getRedirectResult(getFirebaseAuth());
        if (!credential || cancelled) return;

        setPending("google");
        await storeSession(await credential.user.getIdToken());
        if (cancelled) return;

        router.replace("/");
        router.refresh();
      } catch (redirectError) {
        if (!cancelled) setError(googleSignInMessage(redirectError));
      } finally {
        if (!cancelled) setPending(null);
      }
    }

    void finishRedirect();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleGoogleSignIn() {
    if (pending !== null) return;

    setError(null);
    setPending("google");

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      let idToken: string;

      try {
        const credential = await signInWithPopup(auth, provider);
        idToken = await credential.user.getIdToken();
      } catch (popupError) {
        const code = errorCode(popupError);
        if (isSilentCode(code)) return;
        if (!needsRedirectFallback(code)) throw popupError;

        await signInWithRedirect(auth, provider);
        return;
      }

      await finishSignIn(idToken);
    } catch (signInError) {
      const code = errorCode(signInError);
      if (isSilentCode(code)) return;

      setError(googleSignInMessage(signInError));
    } finally {
      setPending(null);
    }
  }

  async function handlePasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending !== null) return;

    setSubmitted(true);
    setError(null);

    const cleanEmail = email.trim();
    if (!EMAIL_PATTERN.test(cleanEmail) || password.length === 0) return;

    setPending("password");

    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), cleanEmail, password);
      await finishSignIn(await credential.user.getIdToken());
    } catch (signInError) {
      setError(passwordSignInMessage(signInError));
    } finally {
      setPending(null);
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

      <Button
        type="button"
        fullWidth
        isPending={pending === "google"}
        isDisabled={pending !== null}
        onPress={handleGoogleSignIn}
      >
        <GoogleIcon className="size-5" />
        {pending === "google" ? "Conectando…" : "Continuar con Google"}
      </Button>

      <div className="flex items-center gap-3 text-xs tracking-wide text-foreground/45">
        <span className="h-px flex-1 bg-border" />
        o con tu correo
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handlePasswordSignIn} noValidate className="flex flex-col gap-4">
        <TextField
          fullWidth
          isRequired
          isInvalid={isEmailInvalid}
          name="email"
          type="email"
          value={email}
          onChange={setEmail}
        >
          <Label>Correo electrónico</Label>
          <Input placeholder="nutri@baleadafit.hn" autoComplete="email" />
          <FieldError>Ingresá un correo válido.</FieldError>
        </TextField>

        <TextField
          fullWidth
          isRequired
          isInvalid={isPasswordInvalid}
          name="password"
          type="password"
          value={password}
          onChange={setPassword}
        >
          <Label>Contraseña</Label>
          <Input placeholder="Tu contraseña" autoComplete="current-password" />
          <FieldError>Ingresá tu contraseña.</FieldError>
        </TextField>

        <Button
          type="submit"
          fullWidth
          isPending={pending === "password"}
          isDisabled={pending !== null}
        >
          {pending === "password" ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-xs text-foreground/55">
        Usá la cuenta clínica habilitada en BaleadaFit (Google o correo). Si
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
