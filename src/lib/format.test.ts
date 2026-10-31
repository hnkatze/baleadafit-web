import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIME_ZONE,
  fechaCorta,
  firstName,
  horaLabel,
  rangoHorario,
  signedValue,
  todayLabel,
  value,
} from "./format";

describe("todayLabel", () => {
  // Regla 1 de docs/contexto-api.md: las fechas de calendario vienen como medianoche UTC.
  // Formatearlas en UTC no mueve el día; formatearlas en GMT-6 sí lo atrasaría.
  it("keeps a calendar date (UTC midnight) on the same day when formatted in UTC", () => {
    const date = new Date("2026-03-10T00:00:00.000Z");

    expect(todayLabel(date, "UTC")).toBe("Martes, 10 de marzo");
    expect(todayLabel(date, DEFAULT_TIME_ZONE)).toBe("Lunes, 9 de marzo");
  });

  it("shows an instant on the Honduras calendar day", () => {
    // 02:30 UTC del martes son las 20:30 del lunes en Tegucigalpa (GMT-6).
    expect(todayLabel(new Date("2026-03-10T02:30:00.000Z"))).toBe("Lunes, 9 de marzo");
  });
});

describe("fechaCorta", () => {
  // Regla 1 de docs/contexto-api.md (spec S4): la `fecha` de una medición es una fecha de
  // calendario que llega como medianoche UTC. Por eso el default es UTC y no GMT-6.
  it("defaults to UTC so a UTC-midnight calendar date keeps its day", () => {
    expect(fechaCorta("2026-07-15T00:00:00.000Z")).toBe("15 jul 2026");
  });

  it("shows the previous day when the same date is formatted in Honduras time", () => {
    expect(fechaCorta("2026-07-15T00:00:00.000Z", DEFAULT_TIME_ZONE)).toBe("14 jul 2026");
  });
});

describe("horaLabel", () => {
  it("renders an instant in GMT-6", () => {
    expect(horaLabel("2026-03-10T15:00:00.000Z")).toBe("09:00 a. m.");
    expect(horaLabel("2026-03-10T00:00:00.000Z")).toBe("06:00 p. m.");
  });
});

describe("rangoHorario", () => {
  it("derives the end of the appointment from duracionMin", () => {
    const cita = { fechaHora: "2026-03-10T15:00:00.000Z", duracionMin: 30 };

    expect(rangoHorario(cita)).toBe("09:00 a. m. – 09:30 a. m.");
    expect(rangoHorario({ ...cita, duracionMin: 60 })).toBe("09:00 a. m. – 10:00 a. m.");
  });
});

describe("firstName", () => {
  it("drops the clinical prefix and keeps the first name", () => {
    expect(firstName("Lic. Camilo Henriquez")).toBe("Camilo");
    expect(firstName("Dra. Ana Lucía Pineda")).toBe("Ana");
  });

  it("falls back to a neutral name when there is no profile", () => {
    expect(firstName(undefined)).toBe("Nutricionista");
    expect(firstName(null)).toBe("Nutricionista");
  });
});

describe("value", () => {
  it("renders a number with one decimal and an optional unit", () => {
    expect(value(72.05, "kg")).toBe("72.1 kg");
    expect(value(72)).toBe("72");
  });

  it("renders missing or invalid numbers as a dash", () => {
    expect(value(null, "kg")).toBe("—");
    expect(value(undefined, "kg")).toBe("—");
    expect(value(Number.NaN, "kg")).toBe("—");
    expect(value(Number.POSITIVE_INFINITY, "kg")).toBe("—");
  });
});

describe("signedValue", () => {
  it("keeps the sign of a delta", () => {
    expect(signedValue(1.5, "kg")).toBe("+1.5 kg");
    expect(signedValue(-1.5, "kg")).toBe("−1.5 kg");
    expect(signedValue(0, "kg")).toBe("0 kg");
  });

  it("renders missing or invalid numbers as a dash", () => {
    expect(signedValue(null, "kg")).toBe("—");
    expect(signedValue(undefined)).toBe("—");
    expect(signedValue(Number.NaN, "kg")).toBe("—");
  });
});
