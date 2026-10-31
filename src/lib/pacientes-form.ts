/**
 * Lógica pura del alta de paciente: etiquetas de los enums, pasos del formulario, validación por
 * paso y armado del payload de `POST /pacientes`.
 *
 * Sin React, sin API y sin `next/headers` (solo `import type` de los tipos del API): todo se testea
 * en `node` (spec S7, convención de odd/tasks/tests.md S2). La misma validación corre en el cliente
 * (para guiar) y otra vez en la Server Action (nunca se confía en el cliente).
 */

import type {
  CrearPacienteInput,
  EstadoFisiologico,
  Meta,
  NivelActividad,
  Sexo,
} from "./api/pacientes";

type Opcion<T extends string> = { value: T; label: string };

/** Valores exactos de la API; solo se traduce la etiqueta (spec S2). */
export const SEXO_OPCIONES: Opcion<Sexo>[] = [
  { value: "F", label: "Femenino" },
  { value: "M", label: "Masculino" },
];

export const NIVEL_ACTIVIDAD_OPCIONES: Opcion<NivelActividad>[] = [
  { value: "SEDENTARIO", label: "Sedentario" },
  { value: "LIGERO", label: "Ligero" },
  { value: "MODERADO", label: "Moderado" },
  { value: "INTENSO", label: "Intenso" },
  { value: "MUY_INTENSO", label: "Muy intenso" },
];

export const META_OPCIONES: Opcion<Meta>[] = [
  { value: "BAJAR", label: "Bajar de peso" },
  { value: "MANTENER", label: "Mantener el peso" },
  { value: "SUBIR", label: "Subir de peso" },
];

export const ESTADO_FISIOLOGICO_OPCIONES: Opcion<EstadoFisiologico>[] = [
  { value: "NINGUNO", label: "Ninguno" },
  { value: "EMBARAZO", label: "Embarazo" },
  { value: "LACTANCIA", label: "Lactancia" },
];

/**
 * Lo que el formulario tiene en los inputs: todo texto (tal como lo escribe el nutricionista) y los
 * dos catálogos como arrays de códigos. La conversión a los tipos del API la hace `armarPayload`.
 */
export type ValoresPaciente = {
  nombre?: string;
  apellido?: string;
  sexo?: string;
  fechaNacimiento?: string;
  correo?: string;
  telefono?: string;
  nivelActividad?: string;
  meta?: string;
  notas?: string;
  restricciones?: string[];
  pesoObjetivoKg?: string;
  fechaObjetivo?: string;
  estadoFisiologico?: string;
  motivoConsulta?: string;
  alergias?: string;
  cirugias?: string;
  suplementos?: string;
  comidasAlDia?: string;
  aguaLitros?: string;
  horasSueno?: string;
  alcohol?: string;
  tabaco?: string;
  quienCocina?: string;
  presupuesto?: string;
  condiciones?: string[];
};

/** Los 25 campos del contrato (S2), nombrados igual que en el API. */
export type CampoPaciente = keyof ValoresPaciente;

export type PasoId = "identificacion" | "objetivo" | "condiciones" | "habitos";

export type Paso = {
  id: PasoId;
  titulo: string;
  campos: readonly CampoPaciente[];
};

/**
 * Los cuatro pasos como dato: la UI los recorre, no los repite a mano (spec S1, T3).
 */
export const PASOS: readonly Paso[] = [
  {
    id: "identificacion",
    titulo: "Identificación",
    campos: ["nombre", "apellido", "sexo", "fechaNacimiento", "correo", "telefono"],
  },
  {
    id: "objetivo",
    titulo: "Objetivo",
    campos: ["meta", "pesoObjetivoKg", "fechaObjetivo", "estadoFisiologico", "motivoConsulta"],
  },
  {
    id: "condiciones",
    titulo: "Condiciones y restricciones",
    campos: ["condiciones", "restricciones"],
  },
  {
    id: "habitos",
    titulo: "Hábitos y antecedentes",
    campos: [
      "nivelActividad",
      "comidasAlDia",
      "aguaLitros",
      "horasSueno",
      "alcohol",
      "tabaco",
      "quienCocina",
      "presupuesto",
      "suplementos",
      "alergias",
      "cirugias",
      "notas",
    ],
  },
];

/** Honduras no tiene horario de verano: GMT-6 todo el año. */
const TIME_ZONE = "America/Tegucigalpa";

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Un correo suficientemente razonable: algo@algo.tld, sin espacios. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** El día de hoy en Honduras como `YYYY-MM-DD`. La regla 1 dice que el día UTC se adelanta. */
export function hoyEnHonduras(now: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).formatToParts(now);

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/** `YYYY-MM-DD` que además existe en el calendario (rechaza `2026-02-30`). */
function esFechaValida(texto: string): boolean {
  if (!FECHA_ISO.test(texto)) return false;

  const [anio, mes, dia] = texto.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  );
}

