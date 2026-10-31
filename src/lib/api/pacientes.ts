import { apiGet, apiPost } from "./client";

/** `Sexo` es un enum de la API: `M` | `F`. */
export type Sexo = "M" | "F";

/** `Meta` es un enum de la API: `BAJAR` | `MANTENER` | `SUBIR`. */
export type Meta = "BAJAR" | "MANTENER" | "SUBIR";

/** `NivelActividad` es un enum de la API, de menos a más movimiento. */
export type NivelActividad = "SEDENTARIO" | "LIGERO" | "MODERADO" | "INTENSO" | "MUY_INTENSO";

/** `EstadoFisiologico` es un enum de la API: el embarazo y la lactancia cambian el requerimiento. */
export type EstadoFisiologico = "NINGUNO" | "EMBARAZO" | "LACTANCIA";

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

/**
 * Condición clínica del paciente: el vínculo (`PacienteCondicion`) trae la nota del caso y el
 * catálogo resuelto. `codigo` es la llave estable; el nombre y la descripción son del catálogo.
 */
export type CondicionFicha = {
  /** Detalle del caso (grado, control, desde cuándo). */
  notas: string | null;
  condicion: {
    codigo: string;
    nombre: string;
    /** Qué implica esta condición en el plan. */
    descripcion: string | null;
  };
};

/** Restricción alimentaria del paciente (`PacienteRestriccion` + catálogo). */
export type RestriccionFicha = {
  restriccion: {
    codigo: string;
    nombre: string;
    descripcion: string | null;
  };
};

/**
 * Medicamento del paciente. Un `DELETE` es **baja lógica**: llega con `activo: false` y se muestra
 * atenuado (`docs/contexto-api.md`).
 */
export type MedicacionFicha = {
  id: string;
  nombre: string;
  dosis: string | null;
  frecuencia: string | null;
  activo: boolean;
};

/** `situacion` de la ficha: todo lo clínico que el alta captura (spec S1). */
export type SituacionFicha = {
  estadoFisiologico: EstadoFisiologico | null;
  condiciones: CondicionFicha[];
  restricciones: RestriccionFicha[];
  medicacion: MedicacionFicha[];
  alergias: string | null;
  cirugias: string | null;
  suplementos: string | null;
  motivoConsulta: string | null;
};

/** `habitos` de la ficha: tres números y cuatro textos, todos nullable. */
export type HabitosFicha = {
  comidasAlDia: number | null;
  aguaLitros: number | null;
  horasSueno: number | null;
  alcohol: string | null;
  tabaco: string | null;
  quienCocina: string | null;
  presupuesto: string | null;
};

export type FichaPaciente = {
  paciente: PacienteFicha;
  cabecera: CabeceraFicha;
  progreso: ProgresoFicha;
  situacion: SituacionFicha;
  habitos: HabitosFicha;
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

/** `fuente` es un enum de la API: de dónde salió la medición. */
export type FuenteMedicion = "MANUAL" | "BASCULA" | "INBODY" | "OMRON" | "OTRO";

/**
 * Fila de `GET /pacientes/{id}/mediciones`: la lista completa, sin paginar y sin los puntos
 * resumidos de `evolucion` (spec S2). `fecha` es una fecha de calendario (medianoche UTC):
 * formatearla con `fechaCorta` de `@/lib/format`, que usa UTC por default (spec S4).
 */
export type Medicion = {
  id: string;
  /** Fecha de calendario (medianoche UTC), no un instante. */
  fecha: string;
  pesoKg: number | null;
  tallaCm: number | null;
  pctGrasa: number | null;
  cinturaCm: number | null;
  masaMuscularKg: number | null;
  masaGrasaKg: number | null;
  /** Nivel 1-20 que reporta el equipo de bioimpedancia. */
  grasaVisceral: number | null;
  aguaIntracelularL: number | null;
  aguaExtracelularL: number | null;
  anguloFase: number | null;
  pliegueTricipitalMm: number | null;
  pliegueSubescapularMm: number | null;
  pliegueSuprailiacoMm: number | null;
  pliegueBicipitalMm: number | null;
  perimetroBrazoCm: number | null;
  perimetroCaderaCm: number | null;
  perimetroMusloCm: number | null;
  presionSistolica: number | null;
  presionDiastolica: number | null;
  fuente: FuenteMedicion;
  notas: string | null;
  /** Lo calcula la API (`peso / talla²`), no el portal. */
  imc: number | null;
};

/** Historial completo del paciente, más viejo primero: ordenar acá si se muestra al revés. */
export function getMediciones(id: string) {
  return apiGet<Medicion[]>(`/pacientes/${encodeURIComponent(id)}/mediciones`);
}

/**
 * Elemento de `GET /condiciones` y `GET /restricciones`. El alta guarda el `codigo`, no el `id`
 * (regla 4 de docs/contexto-api.md).
 */
export type OpcionCatalogo = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
};

/**
 * Cuerpo de `POST /pacientes`: 4 obligatorios y 20 opcionales (L3 de odd/tasks/pacientes-alta.md).
 * Las fechas son de calendario (`YYYY-MM-DD`) y los catálogos van por código.
 */
export type CrearPacienteInput = {
  nombre: string;
  apellido: string;
  sexo: Sexo;
  /** Fecha de calendario `YYYY-MM-DD`. */
  fechaNacimiento: string;
  correo?: string;
  telefono?: string;
  nivelActividad?: NivelActividad;
  meta?: Meta;
  notas?: string;
  /** Códigos del catálogo `GET /restricciones`. */
  restricciones?: string[];
  /** 20-400. */
  pesoObjetivoKg?: number;
  /** Fecha de calendario `YYYY-MM-DD`. */
  fechaObjetivo?: string;
  estadoFisiologico?: EstadoFisiologico;
  motivoConsulta?: string;
  alergias?: string;
  cirugias?: string;
  suplementos?: string;
  /** 1-12. */
  comidasAlDia?: number;
  /** 0.2-10. */
  aguaLitros?: number;
  /** 0-24. */
  horasSueno?: number;
  alcohol?: string;
  tabaco?: string;
  quienCocina?: string;
  presupuesto?: string;
  /** Códigos del catálogo `GET /condiciones`. */
  condiciones?: string[];
};

/**
 * Respuesta de `POST /pacientes` (201). Se tipa lo que el alta necesita para navegar a la ficha;
 * la API devuelve el paciente completo.
 */
export type PacienteCreado = {
  id: string;
  nombre?: string;
  apellido?: string;
  correo?: string | null;
};

/** Un 400 trae el detalle de validación en `ApiError.detalle`; un 409, el correo duplicado. */
export function crearPaciente(input: CrearPacienteInput) {
  return apiPost<PacienteCreado>("/pacientes", input);
}

/** Catálogo de condiciones clínicas (20 en la semilla), por `codigo`. */
export function getCondiciones() {
  return apiGet<OpcionCatalogo[]>("/condiciones");
}

/** Catálogo de restricciones alimentarias (6 en la semilla), por `codigo`. */
export function getRestricciones() {
  return apiGet<OpcionCatalogo[]>("/restricciones");
}
