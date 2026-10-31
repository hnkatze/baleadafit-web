import { describe, expect, it } from "vitest";
import { estadoRequerimiento } from "./ficha-estado";

// L6 de odd/tasks/pacientes-alta.md: un paciente sin ninguna medición hace que la API
// devuelva `requerimiento: null` — no hay peso con el que calcular TMB ni gasto total,
// y los cinco valores del bloque quedan sin fuente.

const disponible = {
  tmb: 1450,
  gastoTotal: 2175,
  ajusteMeta: -400,
  kcalObjetivo: 1775,
  proteinaG: 96,
};

describe("estadoRequerimiento", () => {
  it("reports sin-mediciones when the API sends requerimiento: null", () => {
    expect(estadoRequerimiento(null)).toEqual({ tipo: "sin-mediciones" });
  });

  it("reports sin-mediciones when the field is missing", () => {
    expect(estadoRequerimiento(undefined)).toEqual({ tipo: "sin-mediciones" });
  });

  it("hands the available requerimiento over untouched", () => {
    expect(estadoRequerimiento(disponible)).toEqual({
      tipo: "disponible",
      requerimiento: disponible,
    });
  });
});
