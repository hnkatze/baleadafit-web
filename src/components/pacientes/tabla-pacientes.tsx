"use client";

import { useMemo, useState } from "react";
import { Magnifier, Persons } from "@gravity-ui/icons";
import { cn } from "@heroui/react";
import type { Paciente } from "@/lib/api/pacientes";

const TZ = "America/Tegucigalpa";
/**
 * Las fechas de calendario (`fechaNacimiento`, `medicion.fecha`) llegan como medianoche
 * UTC del día enviado (regla 1 de docs/contexto-api.md): para mostrar el mismo día hay
 * que formatearlas en UTC. Los instantes sí van en GMT-6.
 */
const CALENDAR_TZ = "UTC";

const META_LABEL: Record<string, string> = {
  BAJAR: "Bajar de peso",
  MANTENER: "Mantener peso",
  SUBIR: "Subir de peso",
};

const pesoFormat = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 1 });

function calendarParts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  })
    .format(date)
    .split("-")
    .map(Number);
}

function edad(fechaNacimiento: string) {
  const [anioNac, mesNac, diaNac] = calendarParts(new Date(fechaNacimiento), CALENDAR_TZ);
  const [anioHoy, mesHoy, diaHoy] = calendarParts(new Date(), TZ);
  const anios = anioHoy - anioNac;

  return mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac) ? anios - 1 : anios;
}

function fechaCorta(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: CALENDAR_TZ,
  }).format(new Date(value));
}

/** Búsqueda tolerante a mayúsculas y tildes (nombre, apellido y correo). */
function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function iniciales(paciente: Paciente) {
  return `${paciente.nombre[0] ?? ""}${paciente.apellido[0] ?? ""}`.toUpperCase();
}

export function TablaPacientes({ pacientes }: { pacientes: Paciente[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return pacientes;

    return pacientes.filter((paciente) =>
      normalizar(`${paciente.nombre} ${paciente.apellido} ${paciente.correo ?? ""}`).includes(
        termino,
      ),
    );
  }, [busqueda, pacientes]);

  if (pacientes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <Persons className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">Todavía no tenés pacientes</p>
        <p className="max-w-sm text-xs text-foreground/50">
          Cuando des de alta al primero, va a aparecer acá con su última medición y su plan
          activo.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="buscar-paciente" className="sr-only">
            Buscar paciente
          </label>
          <Magnifier className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            id="buscar-paciente"
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre, apellido o correo"
            className="w-full rounded-xl border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-foreground/40 focus:border-brand"
          />
        </div>
        <p className="text-xs text-foreground/50">
          {filtrados.length} de {pacientes.length}{" "}
          {pacientes.length === 1 ? "paciente" : "pacientes"}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[54rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
              <th scope="col" className="px-3 py-2">
                Paciente
              </th>
              <th scope="col" className="px-3 py-2">
                Meta
              </th>
              <th scope="col" className="px-3 py-2">
                Último peso
              </th>
              <th scope="col" className="px-3 py-2">
                Plan activo
              </th>
              <th scope="col" className="px-3 py-2">
                Estado
              </th>
              <th scope="col" className="w-12 px-3 py-2">
                <span className="sr-only">Ficha</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtrados.map((paciente) => (
              <tr key={paciente.id} className="align-middle">
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <span className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-deep">
                      {iniciales(paciente)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {paciente.nombre} {paciente.apellido}
                      </span>
                      <span className="block text-xs text-foreground/55">
                        {edad(paciente.fechaNacimiento)} años
                        {paciente.sexo ? ` · ${paciente.sexo}` : null}
                      </span>
                    </span>
                  </span>
                </th>
                <td className="px-3 py-3 text-foreground/70">
                  {META_LABEL[paciente.meta ?? ""] ?? "—"}
                </td>
                <td className="px-3 py-3">
                  {paciente.ultimaMedicion ? (
                    <span className="block">
                      <span className="block font-semibold">
                        {pesoFormat.format(paciente.ultimaMedicion.pesoKg)} kg
                      </span>
                      <span className="block text-xs text-foreground/50">
                        {fechaCorta(paciente.ultimaMedicion.fecha)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {paciente.planActivo ? (
                    <span className="text-foreground/70">{paciente.planActivo.nombre}</span>
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                      paciente.activo
                        ? "bg-brand-soft text-brand-deep"
                        : "bg-default/60 text-foreground/50",
                    )}
                  >
                    {paciente.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                {/* La acción "ver ficha" llega con la ficha del paciente (T3). */}
                <td className="px-3 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
          <Magnifier className="size-6 text-foreground/30" />
          <p className="text-sm font-medium text-foreground/70">
            Ningún paciente coincide con “{busqueda.trim()}”
          </p>
          <p className="max-w-xs text-xs text-foreground/50">
            Probá con otro nombre, apellido o correo.
          </p>
        </div>
      ) : null}
    </section>
  );
}
