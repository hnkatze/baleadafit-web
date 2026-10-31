/**
 * Firebase Auth error codes → user-facing copy for the login form.
 *
 * This module is only the mapping: no SDK calls, no React, so it can be tested
 * without a browser (spec S4).
 */

/** Popup is not usable here; a full redirect does the same job (spec S1). */
const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
]);

/** The user closed the popup or opened another one: no error banner. */
const SILENT_CODES = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

const GOOGLE_ERROR_MESSAGE =
  "No pudimos iniciar sesión con Google. Probá de nuevo en unos segundos.";

const PASSWORD_ERROR_MESSAGE = "No pudimos iniciar sesión. Probá de nuevo en unos segundos.";

const NOT_CONFIGURED_MESSAGE =
  "Este entorno no tiene configurado Firebase. Avisale al equipo técnico.";

/**
 * Every "your credentials are wrong" code collapses into one message on purpose:
 * distinguishing `user-not-found` from `wrong-password` would tell an attacker
 * which clinical emails exist. The password length is NOT validated here either —
 * Firebase already owns that rule, and a stricter client rule would lock out
 * accounts whose password is valid for Firebase.
 */
const PASSWORD_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "Ese correo no tiene un formato válido.",
  "auth/too-many-requests": "Demasiados intentos seguidos. Esperá unos minutos y probá otra vez.",
  "auth/user-disabled": "Esa cuenta está deshabilitada. Pedile acceso a la coordinación.",
  "auth/operation-not-allowed":
    "El acceso con correo y contraseña no está habilitado en Firebase.",
  "auth/network-request-failed": "No pudimos llegar a Firebase. Revisá tu conexión.",
};

/** Firebase throws plain objects with a string `code`; nothing else is trusted. */
export function errorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("code" in error)) return undefined;

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

export function isSilentCode(code: string | undefined): boolean {
  return code !== undefined && SILENT_CODES.has(code);
}

export function needsRedirectFallback(code: string | undefined): boolean {
  return code !== undefined && REDIRECT_FALLBACK_CODES.has(code);
}

function isNotConfigured(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Firebase no está configurado");
}

/** Same user-facing copy for every Google failure: never echo SDK details or tokens. */
export function googleSignInMessage(error: unknown): string {
  if (isNotConfigured(error)) return NOT_CONFIGURED_MESSAGE;

  return GOOGLE_ERROR_MESSAGE;
}

export function passwordSignInMessage(error: unknown): string {
  if (isNotConfigured(error)) return NOT_CONFIGURED_MESSAGE;

  const code = errorCode(error);
  return (code && PASSWORD_ERRORS[code]) || PASSWORD_ERROR_MESSAGE;
}
