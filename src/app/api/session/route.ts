import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/api/client";

/**
 * Session exchange for Firebase ID tokens (spec S3).
 *
 * The token arrives in the JSON body, is stored in an httpOnly cookie and is never
 * logged. The API remains the authority: it re-verifies the token on every request.
 */

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

/** Firebase ID tokens are JWTs; anything near 4 KB is not a real token. */
const MAX_TOKEN_LENGTH = 4096;

/**
 * Same-origin guard: a cross-site `text/plain` form can post here without a preflight,
 * so the request must prove it comes from this origin (login CSRF / session fixation).
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return emptyResponse(415);
  }

  if (!isSameOrigin(request)) {
    return emptyResponse(403);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    // Malformed bodies are rejected without echoing anything back.
    return emptyResponse(400);
  }

  const idToken =
    typeof payload === "object" && payload !== null && "idToken" in payload
      ? (payload as { idToken?: unknown }).idToken
      : undefined;

  if (
    typeof idToken !== "string" ||
    idToken.trim().length === 0 ||
    idToken.length > MAX_TOKEN_LENGTH
  ) {
    return emptyResponse(400);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: idToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Local dev runs on plain http; production must be https-only.
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return emptyResponse(204);
}

export async function DELETE(): Promise<Response> {
  const cookieStore = await cookies();
  // Explicit path so the expiry matches the cookie set above.
  cookieStore.delete({ name: SESSION_COOKIE, path: "/" });

  return emptyResponse(204);
}
