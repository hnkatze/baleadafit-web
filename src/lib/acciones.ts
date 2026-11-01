/**
 * Señales de control de flujo de Next que viajan como **excepciones**.
 *
 * `redirect()` no devuelve un valor: lanza un error con `digest` `NEXT_REDIRECT...` que el
 * framework intercepta para navegar. Un `try/catch` alrededor de una Server Action lo atrapa como
 * si fuera un fallo, y el usuario ve "no se pudo guardar" sobre un guardado que sí ocurrió.
 */
const DIGEST_REDIRECT = "NEXT_REDIRECT";

export function esRedireccionDeNext(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const digest = (error as { digest?: unknown }).digest;

  return typeof digest === "string" && digest.startsWith(DIGEST_REDIRECT);
}
