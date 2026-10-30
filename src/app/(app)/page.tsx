import { Calendar, ListCheck, Persons, Plus } from "@gravity-ui/icons";
import { Alert, Button } from "@heroui/react";
import { getDashboard, getSesion, type CitaHoy } from "@/lib/api/dashboard";

// Cache Components: el dashboard lee la API en vivo, no se prerenderiza.
export const instant = false;

const TZ = "America/Tegucigalpa";

function todayLabel() {
  const formatted = new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date());

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function horaLabel(iso: string) {
  return new Intl.DateTimeFormat("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** La API entrega el instante de inicio y la duración; el fin se deriva acá. */
function rangoHorario(cita: CitaHoy) {
  const fin = new Date(
    new Date(cita.fechaHora).getTime() + cita.duracionMin * 60_000,
  );

  return `${horaLabel(cita.fechaHora)} – ${horaLabel(fin.toISOString())}`;
}

export default async function HomePage() {
  const [sesion, dashboard] = await Promise.all([
    getSesion().catch(() => null),
    getDashboard().catch(() => null),
  ]);

  const firstName = (sesion?.perfil?.nombre ?? "Nutricionista")
    .replace(/^(Dra?\.|Lic\.)\s*/i, "")
    .split(" ")[0];

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            ¡Hola, {firstName}!
          </h1>
          <p className="text-sm text-foreground/60">
            Resumen clínico de hoy · {todayLabel()} · Tegucigalpa (GMT-6)
          </p>
        </div>
        <span title="Disponible cuando exista el módulo de pacientes">
          <Button isDisabled>
            <Plus className="size-4" />
            Nuevo paciente
          </Button>
        </span>
      </header>

      {dashboard === null ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No se pudo leer la API</Alert.Title>
            <Alert.Description>
              Revisá que la API esté corriendo en <code>localhost:3000</code> y que
              <code> API_URL</code> / <code>API_DEV_TOKEN</code> estén en
              <code> .env.local</code>.
            </Alert.Description>
          </Alert.Content>
        </Alert>
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
