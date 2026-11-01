import { describe, expect, it } from "vitest";
import {
  CATEGORIA_OPCIONES,
  TIPO_COMIDA_OPCIONES,
  armarPayloadAlta,
  armarPayloadPatch,
  validarAlimento,
  valoresDeAlimento,
  type ValoresAlimento,
} from "./alimentos-form";
import type { Alimento, AlimentoVersion } from "./api/alimentos";

/** Mínimo obligatorio de `POST /alimentos`: los 9 campos requeridos (spec S3). */
const base: ValoresAlimento = {
  nombre: "Frijoles rojos",
  categoria: "LEGUMINOSA",
  porcionDescripcion: "1 taza cocida",
  porcionGramos: "170",
  kcal: "220",
  proteinaG: "14",
  carbohidratoG: "39",
  grasaG: "1.5",
  tiposComida: ["ALMUERZO"],
};

describe("etiquetas de enums", () => {
  it("usa los valores exactos que espera la API y traduce solo la etiqueta", () => {
    expect(CATEGORIA_OPCIONES.map((opcion) => opcion.value)).toEqual([
      "PLATO_TIPICO",
      "PROTEINA",
      "CEREAL_TUBERCULO",
      "LEGUMINOSA",
      "LACTEO",
      "FRUTA",
      "VERDURA",
      "GRASA",
      "BEBIDA",
    ]);
    expect(TIPO_COMIDA_OPCIONES.map((opcion) => opcion.value)).toEqual([
      "DESAYUNO",
      "MERIENDA_AM",
      "ALMUERZO",
      "MERIENDA_PM",
      "CENA",
    ]);
  });

  it("no repite valores ni deja etiquetas vacías", () => {
    for (const opciones of [CATEGORIA_OPCIONES, TIPO_COMIDA_OPCIONES]) {
      const valores = opciones.map((opcion) => opcion.value);

      expect(new Set(valores).size).toBe(valores.length);
      for (const opcion of opciones) expect(opcion.label.trim()).not.toBe("");
    }
  });
});

describe("validarAlimento", () => {
  it("acepta el mínimo obligatorio", () => {
    expect(validarAlimento(base)).toEqual({});
  });

  it("acepta los bordes inclusivos de los rangos observados", () => {
    expect(validarAlimento({ ...base, porcionGramos: "1", kcal: "0" })).toEqual({});
    expect(validarAlimento({ ...base, porcionGramos: "2000", kcal: "3000" })).toEqual({});
  });

  it("lista todos los obligatorios que faltan cuando no hay nada cargado", () => {
    const errores = validarAlimento({});

    expect(Object.keys(errores).sort()).toEqual(
      [
        "categoria",
        "carbohidratoG",
        "grasaG",
        "kcal",
        "nombre",
        "porcionDescripcion",
        "porcionGramos",
        "proteinaG",
        "tiposComida",
      ].sort(),
    );

    for (const mensaje of Object.values(errores)) expect(mensaje.trim()).not.toBe("");
  });

  it("rechaza una porción fuera de 1-2000 gramos", () => {
    expect(validarAlimento({ ...base, porcionGramos: "0" }).porcionGramos).toBe(
      "La porción tiene que estar entre 1 y 2000 gramos.",
    );
    expect(validarAlimento({ ...base, porcionGramos: "2001" }).porcionGramos).toBe(
      "La porción tiene que estar entre 1 y 2000 gramos.",
    );
    expect(validarAlimento({ ...base, porcionGramos: "2001" }).kcal).toBeUndefined();
  });

  it("rechaza las kcal fuera de 0-3000", () => {
    expect(validarAlimento({ ...base, kcal: "3001" }).kcal).toBe(
      "Las calorías tienen que estar entre 0 y 3000.",
    );
    expect(validarAlimento({ ...base, kcal: "-1" }).kcal).toBe(
      "Las calorías tienen que estar entre 0 y 3000.",
    );
  });

  it("rechaza un obligatorio que no es numérico", () => {
    expect(validarAlimento({ ...base, proteinaG: "catorce" }).proteinaG).toBe(
      "La proteína tiene que ser un número.",
    );
  });

  it("rechaza un opcional que no es numérico o que es negativo", () => {
    expect(validarAlimento({ ...base, fibraG: "mucho" }).fibraG).toBe(
      "La fibra tiene que ser un número.",
    );
    expect(validarAlimento({ ...base, sodioMg: "-5" }).sodioMg).toBe(
      "El sodio no puede ser negativo.",
    );
  });

  it("exige al menos un tipo de comida", () => {
    expect(validarAlimento({ ...base, tiposComida: [] }).tiposComida).toBe(
      "Elegí al menos un tiempo de comida.",
    );
  });

  it("exige un nombre con largo razonable", () => {
    expect(validarAlimento({ ...base, nombre: "A" }).nombre).toBe(
      "El nombre tiene que tener al menos 2 caracteres.",
    );
    expect(validarAlimento({ ...base, nombre: "   " }).nombre).toBe("El nombre es obligatorio.");
  });

  it("rechaza una categoría que no existe en el enum", () => {
    expect(validarAlimento({ ...base, categoria: "POSTRE" }).categoria).toBe(
      "La categoría elegida no es válida.",
    );
  });
});

