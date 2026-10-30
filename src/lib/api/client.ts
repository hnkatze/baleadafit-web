import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

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
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`API ${status} en ${path}`);
    this.name = "ApiError";
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
    throw new ApiError(response.status, path);
  }

  return (await response.json()) as T;
}
