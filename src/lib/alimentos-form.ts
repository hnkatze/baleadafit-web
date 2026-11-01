/**
 * Lógica pura del catálogo de alimentos: etiquetas de los enums, validación con los rangos
 * observados, armado del payload de `POST /alimentos` y del diff de `PATCH /alimentos/{id}`.
 *
 * Sin React, sin API y sin `next/headers` (solo `import type` de los tipos del API): todo se testea
 * en `node` (spec S7, convención de odd/tasks/tests.md S2). La misma validación corre en el cliente
 * (para guiar) y otra vez en la Server Action (nunca se confía en el cliente).
 */

import type {
  ActualizarAlimentoInput,
  Alimento,
  AlimentoVersion,
  Categoria,
  CrearAlimentoInput,
  TipoComida,
} from "./api/alimentos";

type Opcion<T extends string> = { value: T; label: string };

/** Valores exactos de la API; solo se traduce la etiqueta (spec S3). */
export const CATEGORIA_OPCIONES: Opcion<Categoria>[] = [
  { value: "PLATO_TIPICO", label: "Plato típico" },
  { value: "PROTEINA", label: "Proteína" },
  { value: "CEREAL_TUBERCULO", label: "Cereal o tubérculo" },
  { value: "LEGUMINOSA", label: "Leguminosa" },
  { value: "LACTEO", label: "Lácteo" },
  { value: "FRUTA", label: "Fruta" },
  { value: "VERDURA", label: "Verdura" },
  { value: "GRASA", label: "Grasa" },
  { value: "BEBIDA", label: "Bebida" },
];

export const TIPO_COMIDA_OPCIONES: Opcion<TipoComida>[] = [
  { value: "DESAYUNO", label: "Desayuno" },
  { value: "MERIENDA_AM", label: "Merienda de la mañana" },
  { value: "ALMUERZO", label: "Almuerzo" },
  { value: "MERIENDA_PM", label: "Merienda de la tarde" },
  { value: "CENA", label: "Cena" },
];

/**
 * Lo que el formulario tiene en los inputs: todo texto (tal como lo escribe el nutricionista), los
 * dos enums como texto, `tiposComida` y `contiene` como arrays de valores del API y `esTipicoHn`
 * como checkbox. La conversión a los tipos del API la hacen `armarPayloadAlta`/`armarPayloadPatch`.
 */
export type ValoresAlimento = {
  nombre?: string;
  categoria?: string;
  porcionDescripcion?: string;
  porcionGramos?: string;
  kcal?: string;
  proteinaG?: string;
  carbohidratoG?: string;
  grasaG?: string;
  fibraG?: string;
  sodioMg?: string;
  potasioMg?: string;
  fosforoMg?: string;
  azucaresG?: string;
  grasasSatG?: string;
  indiceGlucemico?: string;
  tiposComida?: string[];
  /** Etiquetas de `GET /restricciones`. */
  contiene?: string[];
  esTipicoHn?: boolean;
  fuente?: string;
};

/**
 * Los valores del formulario de **edición**: misma forma que `ValoresAlimento`, pero además el
 * valor original con el que se compara el diff de `PATCH /alimentos/{id}` (spec S4).
 */
export type ValoresEdicion = ValoresAlimento;

/**
 * Lo que devuelven las Server Actions del catálogo. Vive acá y no en el archivo `"use server"`
 * porque ese módulo solo puede exportar funciones async; el camino feliz ni siquiera vuelve
 * (ver `redirect`). `sinCambios` es el caso de la edición que no tocó nada: no se llama al API.
 */
export type ResultadoAlimento =
  | { ok: true; sinCambios: boolean }
  | { ok: false; error: string; errores?: Record<string, string> };

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

/** Las listas del formulario, sin entradas en blanco. */
function lista(valores: string[] | undefined): string[] {
  return (valores ?? []).map((valor) => valor.trim()).filter((valor) => valor.length > 0);
}

/** Huella para comparar listas sin importar el orden en que el formulario las tenga. */
function huella(valores: string[]): string {
  return [...valores].sort().join(",");
}