describe("armarPayloadAlta", () => {
  it("convierte los numéricos y omite los campos vacíos", () => {
    const payload = armarPayloadAlta({
      ...base,
      fibraG: "6",
      sodioMg: "",
      azucaresG: "1.2",
      contiene: [],
      fuente: "   ",
    });

    expect(payload).toEqual({
      nombre: "Frijoles rojos",
      categoria: "LEGUMINOSA",
      porcionDescripcion: "1 taza cocida",
      porcionGramos: 170,
      kcal: 220,
      proteinaG: 14,
      carbohidratoG: 39,
      grasaG: 1.5,
      tiposComida: ["ALMUERZO"],
      fibraG: 6,
      azucaresG: 1.2,
      esTipicoHn: false,
    });
    expect("sodioMg" in payload).toBe(false);
    expect("contiene" in payload).toBe(false);
    expect("fuente" in payload).toBe(false);
  });

  it("manda contiene, fuente y la marca de típico cuando vienen", () => {
    const payload = armarPayloadAlta({
      ...base,
      contiene: ["cerdo", " "],
      fuente: "Tabla INCAP 2019",
      esTipicoHn: true,
    });

    expect(payload.contiene).toEqual(["cerdo"]);
    expect(payload.fuente).toBe("Tabla INCAP 2019");
    expect(payload.esTipicoHn).toBe(true);
  });
});

describe("armarPayloadPatch", () => {
  it("devuelve un objeto vacío cuando no cambió nada", () => {
    expect(armarPayloadPatch(base, base)).toEqual({});
  });

  it("normaliza espacios y números antes de comparar", () => {
    expect(
      armarPayloadPatch(base, {
        ...base,
        nombre: "  Frijoles rojos  ",
        porcionGramos: "170.0",
        contiene: [],
      }),
    ).toEqual({});
  });

  it("compara las listas sin importar el orden", () => {
    const original: ValoresAlimento = { ...base, contiene: ["cerdo", "lactosa"] };

    expect(armarPayloadPatch(original, { ...base, contiene: ["lactosa", "cerdo"] })).toEqual({});
  });

  it("devuelve solo los campos que cambiaron, con los numéricos como número", () => {
    const cambios = armarPayloadPatch(base, {
      ...base,
      nombre: "Frijoles rojos cocidos",
      kcal: "240",
      tiposComida: ["ALMUERZO", "CENA"],
      esTipicoHn: true,
    });

    expect(cambios).toEqual({
      nombre: "Frijoles rojos cocidos",
      kcal: 240,
      tiposComida: ["ALMUERZO", "CENA"],
      esTipicoHn: true,
    });
  });

  it("manda la lista vacía cuando se sacaron todas las etiquetas", () => {
    const original: ValoresAlimento = { ...base, contiene: ["cerdo"] };

    expect(armarPayloadPatch(original, { ...base, contiene: [] })).toEqual({ contiene: [] });
  });
});

