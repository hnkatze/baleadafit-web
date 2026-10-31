import { describe, expect, it } from "vitest";
import {
  ESTADO_FISIOLOGICO_OPCIONES,
  META_OPCIONES,
  NIVEL_ACTIVIDAD_OPCIONES,
  PASOS,
  SEXO_OPCIONES,
  armarPayload,
  validarFormulario,
  validarPaso,
  type ValoresPaciente,
} from "./pacientes-form";

/** Mínimo obligatorio de la API (`POST /pacientes`). */
const base: ValoresPaciente = {
  nombre: "Ana",
  apellido: "López",
  sexo: "F",
  fechaNacimiento: "1994-05-10",
};

describe("etiquetas de enums", () => {
  it("usa los valores exactos que espera la API y traduce solo la etiqueta", () => {
    expect(SEXO_OPCIONES).toEqual([
      { value: "F", label: "Femenino" },
      { value: "M", label: "Masculino" },
    ]);
    expect(NIVEL_ACTIVIDAD_OPCIONES.map((opcion) => opcion.value)).toEqual([
      "SEDENTARIO",
      "LIGERO",
      "MODERADO",
      "INTENSO",
      "MUY_INTENSO",
    ]);
    expect(META_OPCIONES.map((opcion) => opcion.value)).toEqual(["BAJAR", "MANTENER", "SUBIR"]);
    expect(ESTADO_FISIOLOGICO_OPCIONES.map((opcion) => opcion.value)).toEqual([
      "NINGUNO",
      "EMBARAZO",
      "LACTANCIA",
    ]);
  });

  it("no repite valores ni deja etiquetas vacías", () => {
    for (const opciones of [
      SEXO_OPCIONES,
      NIVEL_ACTIVIDAD_OPCIONES,
      META_OPCIONES,
      ESTADO_FISIOLOGICO_OPCIONES,
    ]) {
      const valores = opciones.map((opcion) => opcion.value);
      expect(new Set(valores).size).toBe(valores.length);
      for (const opcion of opciones) expect(opcion.label.trim()).not.toBe("");
    }
  });
});

describe("pasos del formulario", () => {
  it("declara los cuatro pasos en orden con sus campos", () => {
    expect(PASOS.map((paso) => paso.id)).toEqual([
      "identificacion",
      "objetivo",
      "condiciones",
      "habitos",
    ]);
    expect(PASOS.map((paso) => paso.titulo)).toEqual([
      "Identificación",
      "Objetivo",
      "Condiciones y restricciones",
      "Hábitos y antecedentes",
    ]);
    expect(PASOS[0].campos).toEqual(
      expect.arrayContaining(["nombre", "apellido", "sexo", "fechaNacimiento", "correo", "telefono"]),
    );
    expect(PASOS[2].campos).toEqual(["condiciones", "restricciones"]);
  });

  it("reparte los 25 campos del contrato entre los pasos, sin repetirlos", () => {
    const campos = PASOS.flatMap((paso) => paso.campos);

    expect(new Set(campos).size).toBe(campos.length);
    expect(campos).toHaveLength(25);
    expect(campos).toEqual(
      expect.arrayContaining([
        "nombre",
        "apellido",
        "sexo",
        "fechaNacimiento",
        "correo",
        "telefono",
        "nivelActividad",
        "meta",
        "notas",
        "restricciones",
        "pesoObjetivoKg",
        "fechaObjetivo",
        "estadoFisiologico",
        "motivoConsulta",
        "alergias",
        "cirugias",
        "suplementos",
        "comidasAlDia",
        "aguaLitros",
        "horasSueno",
        "alcohol",
        "tabaco",
        "quienCocina",
        "presupuesto",
        "condiciones",
      ]),
    );
  });
});

