import { Calendar, ListCheck, Persons } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { BotonNuevoPaciente } from "@/components/pacientes/boton-nuevo-paciente";
import { getDashboard, getSesion } from "@/lib/api/dashboard";
import { firstName, rangoHorario, todayLabel } from "@/lib/format";

// Cache Components: el dashboard lee la API en vivo, no se prerenderiza.
export const instant = false;

export default async function HomePage() {
  const [sesion, dashboardResult] = await Promise.all([
    getSesion().catch(() => null),
    // El status importa: un 403 no es una caída de la API (ver ApiErrorAlert).
    getDashboard().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error }),
    ),
  ]);
  const dashboard = dashboardResult.data;

  const nombrePila = firstName(sesion?.perfil?.nombre);

  const citas = dashboard?.citasHoy ?? [];

  const kpis = [
    {
      label: "Pacientes activos",
      value: dashboard ? String(dashboard.pacientesActivos) : "—",
      hint: "con seguimiento abierto",
      icon: Persons,
    },
    {
      label: "Planes en borrador",
      value: dashboard ? String(dashboard.planesEnBorrador) : "—",
      hint: "pendientes de aprobar",
      icon: ListCheck,
    },
    {
      label: "Citas de hoy",
      value: dashboard ? String(citas.length) : "—",
      hint: citas.length === 0 ? "sin consultas agendadas" : "agenda del día",
      icon: Calendar,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            ¡Hola, {nombrePila}!
          </h1>
          <p className="text-sm text-foreground/60">
            Resumen clínico de hoy · {todayLabel()} · Tegucigalpa (GMT-6)
          </p>
        </div>
        <BotonNuevoPaciente />
      </header>

      {dashboard === null ? (
        <ApiErrorAlert title="No se pudo leer el dashboard" error={dashboardResult.error} />
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        {kpis.map(({ label, value, hint, icon: Icon }) => (
          <article
            key={label}
            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground/60">{label}</p>
              <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand-deep">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="text-3xl font-bold leading-none tracking-tight">
              {value}
            </p>
            <p className="text-xs text-foreground/50">{hint}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Próximas citas de hoy</h2>
            <span className="text-xs text-foreground/50">
              {citas.length} {citas.length === 1 ? "cita" : "citas"}
            </span>
          </div>

          {citas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
              <Calendar className="size-6 text-foreground/30" />
              <p className="text-sm font-medium text-foreground/70">
                Sin consultas agendadas para hoy
              </p>
              <p className="max-w-xs text-xs text-foreground/50">
                La agenda se conecta en el módulo de citas. Mientras tanto, este bloque
                muestra lo que devuelve <code>GET /dashboard</code>.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-border/60">
              {citas.map((cita) => (
                <li key={cita.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-bold text-brand-deep">
                    {cita.paciente.nombre[0]}
                    {cita.paciente.apellido[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {cita.paciente.nombre} {cita.paciente.apellido}
                    </span>
                    <span className="block text-xs text-foreground/55">
                      {rangoHorario(cita)}
                      {cita.modalidad
                        ? ` · ${cita.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}`
                        : null}
                    </span>
                  </span>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                    {cita.estado.replaceAll("_", " ").toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-brand-mint/60 bg-brand-soft p-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-brand-deep">
              Protocolo hondureño activo
            </h2>
            <p className="text-sm text-brand-deep/75">
              Optimizador de tortillas de maíz nixtamalizado y frijol rojo de seda para
              perfiles con restricción de sodio o diabetes.
            </p>
          </div>
          <Button isDisabled variant="secondary" size="sm" className="self-start">
            Configurar tablas
          </Button>
        </section>
      </div>
    </div>
  );
}
