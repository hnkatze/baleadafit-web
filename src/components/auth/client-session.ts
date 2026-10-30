/**
 * Client-side bridge between the Firebase SDK and the httpOnly session cookie
 * (spec S3). The ID token travels in the JSON body of a same-origin request, so it
 * never ends up in a URL, a log line or the rendered HTML.
 */
const SESSION_ENDPOINT = "/api/session";

/** Exchanges a fresh ID token for the `bfit_session` cookie. */
export async function storeSession(idToken: string): Promise<void> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar la sesión (HTTP ${response.status}).`);
  }
}

/** Clears the `bfit_session` cookie. */
export async function clearSession(): Promise<void> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No se pudo cerrar la sesión (HTTP ${response.status}).`);
  }
}
