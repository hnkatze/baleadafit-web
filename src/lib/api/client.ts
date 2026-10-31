import { cookies } from "next/headers";

/** Base URL of the API. Local by default; production is https://api-pro.baleadafit.com. */
export const API_URL = process.env.API_URL ?? "http://localhost:3000";

/** Name of the httpOnly cookie that holds the Firebase ID token (see /api/session). */
export const SESSION_COOKIE = "bfit_session";

/** Short-lived on purpose: the client refreshes it through `onIdTokenChanged`. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

/**
 * Development bypass, used only while there is no session cookie:
 * `Authorization: Bearer dev:<uid>:<correo>` (ver docs/contexto-api.md).
 */
const DEV_TOKEN = process.env.API_DEV_TOKEN ?? "dev:nutri-1:nutri@correo.hn";

export class ApiError extends Error {
  /**
   * Response body of a non-ok response, when it was JSON. Validation errors (`400`)
   * arrive as `{ statusCode, message, error }` with `message` as an array of strings
   * (regla 5 de docs/contexto-api.md), so this is where the detail survives.
   */
  readonly detalle?: unknown;

  constructor(
    readonly status: number,
    readonly path: string,
    detalle?: unknown,
  ) {
    super(`API ${status} en ${path}`);
    this.name = "ApiError";
    this.detalle = detalle;
  }
}

/**
 * Reads the error body without ever failing: the API normally answers JSON, but a proxy
 * or an HTML error page would blow up `response.json()`.
 */
async function readDetalle(response: Response): Promise<unknown> {
  if (typeof response.json !== "function") return undefined;

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Prefers the session token from the httpOnly cookie (spec S4) and falls back to the
 * dev token so the portal keeps working without a login.
 */
async function resolveToken(): Promise<string> {
  try {
    const session = (await cookies()).get(SESSION_COOKIE)?.value;

    if (session && session.length > 0) return session;
  } catch {
    // Called outside a request scope (e.g. prerender): no cookie store available.
  }

  return DEV_TOKEN;
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = await resolveToken();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, path);
  }

  if (!response.ok) {
    throw new ApiError(response.status, path, await readDetalle(response));
  }

  return (await response.json()) as T;
}

/**
 * Same auth and cache rules as `apiGet`, for mutations (`POST /pacientes`). Mutations cannot
 * be sent from the browser: the ID token lives in the httpOnly `bfit_session` cookie, so this
 * is only reachable from the server (Server Actions / Server Components).
 */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = await resolveToken();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, path);
  }

  if (!response.ok) {
    throw new ApiError(response.status, path, await readDetalle(response));
  }

  return (await response.json()) as T;
}
