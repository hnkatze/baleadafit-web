"use server";

import { redirect } from "next/navigation";
import { describeAltaError } from "@/lib/api/error-message";
import { crearPaciente, type PacienteCreado } from "@/lib/api/pacientes";
import {
  armarPayload,
  validarFormulario,
  type ResultadoAlta,
  type ValoresPaciente,
} from "@/lib/pacientes-form";

/** Primer mensaje por campo, para titular el alerta cuando la validación del servidor falla. */
function primerError(errores: Record<string, string>): string {
  const mensajes = Object.values(errores);

  return mensajes.length === 1
    ? mensajes[0]
    : `Revisá ${mensajes.length} campos del formulario: ${mensajes.join(" ")}`;
}

/**
 * Alta de paciente (spec S3 y S4).
 *
 * El navegador no puede llamar al API: el ID token vive en la cookie httpOnly `bfit_session`
 * (L4 de odd/tasks/pacientes-alta.md), así que la mutación sale del servidor. Acá se revalida todo
 * con la misma lógica pura del formulario —nunca se confía en el cliente— y del error del API solo
 * se devuelve un mensaje ya en español: ni el token ni el cuerpo crudo llegan al navegador.
 */
export async function crearPacienteAction(datos: ValoresPaciente): Promise<ResultadoAlta> {
  const errores = validarFormulario(datos);

  if (Object.keys(errores).length > 0) {
    return { ok: false, error: primerError(errores), errores };
  }

  let creado: PacienteCreado;

  try {
    creado = await crearPaciente(armarPayload(datos));
  } catch (error) {
    return { ok: false, error: describeAltaError(error) };
  }

  // Fuera del try/catch a propósito: `redirect()` lanza, y su excepción no es un fallo del alta.
  redirect(`/pacientes/${creado.id}`);
}
