import type { RequerimientoFicha } from "@/lib/api/pacientes";

/**
 * Estado del bloque "Requerimiento energético" de la ficha.
 *
 * Con el paciente recién creado (sin ninguna medición) la API responde
 * `requerimiento: null`: sin peso no hay TMB, ni gasto total, ni kcal objetivo. El tipo
 * `FichaPaciente` declara el campo como obligatorio, así que esta es la única puerta por
 * la que el `null` real entra a la vista.
 */
export type EstadoRequerimiento =
  | { tipo: "sin-mediciones" }
  | { tipo: "disponible"; requerimiento: RequerimientoFicha };

/** `null`/ausente → sin mediciones; un objeto (aunque traiga valores `null`) → disponible. */
export function estadoRequerimiento(
  requerimiento: RequerimientoFicha | null | undefined,
): EstadoRequerimiento {
  return requerimiento ? { tipo: "disponible", requerimiento } : { tipo: "sin-mediciones" };
}
