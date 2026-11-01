"use server";

import { redirect } from "next/navigation";
import { actualizarAlimento, crearAlimento } from "@/lib/api/alimentos";
import { describeAlimentoError } from "@/lib/api/error-message";
import {
  armarPayloadAlta,
  armarPayloadPatch,
  validarAlimento,
  type ResultadoAlimento,
  type ValoresAlimento,
} from "@/lib/alimentos-form";

/** Primer mensaje por campo, para titular el alerta cuando la validación del servidor falla. */
function primerError(errores: Record<string, string>): string {
  const mensajes = Object.values(errores);

  return mensajes.length === 1
    ? mensajes[0]
    : `Revisá ${mensajes.length} campos del formulario: ${mensajes.join(" ")}`;
}

/**
 * Alta de alimento (spec S3).
 *
 * El navegador no puede llamar al API: el ID token vive en la cookie httpOnly `bfit_session`, así
 * que la mutación sale del servidor. Acá se revalida todo con la misma lógica pura del formulario
 * —nunca se confía en el cliente— y del error del API solo se devuelve un mensaje ya en español:
 * ni el token ni el cuerpo crudo llegan al navegador (spec S6).
 */
export async function crearAlimentoAction(valores: ValoresAlimento): Promise<ResultadoAlimento> {
  const errores = validarAlimento(valores);

  if (Object.keys(errores).length > 0) {
    return { ok: false, error: primerError(errores), errores };
  }

  let creado: { id: string };

  try {
    creado = await crearAlimento(armarPayloadAlta(valores));
  } catch (error) {
    return { ok: false, error: describeAlimentoError(error) };
  }

  // Fuera del try/catch a propósito: `redirect()` lanza, y su excepción no es un fallo del alta.
  redirect(`/alimentos/${creado.id}`);
}

/**
 * Edición de alimento (spec S4). Manda **solo los campos que cambiaron**: `PATCH` no exige ninguno,
 * y cada guardado cierra la versión vigente y abre una nueva (spec S5), así que un formulario
 * reenviado sin cambios no debe crear una versión. Si el diff está vacío se devuelve `sinCambios`
 * sin llamar al API.
 */
export async function actualizarAlimentoAction(
  id: string,
  valoresOriginales: ValoresAlimento,
  valores: ValoresAlimento,
): Promise<ResultadoAlimento> {
  const errores = validarAlimento(valores);

  if (Object.keys(errores).length > 0) {
    return { ok: false, error: primerError(errores), errores };
  }

  const cambios = armarPayloadPatch(valoresOriginales, valores);

  if (Object.keys(cambios).length === 0) return { ok: true, sinCambios: true };

  try {
    await actualizarAlimento(id, cambios);
  } catch (error) {
    return { ok: false, error: describeAlimentoError(error) };
  }

  // Fuera del try/catch a propósito: `redirect()` lanza, y su excepción no es un fallo de la edición.
  redirect(`/alimentos/${encodeURIComponent(id)}`);
}
