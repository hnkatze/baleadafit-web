import { describe, expect, it } from "vitest";
import {
  errorCode,
  googleSignInMessage,
  isSilentCode,
  needsRedirectFallback,
  passwordSignInMessage,
} from "./errors";

const WRONG_CREDENTIALS = "Correo o contraseña incorrectos.";

describe("passwordSignInMessage", () => {
  it("collapses every wrong-credential code into one identical message", () => {
    const messages = [
      passwordSignInMessage({ code: "auth/invalid-credential" }),
      passwordSignInMessage({ code: "auth/wrong-password" }),
      passwordSignInMessage({ code: "auth/user-not-found" }),
    ];

    expect(messages).toEqual([WRONG_CREDENTIALS, WRONG_CREDENTIALS, WRONG_CREDENTIALS]);
  });

  it("keeps distinct messages for distinct causes", () => {
    const operationNotAllowed = passwordSignInMessage({ code: "auth/operation-not-allowed" });
    const invalidEmail = passwordSignInMessage({ code: "auth/invalid-email" });

    expect(operationNotAllowed).toBe(
      "El acceso con correo y contraseña no está habilitado en Firebase.",
    );
    expect(invalidEmail).toBe("Ese correo no tiene un formato válido.");
    expect(operationNotAllowed).not.toBe(invalidEmail);
  });

  it("falls back to a generic message for an unknown code", () => {
    expect(passwordSignInMessage({ code: "auth/something-new" })).toBe(
      "No pudimos iniciar sesión. Probá de nuevo en unos segundos.",
    );
  });

  it("reports a technical misconfiguration instead of a credential problem", () => {
    const message = passwordSignInMessage(new Error("Firebase no está configurado"));

    expect(message).toBe("Este entorno no tiene configurado Firebase. Avisale al equipo técnico.");
  });
});

describe("googleSignInMessage", () => {
  it("reports a technical misconfiguration instead of a sign-in problem", () => {
    expect(googleSignInMessage(new Error("Firebase no está configurado"))).toBe(
      "Este entorno no tiene configurado Firebase. Avisale al equipo técnico.",
    );
  });

  it("keeps one generic message for every other Google failure", () => {
    expect(googleSignInMessage({ code: "auth/unauthorized-domain" })).toBe(
      "No pudimos iniciar sesión con Google. Probá de nuevo en unos segundos.",
    );
  });
});

describe("code classification", () => {
  it("reads the code out of a thrown object", () => {
    expect(errorCode({ code: "auth/invalid-email" })).toBe("auth/invalid-email");
    expect(errorCode(new Error("sin code"))).toBeUndefined();
    expect(errorCode({ code: 42 })).toBeUndefined();
    expect(errorCode(null)).toBeUndefined();
  });

  it("marks the codes that close the popup without showing an error", () => {
    expect(isSilentCode("auth/popup-closed-by-user")).toBe(true);
    expect(isSilentCode("auth/cancelled-popup-request")).toBe(true);
    expect(isSilentCode("auth/popup-blocked")).toBe(false);
    expect(isSilentCode(undefined)).toBe(false);
  });

  it("marks the codes that must retry with a full redirect", () => {
    expect(needsRedirectFallback("auth/popup-blocked")).toBe(true);
    expect(needsRedirectFallback("auth/operation-not-supported-in-this-environment")).toBe(true);
    expect(needsRedirectFallback("auth/popup-closed-by-user")).toBe(false);
    expect(needsRedirectFallback(undefined)).toBe(false);
  });
});