/**
 * Número de la ficha → texto del input. `null`/`undefined` quedan en blanco (nunca `"null"`), y un
 * campo vacío no viaja al `PATCH` porque `numero("")` es `undefined`.
 */
function textoNumero(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

/**
 * Valores iniciales del formulario con los datos de la ficha del alimento: los campos de
 * identificación salen del alimento y los nutrientes de la **versión vigente**, que es la tabla de
 * composición congelada (`GET /alimentos/{id}` no trae los micronutrientes). Sin versiones cargadas
 * se usan los del alimento, que es todo lo que hay.
 *
 * Sirve para el alta y para la edición: en edición estos valores son también los `originales` contra
 * los que `armarPayloadPatch` arma el diff (spec S4).
 */
export function valoresDeAlimento(
  alimento: Alimento,
  version: AlimentoVersion | null,
): ValoresAlimento {
  return {
    nombre: alimento.nombre,
    categoria: alimento.categoria,
    porcionDescripcion: version?.porcionDescripcion ?? alimento.porcionDescripcion,
    porcionGramos: textoNumero(version?.porcionGramos ?? alimento.porcionGramos),
    kcal: textoNumero(version?.kcal ?? alimento.kcal),
    proteinaG: textoNumero(version?.proteinaG ?? alimento.proteinaG),
    carbohidratoG: textoNumero(version?.carbohidratoG ?? alimento.carbohidratoG),
    grasaG: textoNumero(version?.grasaG ?? alimento.grasaG),
    fibraG: textoNumero(version === null ? alimento.fibraG : version.fibraG),
    sodioMg: textoNumero(version?.sodioMg),
    potasioMg: textoNumero(version?.potasioMg),
    fosforoMg: textoNumero(version?.fosforoMg),
    azucaresG: textoNumero(version?.azucaresG),
    grasasSatG: textoNumero(version?.grasasSatG),
    indiceGlucemico: textoNumero(version?.indiceGlucemico),
    tiposComida: [...alimento.tiposComida],
    contiene: [...alimento.contiene],
    esTipicoHn: alimento.esTipicoHn,
    fuente: alimento.fuente ?? undefined,
  };
}

function esOpcion<T extends string>(opciones: Opcion<T>[], valor: string | undefined) {
  return opciones.some((opcion) => opcion.value === valor);
}

type MensajesNumerico = {
  /** Solo en los obligatorios. */
  vacio?: string;
  numero: string;
  /** Solo cuando hay tope. */
  rango?: string;
  /** Solo cuando el piso es 0 y no hay tope. */
  negativo?: string;
};

type ReglaNumerica = {
  campo: CampoNumerico;
  /** Los 5 obligatorios del alta; los opcionales vacíos no son error. */
  obligatorio: boolean;
  /** Piso inclusivo: 1 para la porción, 0 para el resto. */
  min: number;
  /** Tope inclusivo, cuando el contrato lo fija (porción 2000, kcal 3000). */
  max?: number;
  mensajes: MensajesNumerico;
};

type CampoNumerico =
  | "porcionGramos"
  | "kcal"
  | "proteinaG"
  | "carbohidratoG"
  | "grasaG"
  | "fibraG"
  | "sodioMg"
  | "potasioMg"
  | "fosforoMg"
  | "azucaresG"
  | "grasasSatG"
  | "indiceGlucemico";

/** Los 12 numéricos del contrato, con los rangos observados en el API. */
const REGLAS_NUMERICAS: ReglaNumerica[] = [
  {
    campo: "porcionGramos",
    obligatorio: true,
    min: 1,
    max: 2000,
    mensajes: {
      vacio: "La porción es obligatoria.",
      numero: "La porción tiene que ser un número.",
      rango: "La porción tiene que estar entre 1 y 2000 gramos.",
    },
  },
  {
    campo: "kcal",
    obligatorio: true,
    min: 0,
    max: 3000,
    mensajes: {
      vacio: "Las calorías son obligatorias.",
      numero: "Las calorías tienen que ser un número.",
      rango: "Las calorías tienen que estar entre 0 y 3000.",
    },
  },
  {
    campo: "proteinaG",
    obligatorio: true,
    min: 0,
    mensajes: {
      vacio: "La proteína es obligatoria.",
      numero: "La proteína tiene que ser un número.",
      negativo: "La proteína no puede ser negativa.",
    },
  },
  {
    campo: "carbohidratoG",
    obligatorio: true,
    min: 0,
    mensajes: {
      vacio: "Los carbohidratos son obligatorios.",
      numero: "Los carbohidratos tienen que ser un número.",
      negativo: "Los carbohidratos no pueden ser negativos.",
    },
  },
  {
    campo: "grasaG",
    obligatorio: true,
    min: 0,
    mensajes: {
      vacio: "La grasa es obligatoria.",
      numero: "La grasa tiene que ser un número.",
      negativo: "La grasa no puede ser negativa.",
    },
  },
  {
    campo: "fibraG",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "La fibra tiene que ser un número.",
      negativo: "La fibra no puede ser negativa.",
    },
  },
  {
    campo: "sodioMg",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "El sodio tiene que ser un número.",
      negativo: "El sodio no puede ser negativo.",
    },
  },
  {
    campo: "potasioMg",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "El potasio tiene que ser un número.",
      negativo: "El potasio no puede ser negativo.",
    },
  },
  {
    campo: "fosforoMg",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "El fósforo tiene que ser un número.",
      negativo: "El fósforo no puede ser negativo.",
    },
  },
  {
    campo: "azucaresG",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "Los azúcares tienen que ser un número.",
      negativo: "Los azúcares no pueden ser negativos.",
    },
  },
  {
    campo: "grasasSatG",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "Las grasas saturadas tienen que ser un número.",
      negativo: "Las grasas saturadas no pueden ser negativas.",
    },
  },
  {
    campo: "indiceGlucemico",
    obligatorio: false,
    min: 0,
    mensajes: {
      numero: "El índice glucémico tiene que ser un número.",
      negativo: "El índice glucémico no puede ser negativo.",
    },
  },
];