/** `undefined` cuando el input está vacío: así el payload no manda `""`. */
function texto(valor: string | undefined): string | undefined {
  const limpio = (valor ?? "").trim();

  return limpio.length > 0 ? limpio : undefined;
}

/** `undefined` cuando está vacío o no es numérico; el rango se valida aparte. */
function numero(valor: string | undefined): number | undefined {
  const limpio = texto(valor);

  if (limpio === undefined) return undefined;

  const parseado = Number(limpio);

  return Number.isFinite(parseado) ? parseado : undefined;
}

function esOpcion<T extends string>(opciones: Opcion<T>[], valor: string | undefined) {
  return opciones.some((opcion) => opcion.value === valor);
}

const MENSAJES = {
  nombre: "El nombre es obligatorio.",
  apellido: "El apellido es obligatorio.",
  sexo: "Elegí el sexo.",
  sexoInvalido: "El sexo elegido no es válido.",
  fechaNacimiento: "La fecha de nacimiento es obligatoria.",
  fechaNacimientoInvalida: "La fecha de nacimiento tiene que ser una fecha válida (AAAA-MM-DD).",
  fechaNacimientoFutura: "La fecha de nacimiento no puede ser futura.",
  correo: "El correo no tiene un formato válido.",
  fechaObjetivo: "La fecha objetivo tiene que ser una fecha válida (AAAA-MM-DD).",
  meta: "La meta elegida no es válida.",
  estadoFisiologico: "El estado fisiológico elegido no es válido.",
  nivelActividad: "El nivel de actividad elegido no es válido.",
  pesoObjetivoKg: {
    numero: "El peso objetivo tiene que ser un número.",
    rango: "El peso objetivo tiene que estar entre 20 y 400 kg.",
  },
  comidasAlDia: {
    numero: "Las comidas al día tienen que ser un número.",
    rango: "Las comidas al día tienen que estar entre 1 y 12.",
  },
  aguaLitros: {
    numero: "El consumo de agua tiene que ser un número.",
    rango: "El consumo de agua tiene que estar entre 0.2 y 10 litros.",
  },
  horasSueno: {
    numero: "Las horas de sueño tienen que ser un número.",
    rango: "Las horas de sueño tienen que estar entre 0 y 24.",
  },
} as const;

/** Valida un numérico opcional: primero que sea número, después el rango inclusivo. */
function validarNumero(
  valor: string | undefined,
  rango: { min: number; max: number },
  mensajes: { numero: string; rango: string },
): string | undefined {
  const crudo = texto(valor);

  if (crudo === undefined) return undefined;

  const parseado = numero(crudo);

  if (parseado === undefined) return mensajes.numero;
  if (parseado < rango.min || parseado > rango.max) return mensajes.rango;

  return undefined;
}

function validarIdentificacion(valores: ValoresPaciente, hoy: string): Record<string, string> {
  const errores: Record<string, string> = {};

  if (texto(valores.nombre) === undefined) errores.nombre = MENSAJES.nombre;
  if (texto(valores.apellido) === undefined) errores.apellido = MENSAJES.apellido;

  const sexo = texto(valores.sexo);

  if (sexo === undefined) errores.sexo = MENSAJES.sexo;
  else if (!esOpcion(SEXO_OPCIONES, sexo)) errores.sexo = MENSAJES.sexoInvalido;

  const fechaNacimiento = texto(valores.fechaNacimiento);

  if (fechaNacimiento === undefined) errores.fechaNacimiento = MENSAJES.fechaNacimiento;
  else if (!esFechaValida(fechaNacimiento)) {
    errores.fechaNacimiento = MENSAJES.fechaNacimientoInvalida;
  } else if (fechaNacimiento > hoy) {
    // Comparar `YYYY-MM-DD` como texto equivale a comparar fechas.
    errores.fechaNacimiento = MENSAJES.fechaNacimientoFutura;
  }

  const correo = texto(valores.correo);

  if (correo !== undefined && !CORREO.test(correo)) errores.correo = MENSAJES.correo;

  return errores;
}

function validarObjetivo(valores: ValoresPaciente): Record<string, string> {
  const errores: Record<string, string> = {};

  const meta = texto(valores.meta);

  if (meta !== undefined && !esOpcion(META_OPCIONES, meta)) errores.meta = MENSAJES.meta;

  const estadoFisiologico = texto(valores.estadoFisiologico);

  if (estadoFisiologico !== undefined && !esOpcion(ESTADO_FISIOLOGICO_OPCIONES, estadoFisiologico)) {
    errores.estadoFisiologico = MENSAJES.estadoFisiologico;
  }

  const pesoObjetivoKg = validarNumero(
    valores.pesoObjetivoKg,
    { min: 20, max: 400 },
    MENSAJES.pesoObjetivoKg,
  );

  if (pesoObjetivoKg !== undefined) errores.pesoObjetivoKg = pesoObjetivoKg;

  const fechaObjetivo = texto(valores.fechaObjetivo);

  if (fechaObjetivo !== undefined && !esFechaValida(fechaObjetivo)) {
    errores.fechaObjetivo = MENSAJES.fechaObjetivo;
  }

  return errores;
}

