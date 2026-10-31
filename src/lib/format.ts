/**
 * Pure formatting helpers used by the app shell and the patient page.
 *
 * No React, no API access: everything here is testable in `node` (spec S4).
 * Dates follow the rules in docs/contexto-api.md — calendar dates (UTC midnight)
 * must NOT be shifted, instants are shown in Honduras time (GMT-6).
 */

/** Honduras has no daylight saving time: GMT-6 all year. */
export const DEFAULT_TIME_ZONE = "America/Tegucigalpa";

/**
 * A calendar date without a time of day, exported so callers do not retype the string
 * (`medicion.fecha`, `fechaNacimiento`, `fechaObjetivo`).
 */
export const CALENDAR_TIME_ZONE = "UTC";

const decimal = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 1 });

/**
 * "Martes, 10 de marzo".
 *
 * The default time zone is Honduras because this label is used for *instants* ("hoy" en el
 * portal). For a calendar date coming from the API — which arrives as UTC midnight — pass
 * `"UTC"` explicitly: formatting it in GMT-6 would show the previous day.
 */
export function todayLabel(date: Date = new Date(), timeZone: string = DEFAULT_TIME_ZONE): string {
  const formatted = new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function horaLabel(iso: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(new Date(iso));
}

/**
 * "15 jul 2026" for a calendar date.
 *
 * The default time zone is UTC on purpose: `fecha` de una medición llega como medianoche UTC
 * (regla 1 de docs/contexto-api.md, spec S4). Formatting it in GMT-6 would show the previous
 * day — pass `DEFAULT_TIME_ZONE` only for instants.
 */
export function fechaCorta(iso: string, timeZone: string = CALENDAR_TIME_ZONE): string {
  return new Intl.DateTimeFormat("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

/** La API entrega el instante de inicio y la duración; el fin se deriva acá. */
export function rangoHorario(
  cita: { fechaHora: string; duracionMin: number },
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const fin = new Date(new Date(cita.fechaHora).getTime() + cita.duracionMin * 60_000);

  return `${horaLabel(cita.fechaHora, timeZone)} – ${horaLabel(fin.toISOString(), timeZone)}`;
}

/** Drops the clinical prefix ("Dra.", "Dr.", "Lic.") and keeps the first name. */
export function firstName(nombre: string | null | undefined): string {
  return (nombre ?? "Nutricionista").replace(/^(Dra?\.|Lic\.)\s*/i, "").split(" ")[0];
}

/** Todo número nulo o inválido se muestra como raya, nunca como `null` ni `NaN`. */
export function value(input: number | null | undefined, unit = ""): string {
  if (input === null || input === undefined || !Number.isFinite(input)) return "—";
  return `${decimal.format(input)}${unit ? ` ${unit}` : ""}`;
}

/** Igual que `value` pero conserva el signo del delta (ajuste de la meta, variación de peso). */
export function signedValue(input: number | null | undefined, unit = ""): string {
  if (input === null || input === undefined || !Number.isFinite(input)) return "—";
  const sign = input > 0 ? "+" : input < 0 ? "−" : "";
  return `${sign}${decimal.format(Math.abs(input))}${unit ? ` ${unit}` : ""}`;
}
