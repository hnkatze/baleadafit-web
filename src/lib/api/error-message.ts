import { ApiError, API_URL } from "./client";

export type ApiErrorMessage = {
  /** Short, bold line of the alert. */
  heading: string;
  /** Plain text: the component decides the markup (see ApiErrorAlert). */
  description: string;
};

/**
 * Turns an `ApiError` status into something the user can act on. The default
 * "check API_URL in .env.local" is only true for a network failure: a 401 is a
 * session problem and a 403 means the session is fine but the account has no
 * clinical profile linked (the API resolves the role by `firebaseUid`).
 */
export function describeApiError(error: unknown, fallbackTitle: string): ApiErrorMessage {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        heading: "Tu cuenta todavía no tiene perfil clínico",
        description:
          "La sesión es válida, pero la API rechazó la petición con 403 porque tu cuenta no está vinculada a un perfil de nutricionista. Pedile a la coordinación que vincule tu firebaseUid.",
      };
    }

    if (error.status === 401) {
      return {
        heading: fallbackTitle,
        description: `La API no aceptó la sesión (401) en ${error.path}. Cerrá sesión y volvé a entrar.`,
      };
    }

    if (error.status > 0) {
      return {
        heading: fallbackTitle,
        description: `La API respondió ${error.status} en ${error.path}.`,
      };
    }
  }

  return {
    heading: fallbackTitle,
    description: `No pudimos llegar a ${API_URL}. Revisá que la API responda y que API_URL esté en .env.local. Sin sesión iniciada el portal manda API_DEV_TOKEN, que la API de producción rechaza.`,
  };
}

/**
 * Validation detail of a `400`: the API sends `{ statusCode, message, error }` and `message` is an
 * array of strings (regla 5 de docs/contexto-api.md). Anything else is ignored, never rendered.
 */
function detalleDeValidacion(detalle: unknown): string | undefined {
  if (typeof detalle === "string") return detalle.trim() || undefined;
  if (detalle === null || typeof detalle !== "object") return undefined;

  const mensaje = (detalle as { message?: unknown }).message;

  if (typeof mensaje === "string") return mensaje.trim() || undefined;

  if (Array.isArray(mensaje)) {
    const partes = mensaje
      .filter((parte): parte is string => typeof parte === "string")
      .map((parte) => parte.trim())
      .filter((parte) => parte.length > 0);

    return partes.length > 0 ? partes.join("; ") : undefined;
  }

  return undefined;
}

/**
 * Error de la Server Action de alta, ya en español y listo para mostrar dentro del formulario
 * (spec S4). Nunca incluye el token, el cuerpo crudo de la respuesta ni el path interno: solo el
 * detalle de validación del 400, que es lo que el nutricionista puede corregir.
 */
export function describeAltaError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return "Ya existe un paciente con ese correo.";

    if (error.status === 400) {
      const detalle = detalleDeValidacion(error.detalle);

      return detalle === undefined
        ? "La API rechazó los datos, pero no dijo qué campos. Revisá el formulario y volvé a intentar."
        : `La API rechazó los datos: ${detalle}.`;
    }

    if (error.status === 401) return "La sesión venció. Cerrá sesión y volvé a entrar.";

    if (error.status === 403) {
      return "Tu cuenta no tiene perfil clínico vinculado, así que la API no permite dar de alta pacientes.";
    }

    if (error.status > 0) {
      return `La API falló con ${error.status} al crear el paciente. Volvé a intentar en un momento.`;
    }
  }

  return `No pudimos llegar a ${API_URL}. Revisá que la API responda y volvé a intentar: los datos del formulario siguen cargados.`;
}
