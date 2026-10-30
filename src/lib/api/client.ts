const API_URL = process.env.API_URL ?? "http://localhost:3000";

/**
 * Mientras no exista Firebase Auth (issue #2) hablamos con la API usando el bypass
 * de desarrollo: `Authorization: Bearer dev:<uid>:<correo>` (ver docs/contexto-api.md).
 * Cuando el login esté conectado, el token lo emite el SDK del cliente y este helper
 * pasa a recibirlo por parámetro.
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

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${DEV_TOKEN}`,
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