const MENSAJES = {
  nombre: "El nombre es obligatorio.",
  nombreCorto: "El nombre tiene que tener al menos 2 caracteres.",
  categoria: "Elegí la categoría.",
  categoriaInvalida: "La categoría elegida no es válida.",
  porcionDescripcion: "La descripción de la porción es obligatoria.",
  tiposComida: "Elegí al menos un tiempo de comida.",
} as const;

/** Largo mínimo del nombre: dos letras ya son un nombre, una sola es un error de tipeo. */
const NOMBRE_MINIMO = 2;

/** Valida un numérico: primero que sea número, después el piso y el tope inclusivos. */
function validarNumerico(valor: string | undefined, regla: ReglaNumerica): string | undefined {
  const crudo = texto(valor);

  if (crudo === undefined) return regla.obligatorio ? regla.mensajes.vacio : undefined;

  const parseado = numero(crudo);

  if (parseado === undefined) return regla.mensajes.numero;

  if (regla.max !== undefined) {
    if (parseado < regla.min || parseado > regla.max) {
      return regla.mensajes.rango ?? regla.mensajes.numero;
    }

    return undefined;
  }

  if (parseado < regla.min) return regla.mensajes.negativo ?? regla.mensajes.numero;

  return undefined;
}

/**
 * Errores por campo: un objeto vacío significa que el alimento está listo para guardar. Los 9
 * obligatorios del `POST` más los rangos de los numéricos (spec S3).
 */
export function validarAlimento(valores: ValoresAlimento): Record<string, string> {
  const errores: Record<string, string> = {};

  const nombre = texto(valores.nombre);

  if (nombre === undefined) errores.nombre = MENSAJES.nombre;
  else if (nombre.length < NOMBRE_MINIMO) errores.nombre = MENSAJES.nombreCorto;

  const categoria = texto(valores.categoria);

  if (categoria === undefined) errores.categoria = MENSAJES.categoria;
  else if (!esOpcion(CATEGORIA_OPCIONES, categoria)) errores.categoria = MENSAJES.categoriaInvalida;

  if (texto(valores.porcionDescripcion) === undefined) {
    errores.porcionDescripcion = MENSAJES.porcionDescripcion;
  }

  for (const regla of REGLAS_NUMERICAS) {
    const mensaje = validarNumerico(valores[regla.campo], regla);

    if (mensaje !== undefined) errores[regla.campo] = mensaje;
  }

  if (lista(valores.tiposComida).length === 0) errores.tiposComida = MENSAJES.tiposComida;

  return errores;
}