/** `GET /alimentos/{id}`: los macros de la vigente aplanados, sin micronutrientes salvo `fibraG`. */
const alimento: Alimento = {
  id: "1efc8386-6f83-4cbe-9817-5fd4539f2c96",
  nombre: "Mangú de plátano",
  categoria: "PLATO_TIPICO",
  tiposComida: ["DESAYUNO", "MERIENDA_AM"],
  porcionDescripcion: "1 taza",
  porcionGramos: 240,
  kcal: 180,
  proteinaG: 3.2,
  carbohidratoG: 38,
  grasaG: 1.1,
  fibraG: 3.8,
  contiene: ["lactosa"],
  esTipicoHn: true,
  fuente: "Tabla INCAP 2019",
  activo: true,
};

/** `GET /alimentos/{id}/versiones`: plana, con los nutrientes como hermanos de `version`. */
const version: AlimentoVersion = {
  version: 1,
  vigenteDesde: "2026-01-15T00:00:00.000Z",
  vigenteHasta: null,
  tabla: "Inicial",
  fuente: "Tabla INCAP 2019",
  porcionDescripcion: "1 taza cocida",
  porcionGramos: 250,
  kcal: 200,
  proteinaG: 4,
  carbohidratoG: 40,
  grasaG: 2,
  fibraG: 3.8,
  sodioMg: 8,
  potasioMg: 400,
  fosforoMg: 30,
  azucaresG: 12,
  grasasSatG: 0.6,
  indiceGlucemico: 55,
};

describe("valoresDeAlimento", () => {
  it("con versión vigente usa la tabla de la versión, con los numéricos como texto", () => {
    expect(valoresDeAlimento(alimento, version)).toEqual({
      nombre: "Mangú de plátano",
      categoria: "PLATO_TIPICO",
      porcionDescripcion: "1 taza cocida",
      porcionGramos: "250",
      kcal: "200",
      proteinaG: "4",
      carbohidratoG: "40",
      grasaG: "2",
      fibraG: "3.8",
      azucaresG: "12",
      grasasSatG: "0.6",
      indiceGlucemico: "55",
      sodioMg: "8",
      potasioMg: "400",
      fosforoMg: "30",
      tiposComida: ["DESAYUNO", "MERIENDA_AM"],
      contiene: ["lactosa"],
      esTipicoHn: true,
      fuente: "Tabla INCAP 2019",
    });
  });

  it("sin versión usa los valores del alimento", () => {
    const valores = valoresDeAlimento(alimento, null);

    expect(valores.porcionDescripcion).toBe("1 taza");
    expect(valores.porcionGramos).toBe("240");
    expect(valores.kcal).toBe("180");
    expect(valores.proteinaG).toBe("3.2");
    expect(valores.carbohidratoG).toBe("38");
    expect(valores.grasaG).toBe("1.1");
    expect(valores.fibraG).toBe("3.8");
    // Los micronutrientes que `GET /alimentos/{id}` no trae quedan vacíos, no `undefined`.
    expect(valores.sodioMg).toBe("");
    expect(valores.azucaresG).toBe("");
    expect(valores.fuente).toBe("Tabla INCAP 2019");
  });

  it("deja en blanco los nutrientes nulos y la fuente sin declarar", () => {
    const valores = valoresDeAlimento(
      { ...alimento, fibraG: null, fuente: null },
      { ...version, fibraG: null, azucaresG: null, grasasSatG: null, sodioMg: null, potasioMg: null, fosforoMg: null, indiceGlucemico: null, fuente: null },
    );

    expect(valores.fibraG).toBe("");
    expect(valores.azucaresG).toBe("");
    expect(valores.grasasSatG).toBe("");
    expect(valores.sodioMg).toBe("");
    expect(valores.potasioMg).toBe("");
    expect(valores.fosforoMg).toBe("");
    expect(valores.indiceGlucemico).toBe("");
    expect(valores.fuente).toBeUndefined();
    expect(valores.kcal).toBe("200");
  });

  it("preserva el diff de PATCH: los originales del formulario no generan cambios", () => {
    const originales = valoresDeAlimento(alimento, version);

    expect(armarPayloadPatch(originales, originales)).toEqual({});
  });
});
