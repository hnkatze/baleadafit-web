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

/**
 * Detalle de `GET /pacientes/{id}/ficha`. Solo se tipan los campos que la ficha
 * renderiza: la API devuelve bastante más (`situacion`, `habitos`, `consultas`).
 */
export type PacienteFicha = {
  id: string;
  nombre: string;
  apellido: string;
  sexo: Sexo | null;
  /** Fecha de calendario (medianoche UTC). */
  fechaNacimiento: string;
  correo: string | null;
  telefono: string | null;
};

/** `clasificacionImc` es un enum de la API (`NORMAL`, `SOBREPESO`, `OBESIDAD_I`, ...). */
export type CabeceraFicha = {
  edad: number | null;
  imc: number | null;
  clasificacionImc: string | null;
  pctGrasa: number | null;
  masaGrasaKg: number | null;
  masaMuscularKg: number | null;
};

export type ProgresoFicha = {
  pesoInicial: number | null;
  pesoActual: number | null;
  deltaKg: number | null;
  ritmoKgSemana: number | null;
  proyeccionKg: number | null;
};

export type RequerimientoFicha = {
  tmb: number | null;
  gastoTotal: number | null;
  /** Positivo o negativo según la meta: se suma al gasto total. */
  ajusteMeta: number | null;
  kcalObjetivo: number | null;
  proteinaG: number | null;
};

/** Ventana de 30 días hacia atrás; `porcentaje` es una fracción (0..1), no un 0..100. */
export type AdherenciaFicha = {
  porcentaje: number | null;
  cumplidos: number;
  total: number;
};

/** Alarmas de seguimiento calculadas por la API (no son diagnósticos). */
export type AlertaFicha = {
  tipo: string;
  severidad: "alta" | "media" | string;
  detalle: string;
};

/** Punto de `evolucion`: una medición. `fecha` es de calendario (medianoche UTC). */
export type EvolucionPunto = {
  fecha: string;
  pesoKg: number;
  pctGrasa: number | null;
};

/** `estado` es un enum de la API: `BORRADOR` | `ACTIVO` | `ARCHIVADO`. */
export type PlanFicha = {
  id: string;
  nombre: string;
  estado?: string | null;
};

export type FichaPaciente = {
  paciente: PacienteFicha;
  cabecera: CabeceraFicha;
  progreso: ProgresoFicha;
  requerimiento: RequerimientoFicha;
  adherencia30d: AdherenciaFicha;
  alertas: AlertaFicha[];
  evolucion: EvolucionPunto[];
  planes: PlanFicha[];
};

/** La API responde 404 cuando el paciente no existe (`ApiError.status === 404`). */
export function getFicha(id: string) {
  return apiGet<FichaPaciente>(`/pacientes/${encodeURIComponent(id)}/ficha`);
}