describe("validarPaso — identificación", () => {
  it("acepta el mínimo obligatorio", () => {
    expect(validarPaso("identificacion", base)).toEqual({});
  });

  it("exige los cuatro campos obligatorios", () => {
    const errores = validarPaso("identificacion", {});

    expect(Object.keys(errores).sort()).toEqual([
      "apellido",
      "fechaNacimiento",
      "nombre",
      "sexo",
    ]);
    for (const mensaje of Object.values(errores)) expect(mensaje.trim()).not.toBe("");
  });

  it("trata los espacios como vacío", () => {
    const errores = validarPaso("identificacion", { ...base, nombre: "   " });

    expect(errores.nombre).toBe("El nombre es obligatorio.");
  });

  it("rechaza un sexo fuera del enum", () => {
    expect(validarPaso("identificacion", { ...base, sexo: "X" }).sexo).toBe(
      "El sexo elegido no es válido.",
    );
  });

  it("rechaza un correo con formato inválido", () => {
    expect(validarPaso("identificacion", { ...base, correo: "ana@" }).correo).toBe(
      "El correo no tiene un formato válido.",
    );
    expect(validarPaso("identificacion", { ...base, correo: "ana arroba correo.hn" }).correo).toBe(
      "El correo no tiene un formato válido.",
    );
  });

  it("acepta un correo válido y omite la validación cuando viene vacío", () => {
    expect(validarPaso("identificacion", { ...base, correo: "ana@correo.hn" })).toEqual({});
    expect(validarPaso("identificacion", { ...base, correo: "" })).toEqual({});
  });

  it("rechaza una fecha de nacimiento con formato inválido o inexistente", () => {
    expect(validarPaso("identificacion", { ...base, fechaNacimiento: "10/05/1994" }).fechaNacimiento).toBe(
      "La fecha de nacimiento tiene que ser una fecha válida (AAAA-MM-DD).",
    );
    expect(validarPaso("identificacion", { ...base, fechaNacimiento: "1994-02-30" }).fechaNacimiento).toBe(
      "La fecha de nacimiento tiene que ser una fecha válida (AAAA-MM-DD).",
    );
  });

  it("rechaza una fecha de nacimiento futura y acepta la de hoy", () => {
    const hoy = "2026-11-01";

    expect(validarPaso("identificacion", { ...base, fechaNacimiento: "2026-11-02" }, hoy).fechaNacimiento).toBe(
      "La fecha de nacimiento no puede ser futura.",
    );
    expect(validarPaso("identificacion", { ...base, fechaNacimiento: hoy }, hoy)).toEqual({});
  });

  it("usa la fecha de Honduras por defecto: una fecha del año 2999 siempre es futura", () => {
    expect(validarPaso("identificacion", { ...base, fechaNacimiento: "2999-01-01" }).fechaNacimiento).toBe(
      "La fecha de nacimiento no puede ser futura.",
    );
  });

  it("no valida campos de otros pasos", () => {
    expect(validarPaso("identificacion", { ...base, pesoObjetivoKg: "999" })).toEqual({});
  });
});

describe("validarPaso — objetivo", () => {
  it("acepta el paso vacío: todo lo del objetivo es opcional", () => {
    expect(validarPaso("objetivo", {})).toEqual({});
  });

  it("acepta los bordes de pesoObjetivoKg (20 y 400) y rechaza uno afuera", () => {
    expect(validarPaso("objetivo", { pesoObjetivoKg: "20" })).toEqual({});
    expect(validarPaso("objetivo", { pesoObjetivoKg: "400" })).toEqual({});
    expect(validarPaso("objetivo", { pesoObjetivoKg: "19.9" }).pesoObjetivoKg).toBe(
      "El peso objetivo tiene que estar entre 20 y 400 kg.",
    );
    expect(validarPaso("objetivo", { pesoObjetivoKg: "400.1" }).pesoObjetivoKg).toBe(
      "El peso objetivo tiene que estar entre 20 y 400 kg.",
    );
  });

  it("rechaza texto no numérico en pesoObjetivoKg", () => {
    expect(validarPaso("objetivo", { pesoObjetivoKg: "setenta" }).pesoObjetivoKg).toBe(
      "El peso objetivo tiene que ser un número.",
    );
  });

  it("rechaza una fecha objetivo con formato inválido y acepta una válida", () => {
    expect(validarPaso("objetivo", { fechaObjetivo: "2026-13-01" }).fechaObjetivo).toBe(
      "La fecha objetivo tiene que ser una fecha válida (AAAA-MM-DD).",
    );
    expect(validarPaso("objetivo", { fechaObjetivo: "2026-12-01" })).toEqual({});
  });

  it("rechaza un enum fuera del contrato", () => {
    expect(validarPaso("objetivo", { meta: "ADELGAZAR" }).meta).toBe("La meta elegida no es válida.");
    expect(validarPaso("objetivo", { estadoFisiologico: "OTRO" }).estadoFisiologico).toBe(
      "El estado fisiológico elegido no es válido.",
    );
  });
});

