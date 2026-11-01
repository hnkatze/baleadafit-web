import { describe, expect, it } from "vitest";
import {
  SIN_FILTROS,
  etiquetasExcluidas,
  filtrosDeApi,
  leerFiltros,
  queryDeFiltros,
  type FiltrosActivos,
} from "./alimentos-filtros";

const filtros = (cambios: Partial<FiltrosActivos> = {}): FiltrosActivos => ({
  ...SIN_FILTROS,
  ...cambios,
});

describe("etiquetasExcluidas", () => {
  it("recorta los espacios de cada etiqueta", () => {
    expect(etiquetasExcluidas("  gluten ,  lactosa ")).toEqual(["gluten", "lactosa"]);
  });

  it("descarta las comas repetidas y las entradas en blanco", () => {
    expect(etiquetasExcluidas("gluten,,, lactosa , ")).toEqual(["gluten", "lactosa"]);
  });

  it("devuelve una lista vacía cuando no hay etiquetas", () => {
    expect(etiquetasExcluidas("")).toEqual([]);
    expect(etiquetasExcluidas("   ")).toEqual([]);
    expect(etiquetasExcluidas(",,,")).toEqual([]);
  });

  it("no repite una etiqueta escrita dos veces", () => {
    expect(etiquetasExcluidas("gluten, lactosa, gluten")).toEqual(["gluten", "lactosa"]);
  });
});

describe("queryDeFiltros", () => {
  it("no escribe parámetros cuando no hay filtros activos", () => {
    expect(queryDeFiltros(SIN_FILTROS).toString()).toBe("");
  });

  it("deja afuera la búsqueda en blanco y el excluir sin etiquetas", () => {
    expect(queryDeFiltros(filtros({ q: "   ", excluir: " , " })).toString()).toBe("");
  });

  it("manda los filtros activos con los nombres exactos de la API", () => {
    const query = queryDeFiltros(
      filtros({ q: " frijoles ", categoria: "LEGUMINOSA", tipoComida: "ALMUERZO" }),
    );

    expect(query.get("q")).toBe("frijoles");
    expect(query.get("categoria")).toBe("LEGUMINOSA");
    expect(query.get("tipoComida")).toBe("ALMUERZO");
  });

  it("manda soloTipicos como el texto 'true' y no cuando está apagado", () => {
    expect(queryDeFiltros(filtros({ soloTipicos: true })).get("soloTipicos")).toBe("true");
    expect(queryDeFiltros(filtros({ soloTipicos: false })).has("soloTipicos")).toBe(false);
  });

  it("junta las etiquetas excluidas separadas por coma, sin espacios ni repetidas", () => {
    expect(queryDeFiltros(filtros({ excluir: " gluten , lactosa , gluten " })).get("excluir")).toBe(
      "gluten,lactosa",
    );
  });
});

describe("leerFiltros", () => {
  it("lee los parámetros de la URL", () => {
    expect(
      leerFiltros({
        q: "pollo",
        categoria: "PROTEINA",
        tipoComida: "CENA",
        soloTipicos: "true",
        excluir: "gluten,lactosa",
      }),
    ).toEqual({
      q: "pollo",
      categoria: "PROTEINA",
      tipoComida: "CENA",
      soloTipicos: true,
      excluir: "gluten, lactosa",
    });
  });

  it("descarta un enum que no existe en vez de mandarlo al API", () => {
    const leidos = leerFiltros({ categoria: "DULCE", tipoComida: "SIESTA" });

    expect(leidos.categoria).toBe("");
    expect(leidos.tipoComida).toBe("");
    expect(filtrosDeApi(leidos)).toEqual({});
  });

  it("soloTipicos es true únicamente con el valor 'true'", () => {
    expect(leerFiltros({ soloTipicos: "true" }).soloTipicos).toBe(true);
    expect(leerFiltros({ soloTipicos: "false" }).soloTipicos).toBe(false);
    expect(leerFiltros({}).soloTipicos).toBe(false);
  });

  it("se queda con el primer valor de un parámetro repetido", () => {
    expect(leerFiltros({ q: ["pollo", "arroz"] }).q).toBe("pollo");
  });

  it("devuelve los filtros vacíos cuando la URL no trae nada", () => {
    expect(leerFiltros({})).toEqual(SIN_FILTROS);
  });
});

describe("filtrosDeApi", () => {
  it("omite los filtros vacíos", () => {
    expect(filtrosDeApi(SIN_FILTROS)).toEqual({});
  });

  it("convierte soloTipicos en el booleano que consume getAlimentos", () => {
    const api = filtrosDeApi(filtros({ soloTipicos: true }));

    expect(api.soloTipicos).toBe(true);
    expect(typeof api.soloTipicos).toBe("boolean");
  });

  it("manda excluir como lista de etiquetas", () => {
    expect(filtrosDeApi(filtros({ excluir: " gluten ,, lactosa " })).excluir).toEqual([
      "gluten",
      "lactosa",
    ]);
  });

  it("descarta una categoría inválida que llegó por la URL", () => {
    expect(filtrosDeApi(filtros({ categoria: "DULCE" }))).toEqual({});
  });
});