function validarHabitos(valores: ValoresPaciente): Record<string, string> {
  const errores: Record<string, string> = {};

  const nivelActividad = texto(valores.nivelActividad);

  if (nivelActividad !== undefined && !esOpcion(NIVEL_ACTIVIDAD_OPCIONES, nivelActividad)) {
    errores.nivelActividad = MENSAJES.nivelActividad;
  }

  // Los bordes son inclusivos y coinciden con los rangos del swagger (L3).
  const reglas: { campo: CampoPaciente; min: number; max: number; mensajes: { numero: string; rango: string } }[] = [
    { campo: "comidasAlDia", min: 1, max: 12, mensajes: MENSAJES.comidasAlDia },
    { campo: "aguaLitros", min: 0.2, max: 10, mensajes: MENSAJES.aguaLitros },
    { campo: "horasSueno", min: 0, max: 24, mensajes: MENSAJES.horasSueno },
  ];

  for (const { campo, min, max, mensajes } of reglas) {
    const mensaje = validarNumero(valores[campo] as string | undefined, { min, max }, mensajes);

    if (mensaje !== undefined) errores[campo] = mensaje;
  }

  return errores;
}

/**
 * Errores por campo del paso; un objeto vacío significa que el paso está listo. `hoy` se puede fijar
 * para que el resultado sea determinista en tests; en la app es el día de Honduras.
 */
export function validarPaso(
  pasoId: PasoId,
  valores: ValoresPaciente,
  hoy: string = hoyEnHonduras(),
): Record<string, string> {
  switch (pasoId) {
    case "identificacion":
      return validarIdentificacion(valores, hoy);
    case "objetivo":
      return validarObjetivo(valores);
    case "condiciones":
      // Elegir condiciones y restricciones es opcional: no hay reglas que romper.
      return {};
    case "habitos":
      return validarHabitos(valores);
    default:
      return {};
  }
}

/** Todos los pasos juntos: la Server Action revalida con esto antes de llamar al API (T4). */
export function validarFormulario(
  valores: ValoresPaciente,
  hoy: string = hoyEnHonduras(),
): Record<string, string> {
  return PASOS.reduce<Record<string, string>>(
    (errores, paso) => ({ ...errores, ...validarPaso(paso.id, valores, hoy) }),
    {},
  );
}

/**
 * Lo que devuelve la Server Action de alta. Vive acá y no en el archivo `"use server"` porque ese
 * módulo solo puede exportar funciones async; el camino feliz ni siquiera vuelve (ver `redirect`).
 */
export type ResultadoAlta =
  | { ok: true }
  | { ok: false; error: string; errores?: Record<string, string> };

/**
 * Payload de `POST /pacientes`. Omite lo vacío (un `""` o un array vacío no se mandan) y convierte
 * los numéricos a `number`. Los obligatorios se asumen ya validados con `validarFormulario`.
 */
export function armarPayload(valores: ValoresPaciente): CrearPacienteInput {
  const payload: Record<string, unknown> = {};

  const poner = (campo: string, valor: unknown) => {
    if (valor !== undefined) payload[campo] = valor;
  };

  poner("nombre", texto(valores.nombre));
  poner("apellido", texto(valores.apellido));
  poner("sexo", texto(valores.sexo));
  poner("fechaNacimiento", texto(valores.fechaNacimiento));
  poner("correo", texto(valores.correo));
  poner("telefono", texto(valores.telefono));
  poner("nivelActividad", texto(valores.nivelActividad));
  poner("meta", texto(valores.meta));
  poner("notas", texto(valores.notas));
  poner("pesoObjetivoKg", numero(valores.pesoObjetivoKg));
  poner("fechaObjetivo", texto(valores.fechaObjetivo));
  poner("estadoFisiologico", texto(valores.estadoFisiologico));
  poner("motivoConsulta", texto(valores.motivoConsulta));
  poner("alergias", texto(valores.alergias));
  poner("cirugias", texto(valores.cirugias));
  poner("suplementos", texto(valores.suplementos));
  poner("comidasAlDia", numero(valores.comidasAlDia));
  poner("aguaLitros", numero(valores.aguaLitros));
  poner("horasSueno", numero(valores.horasSueno));
  poner("alcohol", texto(valores.alcohol));
  poner("tabaco", texto(valores.tabaco));
  poner("quienCocina", texto(valores.quienCocina));
  poner("presupuesto", texto(valores.presupuesto));

  const condiciones = (valores.condiciones ?? []).filter((codigo) => codigo.trim().length > 0);

  if (condiciones.length > 0) payload.condiciones = condiciones;

  const restricciones = (valores.restricciones ?? []).filter((codigo) => codigo.trim().length > 0);

  if (restricciones.length > 0) payload.restricciones = restricciones;

  // Los 25 campos ya están normalizados arriba; el cast solo completa el tipado del contrato.
  return payload as CrearPacienteInput;
}