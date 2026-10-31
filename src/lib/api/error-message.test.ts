import { describe, expect, it, vi } from "vitest";
import { ApiError, API_URL } from "@/lib/api/client";
import { describeAltaError, describeApiError } from "./error-message";

// `client.ts` reads `next/headers` at module load; this suite never uses cookies.
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));

describe("describeApiError", () => {
  it("explains a 403 as a missing clinical profile, not as an API outage", () => {
    const { heading, description } = describeApiError(new ApiError(403, "/dashboard"), "Fallback");

    expect(heading).toBe("Tu cuenta todavía no tiene perfil clínico");
    expect(description).toBe(
      "La sesión es válida, pero la API rechazó la petición con 403 porque tu cuenta no está vinculada a un perfil de nutricionista. Pedile a la coordinación que vincule tu firebaseUid.",
    );
    expect(description).not.toContain(API_URL);
    expect(description).not.toContain(".env.local");
  });

  it("explains a 401 as a session problem and keeps the fallback title", () => {
    const { heading, description } = describeApiError(new ApiError(401, "/auth/me"), "Sin sesión");

    expect(heading).toBe("Sin sesión");
    expect(description).toBe(
      "La API no aceptó la sesión (401) en /auth/me. Cerrá sesión y volvé a entrar.",
    );
  });

  it("reports any other status with the fallback title and the path", () => {
    const { heading, description } = describeApiError(new ApiError(500, "/dashboard"), "Fallback");

    expect(heading).toBe("Fallback");
    expect(description).toBe("La API respondió 500 en /dashboard.");
  });

  it("blames the network only when the API could not be reached", () => {
    const { heading, description } = describeApiError(new Error("boom"), "Fallback");

    expect(heading).toBe("Fallback");
    expect(description).toBe(
      `No pudimos llegar a ${API_URL}. Revisá que la API responda y que API_URL esté en .env.local. Sin sesión iniciada el portal manda API_DEV_TOKEN, que la API de producción rechaza.`,
    );
  });

  it("treats a status 0 network failure as a network failure", () => {
    const { heading, description } = describeApiError(new ApiError(0, "/dashboard"), "Fallback");

    expect(heading).toBe("Fallback");
    expect(description).toContain(`No pudimos llegar a ${API_URL}`);
  });
});

describe("describeAltaError", () => {
  it("names the duplicated email for a 409", () => {
    expect(describeAltaError(new ApiError(409, "/pacientes"))).toBe(
      "Ya existe un paciente con ese correo.",
    );
  });

  it("joins the validation detail of a 400 when it comes as an array", () => {
    const error = new ApiError(400, "/pacientes", {
      statusCode: 400,
      message: ["correo must be an email", "condiciones must not be empty"],
      error: "Bad Request",
    });

    expect(describeAltaError(error)).toBe(
      "La API rechazó los datos: correo must be an email; condiciones must not be empty.",
    );
  });

  it("shows the validation detail of a 400 when it comes as a string", () => {
    const error = new ApiError(400, "/pacientes", {
      statusCode: 400,
      message: "condiciones contiene códigos inexistentes: XYZ",
      error: "Bad Request",
    });

    expect(describeAltaError(error)).toBe(
      "La API rechazó los datos: condiciones contiene códigos inexistentes: XYZ.",
    );
  });

  it("falls back to a generic 400 message when there is no detail", () => {
    expect(describeAltaError(new ApiError(400, "/pacientes"))).toBe(
      "La API rechazó los datos, pero no dijo qué campos. Revisá el formulario y volvé a intentar.",
    );
  });

  it("asks to log in again on a 401", () => {
    expect(describeAltaError(new ApiError(401, "/pacientes"))).toBe(
      "La sesión venció. Cerrá sesión y volvé a entrar.",
    );
  });

  it("explains a 403 as a missing clinical profile", () => {
    expect(describeAltaError(new ApiError(403, "/pacientes"))).toBe(
      "Tu cuenta no tiene perfil clínico vinculado, así que la API no permite dar de alta pacientes.",
    );
  });

  it("gives an actionable message when the API could not be reached", () => {
    const mensaje = describeAltaError(new ApiError(0, "/pacientes"));

    expect(mensaje).toBe(
      `No pudimos llegar a ${API_URL}. Revisá que la API responda y volvé a intentar: los datos del formulario siguen cargados.`,
    );
  });

  it("keeps any other status short and never leaks the raw body", () => {
    const error = new ApiError(500, "/pacientes", {
      statusCode: 500,
      message: "prisma: connection reset",
      error: "Internal Server Error",
    });
    const mensaje = describeAltaError(error);

    expect(mensaje).toBe("La API falló con 500 al crear el paciente. Volvé a intentar en un momento.");
    expect(mensaje).not.toContain("prisma");
  });

  it("does not leak the token of a non-ApiError failure", () => {
    const mensaje = describeAltaError(new Error("Bearer dev:nutri-1:nutri@correo.hn"));

    expect(mensaje).not.toContain("dev:nutri-1");
    expect(mensaje).toContain("No pudimos llegar");
  });
});
