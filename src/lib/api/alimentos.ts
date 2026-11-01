import { apiGet, apiPatch, apiPost } from "./client";

/**
 * `Categoria` es un enum de la API: agrupa el alimento en el catálogo y es obligatoria al crearlo.
 * Los `value` son exactamente los del API; la traducción vive en `@/lib/alimentos-form`.
 */
export type Categoria =
  | "PLATO_TIPICO"
  | "PROTEINA"
  | "CEREAL_TUBERCULO"
  | "LEGUMINOSA"
  | "LACTEO"
  | "FRUTA"
  | "VERDURA"
  | "GRASA"
  | "BEBIDA";

/** `TipoComida` es un enum de la API y va como lista: un alimento puede servir para varios tiempos. */
export type TipoComida = "DESAYUNO" | "MERIENDA_AM" | "ALMUERZO" | "MERIENDA_PM" | "CENA";

/**
 * Fila de `GET /alimentos`: el catálogo completo, sin paginar y ya con la tabla de la **versión
 * vigente** aplanada. Los campos opcionales del alta llegan como `null` cuando nadie los cargó.
 */
export type Alimento = {
  id: string;
  nombre: string;
  categoria: Categoria;
  tiposComida: TipoComida[];
  porcionDescripcion: string;
  /** 1-2000 gramos. */
  porcionGramos: number;
  /** 0-3000 kcal. */
  kcal: number;
  proteinaG: number;
  carbohidratoG: number;
  grasaG: number;
  fibraG: number | null;
  /** Etiquetas de `GET /restricciones` (cerdo, gluten, huevo, lactosa, mani, mariscos). */
  contiene: string[];
  esTipicoHn: boolean;
  fuente: string | null;
  activo: boolean;
};

/**
 * Filtros de `GET /alimentos` (spec S2). Se mandan al API, no se aplican en memoria: `excluir` es
 * semántica clínica (sacar del listado los alimentos con ciertas etiquetas), no cosmética.
 */
export type FiltrosAlimentos = {
  /** Búsqueda por nombre. */
  q?: string;
  categoria?: Categoria;
  tipoComida?: TipoComida;
  /** Solo los marcados como típicos hondureños. */
  soloTipicos?: boolean;
  /** Etiquetas de restricción a excluir; se mandan separadas por coma. */
  excluir?: string[];
};

/**
 * Arma la query string omitiendo los filtros vacíos: un `q` en blanco, un `excluir` sin etiquetas o
 * un `soloTipicos` apagado no viajan al API.
 */
export function getAlimentos(filtros: FiltrosAlimentos = {}) {
  const params = new URLSearchParams();

  const q = filtros.q?.trim();

  if (q !== undefined && q.length > 0) params.set("q", q);
  if (filtros.categoria !== undefined) params.set("categoria", filtros.categoria);
  if (filtros.tipoComida !== undefined) params.set("tipoComida", filtros.tipoComida);
  if (filtros.soloTipicos === true) params.set("soloTipicos", "true");

  const excluir = (filtros.excluir ?? [])
    .map((etiqueta) => etiqueta.trim())
    .filter((etiqueta) => etiqueta.length > 0);

  if (excluir.length > 0) params.set("excluir", excluir.join(","));

  const query = params.toString();

  return apiGet<Alimento[]>(query.length > 0 ? `/alimentos?${query}` : "/alimentos");
}

/** Detalle de `GET /alimentos/{id}`. La API responde 404 si el alimento no existe. */
export function getAlimento(id: string) {
  return apiGet<Alimento>(`/alimentos/${encodeURIComponent(id)}`);
}

/**
 * Fila de `GET /alimentos/{id}/versiones`, con la forma **plana** del API: los nutrientes son
 * hermanos de `version`, no van anidados. Editar un alimento cierra la vigente y abre una nueva,
 * así que esta fila es lo que queda congelado para los planes ya generados (spec S5).
 */
export type AlimentoVersion = {
  version: number;
  /** Instante ISO con zona. */
  vigenteDesde: string;
  /** `null` en la versión vigente. */
  vigenteHasta: string | null;
  /** Revisión de la tabla de composición usada (por ejemplo `"Inicial"`), no un contenedor. */
  tabla: string;
  fuente: string | null;
  porcionDescripcion: string;
  porcionGramos: number;
  kcal: number;
  proteinaG: number;
  carbohidratoG: number;
  grasaG: number;
  fibraG: number | null;
  sodioMg: number | null;
  potasioMg: number | null;
  fosforoMg: number | null;
  azucaresG: number | null;
  grasasSatG: number | null;
  indiceGlucemico: number | null;
};

/** El historial completo, más viejo primero. */
export type VersionesAlimento = AlimentoVersion[];

export function getVersiones(id: string) {
  return apiGet<VersionesAlimento>(`/alimentos/${encodeURIComponent(id)}/versiones`);
}

/**
 * Cuerpo de `POST /alimentos`: 9 obligatorios y 11 opcionales (spec S3). Los numéricos van como
 * número y `contiene` lleva las etiquetas de `GET /restricciones`.
 */
export type CrearAlimentoInput = {
  nombre: string;
  categoria: Categoria;
  /** Por ejemplo "1 taza cocida". */
  porcionDescripcion: string;
  /** 1-2000. */
  porcionGramos: number;
  /** 0-3000. */
  kcal: number;
  proteinaG: number;
  carbohidratoG: number;
  grasaG: number;
  tiposComida: TipoComida[];
  fibraG?: number;
  sodioMg?: number;
  potasioMg?: number;
  fosforoMg?: number;
  azucaresG?: number;
  grasasSatG?: number;
  indiceGlucemico?: number;
  contiene?: string[];
  esTipicoHn?: boolean;
  fuente?: string;
};

/**
 * Cuerpo de `PATCH /alimentos/{id}`: los mismos 20 campos y **ninguno requerido** (spec S4), así
 * que se manda solo lo que cambió (ver `armarPayloadPatch` en `@/lib/alimentos-form`).
 */
export type ActualizarAlimentoInput = Partial<CrearAlimentoInput>;

/** Un 400 trae el detalle de validación en `ApiError.detalle`; un 409, el nombre duplicado. */
export function crearAlimento(input: CrearAlimentoInput) {
  return apiPost<Alimento>("/alimentos", input);
}

/** Guardar cambios cierra la versión vigente y crea una nueva (spec S5). */
export function actualizarAlimento(id: string, cambios: ActualizarAlimentoInput) {
  return apiPatch<Alimento>(`/alimentos/${encodeURIComponent(id)}`, cambios);
}
