/**
 * Lógica pura de los filtros de `/alimentos` (spec S2): leer la URL a filtros de pantalla,
 * convertir esos filtros al objeto que consume `getAlimentos` y armar la query string del cliente.
 *
 * Sin React y sin `next/*` (solo `import` de las etiquetas de enums y `import type` de los tipos del
 * API): se testea en `node` (spec S7, convención de odd/tasks/tests.md S2). El filtrado **siempre**
 * lo hace la API: acá solo se decide qué parámetros viajan.
 */

import type { Categoria, FiltrosAlimentos, TipoComida } from "./api/alimentos";
import { CATEGORIA_OPCIONES, TIPO_COMIDA_OPCIONES } from "./alimentos-form";

/**
 * Los filtros tal como viven en la pantalla y en la URL. `""` y `false` significan "sin filtro":
 * la diferencia con el API es que allá el parámetro **no viaja** (ver `queryDeFiltros`).
 */
export type FiltrosActivos = {
  q: string;
  categoria: string;
  tipoComida: string;
  soloTipicos: boolean;
  excluir: string;
};

/** Ningún filtro puesto: es el estado de `/alimentos` sin query string. */
export const SIN_FILTROS: FiltrosActivos = {
  q: "",
  categoria: "",
  tipoComida: "",
  soloTipicos: false,
  excluir: "",
};

/** Los `searchParams` de Next 16: cada parámetro puede venir repetido (`?q=a&q=b`). */
export type ParametrosUrl = Record<string, string | string[] | undefined>;

/** Un parámetro repetido se queda con el primero: el API espera un solo valor por filtro. */
function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";

  return valor ?? "";
}

function esCategoria(valor: string): valor is Categoria {
  return CATEGORIA_OPCIONES.some((opcion) => opcion.value === valor);
}

function esTipoComida(valor: string): valor is TipoComida {
  return TIPO_COMIDA_OPCIONES.some((opcion) => opcion.value === valor);
}

/**
 * Etiquetas de `excluir`: la API las recibe separadas por coma y así las escribe la persona. Se
 * recortan los espacios, se descartan las comas de más y no se repite una etiqueta dos veces.
 */
export function etiquetasExcluidas(crudo: string): string[] {
  const etiquetas = crudo
    .split(",")
    .map((etiqueta) => etiqueta.trim())
    .filter((etiqueta) => etiqueta.length > 0);

  return [...new Set(etiquetas)];
}

/**
 * La URL a filtros de pantalla. Un enum que no existe **se descarta** en vez de viajar al API: el
 * listado no puede romperse por una URL escrita a mano.
 */
export function leerFiltros(params: ParametrosUrl): FiltrosActivos {
  const categoria = primerValor(params.categoria).trim();
  const tipoComida = primerValor(params.tipoComida).trim();

  return {
    q: primerValor(params.q).trim(),
    categoria: esCategoria(categoria) ? categoria : "",
    tipoComida: esTipoComida(tipoComida) ? tipoComida : "",
    soloTipicos: primerValor(params.soloTipicos) === "true",
    excluir: etiquetasExcluidas(primerValor(params.excluir)).join(", "),
  };
}

/** Los filtros de pantalla a los filtros de `GET /alimentos`, sin los que están vacíos. */
export function filtrosDeApi(filtros: FiltrosActivos): FiltrosAlimentos {
  const api: FiltrosAlimentos = {};

  if (filtros.q.length > 0) api.q = filtros.q;
  if (esCategoria(filtros.categoria)) api.categoria = filtros.categoria;
  if (esTipoComida(filtros.tipoComida)) api.tipoComida = filtros.tipoComida;
  if (filtros.soloTipicos) api.soloTipicos = true;

  const excluir = etiquetasExcluidas(filtros.excluir);

  if (excluir.length > 0) api.excluir = excluir;

  return api;
}

/**
 * Query string de `/alimentos` a partir de los filtros activos (spec S2). Un `q` en blanco, una
 * categoría vacía o un `excluir` sin etiquetas no se escriben: la URL queda limpia y solo lleva lo
 * que realmente filtra.
 */
export function queryDeFiltros(filtros: FiltrosActivos): URLSearchParams {
  const params = new URLSearchParams();

  const q = filtros.q.trim();

  if (q.length > 0) params.set("q", q);
  if (filtros.categoria.length > 0) params.set("categoria", filtros.categoria);
  if (filtros.tipoComida.length > 0) params.set("tipoComida", filtros.tipoComida);
  if (filtros.soloTipicos) params.set("soloTipicos", "true");

  const excluir = etiquetasExcluidas(filtros.excluir);

  if (excluir.length > 0) params.set("excluir", excluir.join(","));

  return params;
}
