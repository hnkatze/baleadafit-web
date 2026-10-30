import { apiGet } from "./client";

/** `Sexo` es un enum de la API: `M` | `F`. */
export type Sexo = "M" | "F";

/** `Meta` es un enum de la API: `BAJAR` | `MANTENER` | `SUBIR`. */
export type Meta = "BAJAR" | "MANTENER" | "SUBIR";

/**
 * Resumen de la última medición. `fecha` es una fecha de calendario guardada como
 * medianoche UTC (regla 1 de docs/contexto-api.md), no un instante.
 */
export type UltimaMedicion = {
  pesoKg: number;
  tallaCm: number | null;
  pctGrasa: number | null;
  fecha: string;
};

export type PlanActivo = {
  id: string;
  nombre: string;
};

/**
 * Fila de `GET /pacientes`: el listado trae `ultimaMedicion` y `planActivo` aplanados
 * y sin paginar. El detalle completo (ficha) vive en su propio fetcher.
 */
export type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  /** La API lo devuelve; el listado filtra por correo además de nombre y apellido. */
  correo?: string | null;
  sexo: Sexo | null;
  /** Fecha de calendario (medianoche UTC). */
  fechaNacimiento: string;
  meta: Meta | null;
  activo: boolean;
  /** Instante ISO con zona. */
  creadoEn: string;
  ultimaMedicion: UltimaMedicion | null;
  planActivo: PlanActivo | null;
};

export function getPacientes() {
  return apiGet<Paciente[]>("/pacientes");
}