describe("validarPaso — hábitos", () => {
  it("acepta el paso vacío y los bordes de cada rango", () => {
    expect(validarPaso("habitos", {})).toEqual({});
    expect(
      validarPaso("habitos", { comidasAlDia: "1", aguaLitros: "0.2", horasSueno: "0" }),
    ).toEqual({});
    expect(
      validarPaso("habitos", { comidasAlDia: "12", aguaLitros: "10", horasSueno: "24" }),
    ).toEqual({});
  });

  it("rechaza valores fuera de rango con un mensaje por campo", () => {
    const errores = validarPaso("habitos", {
      comidasAlDia: "13",
      aguaLitros: "10.1",
      horasSueno: "25",
    });

    expect(errores).toEqual({
      comidasAlDia: "Las comidas al día tienen que estar entre 1 y 12.",
      aguaLitros: "El consumo de agua tiene que estar entre 0.2 y 10 litros.",
      horasSueno: "Las horas de sueño tienen que estar entre 0 y 24.",
    });
    expect(validarPaso("habitos", { comidasAlDia: "0" }).comidasAlDia).toBe(
      "Las comidas al día tienen que estar entre 1 y 12.",
    );
    expect(validarPaso("habitos", { aguaLitros: "0.1" }).aguaLitros).toBe(
      "El consumo de agua tiene que estar entre 0.2 y 10 litros.",
    );
    expect(validarPaso("habitos", { horasSueno: "-1" }).horasSueno).toBe(
      "Las horas de sueño tienen que estar entre 0 y 24.",
    );
  });

  it("rechaza texto no numérico en los cuatro numéricos", () => {
    const errores = validarPaso("habitos", {
      comidasAlDia: "cinco",
      aguaLitros: "dos litros",
      horasSueno: "ocho",
    });

    expect(errores).toEqual({
      comidasAlDia: "Las comidas al día tienen que ser un número.",
      aguaLitros: "El consumo de agua tiene que ser un número.",
      horasSueno: "Las horas de sueño tienen que ser un número.",
    });
  });
});

describe("validarPaso — condiciones y restricciones", () => {
  it("acepta listas vacías: son opcionales", () => {
    expect(validarPaso("condiciones", { condiciones: [], restricciones: [] })).toEqual({});
  });
});

describe("validarFormulario", () => {
  it("junta los errores de todos los pasos", () => {
    const errores = validarFormulario({ comidasAlDia: "13" }, "2026-11-01");

    expect(Object.keys(errores).sort()).toEqual([
      "apellido",
      "comidasAlDia",
      "fechaNacimiento",
      "nombre",
      "sexo",
    ]);
  });

  it("devuelve un objeto vacío cuando el alta está completa", () => {
    expect(
      validarFormulario(
        {
          ...base,
          correo: "ana@correo.hn",
          meta: "BAJAR",
          pesoObjetivoKg: "70",
          fechaObjetivo: "2027-01-15",
          estadoFisiologico: "NINGUNO",
          nivelActividad: "MODERADO",
          comidasAlDia: "5",
          aguaLitros: "2.5",
          horasSueno: "7",
          condiciones: ["PREDIABETES"],
          restricciones: ["LACTOSA"],
        },
        "2026-11-01",
      ),
    ).toEqual({});
  });
});

describe("armarPayload", () => {
  it("omite los strings vacíos y las listas vacías", () => {
    const payload = armarPayload({
      ...base,
      correo: "   ",
      telefono: "",
      notas: "",
      condiciones: [],
      restricciones: [],
    });

    expect(payload).toEqual(base);
    for (const clave of ["correo", "telefono", "notas", "condiciones", "restricciones"]) {
      expect(clave in payload).toBe(false);
    }
  });

  it("recorta los espacios y convierte los numéricos a number", () => {
    const payload = armarPayload({
      ...base,
      nombre: "  Ana ",
      pesoObjetivoKg: "70",
      comidasAlDia: "5",
      aguaLitros: "2.5",
      horasSueno: "7",
    });

    expect(payload).toEqual({
      ...base,
      nombre: "Ana",
      pesoObjetivoKg: 70,
      comidasAlDia: 5,
      aguaLitros: 2.5,
      horasSueno: 7,
    });
    expect(typeof payload.pesoObjetivoKg).toBe("number");
    expect(typeof payload.comidasAlDia).toBe("number");
    expect(typeof payload.aguaLitros).toBe("number");
    expect(typeof payload.horasSueno).toBe("number");
  });

  it("manda condiciones y restricciones como arrays de códigos", () => {
    const payload = armarPayload({
      ...base,
      condiciones: ["PREDIABETES", "HTA"],
      restricciones: ["LACTOSA"],
    });

    expect(payload.condiciones).toEqual(["PREDIABETES", "HTA"]);
    expect(payload.restricciones).toEqual(["LACTOSA"]);
  });

  it("no manda undefined, null, NaN ni strings numéricos", () => {
    const payload = armarPayload({
      ...base,
      pesoObjetivoKg: "",
      comidasAlDia: "  ",
      aguaLitros: "no es un número",
      horasSueno: "",
    });

    expect(Object.keys(payload).sort()).toEqual(["apellido", "fechaNacimiento", "nombre", "sexo"]);
    expect(Object.values(payload)).not.toContain(null);
    expect(Object.values(payload)).not.toContain(undefined);
    expect(Object.values(payload)).not.toContain("NaN");
  });

  it("conserva los enums con su valor exacto de la API", () => {
    const payload = armarPayload({
      ...base,
      sexo: "M",
      meta: "MANTENER",
      estadoFisiologico: "LACTANCIA",
      nivelActividad: "MUY_INTENSO",
    });

    expect(payload).toMatchObject({
      sexo: "M",
      meta: "MANTENER",
      estadoFisiologico: "LACTANCIA",
      nivelActividad: "MUY_INTENSO",
    });
  });
});