/**
 * Payload de `POST /alimentos`. Omite lo vacío (un `""` o un array vacío no se mandan) y convierte
 * los numéricos a `number`. Los obligatorios se asumen ya validados con `validarAlimento`.
 */
export function armarPayloadAlta(valores: ValoresAlimento): CrearAlimentoInput {
  const payload: Record<string, unknown> = {};

  const poner = (campo: string, valor: unknown) => {
    if (valor !== undefined) payload[campo] = valor;
  };

  poner("nombre", texto(valores.nombre));
  poner("categoria", texto(valores.categoria));
  poner("porcionDescripcion", texto(valores.porcionDescripcion));

  for (const regla of REGLAS_NUMERICAS) poner(regla.campo, numero(valores[regla.campo]));

  const tiposComida = lista(valores.tiposComida);

  if (tiposComida.length > 0) payload.tiposComida = tiposComida;

  const contiene = lista(valores.contiene);

  if (contiene.length > 0) payload.contiene = contiene;

  poner("fuente", texto(valores.fuente));

  // Un checkbox siempre tiene estado: `undefined` equivale a no marcado.
  payload.esTipicoHn = valores.esTipicoHn === true;

  // Los 20 campos ya están normalizados arriba; el cast solo completa el tipado del contrato.
  return payload as CrearAlimentoInput;
}

/** Los campos de texto del contrato (los enums viajan como texto y se comparan igual). */
type CampoTexto = "nombre" | "categoria" | "porcionDescripcion" | "fuente";

/**
 * Payload de `PATCH /alimentos/{id}`: **solo los campos que cambiaron** respecto de `original`
 * (spec S4). Compara con los tipos normalizados (texto sin espacios, numéricos como número, listas
 * sin importar el orden), así que reescribir el mismo valor no genera una versión nueva. Si no
 * cambió nada devuelve `{}` y la Server Action no llama al API.
 *
 * Un numérico que se borra no se puede expresar en el DTO (no acepta `null`), así que se omite:
 * sacar la porción o las kcal no es una edición válida de un alimento.
 */
export function armarPayloadPatch(
  original: ValoresEdicion,
  valores: ValoresAlimento,
): ActualizarAlimentoInput {
  const cambios: Record<string, unknown> = {};

  const textoCambiado = (campo: CampoTexto) => {
    const antes = texto(original[campo]);
    const ahora = texto(valores[campo]);

    if (antes !== ahora) cambios[campo] = ahora ?? "";
  };

  const numericoCambiado = (campo: CampoNumerico) => {
    const antes = numero(original[campo]);
    const ahora = numero(valores[campo]);

    if (ahora === undefined) return;
    if (antes !== ahora) cambios[campo] = ahora;
  };

  const listaCambiada = (campo: "tiposComida" | "contiene") => {
    const antes = lista(original[campo]);
    const ahora = lista(valores[campo]);

    if (huella(antes) !== huella(ahora)) cambios[campo] = ahora;
  };

  textoCambiado("nombre");
  textoCambiado("categoria");
  textoCambiado("porcionDescripcion");
  textoCambiado("fuente");

  for (const regla of REGLAS_NUMERICAS) numericoCambiado(regla.campo);

  listaCambiada("tiposComida");
  listaCambiada("contiene");

  const eraTipico = original.esTipicoHn === true;
  const esTipico = valores.esTipicoHn === true;

  if (eraTipico !== esTipico) cambios.esTipicoHn = esTipico;

  // Los campos ya están normalizados arriba; el cast solo completa el tipado del contrato.
  return cambios as ActualizarAlimentoInput;
}
