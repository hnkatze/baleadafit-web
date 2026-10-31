import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowChevronLeft, Flame, TriangleExclamation } from "@gravity-ui/icons";
import { cn } from "@heroui/react";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { GraficaEvolucion } from "@/components/pacientes/grafica-evolucion";
import { HabitosPaciente } from "@/components/pacientes/habitos-paciente";
import { HistoricoMediciones } from "@/components/pacientes/historico-mediciones";
import { SituacionClinica } from "@/components/pacientes/situacion-clinica";
import { ApiError } from "@/lib/api/client";
import { getFicha, getMediciones, type FichaPaciente, type Medicion } from "@/lib/api/pacientes";
import { estadoRequerimiento } from "@/lib/ficha-estado";
import { signedValue, value } from "@/lib/format";

// Cache Components: la ficha lee la API en vivo, no se prerenderiza.
export const instant = false;

const integer = new Intl.NumberFormat("es-HN", { maximumFractionDigits: 0 });

const SEX_LABEL: Record<string, string> = { F: "Femenino", M: "Masculino" };

const IMC_LABEL: Record<string, string> = {
  BAJO_PESO: "Bajo peso",
  NORMAL: "Normal",
  SOBREPESO: "Sobrepeso",
  OBESIDAD_I: "Obesidad I",
  OBESIDAD_II: "Obesidad II",
  OBESIDAD_III: "Obesidad III",
};

const PLAN_STATE_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  ACTIVO: "Activo",
  ARCHIVADO: "Archivado",
};

function Card({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {hint ? <span className="text-xs text-foreground/50">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value: valor, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
        {label}
      </p>
      <p className="text-xl font-bold leading-none tracking-tight tabular-nums">{valor}</p>
      {hint ? <p className="text-xs text-foreground/50">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value: valor }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 text-sm">
      <span className="text-foreground/60">{label}</span>
      <span className="font-semibold tabular-nums">{valor}</span>
    </div>
  );
}

export default async function FichaPacientePage({ params }: PageProps<"/pacientes/[id]">) {
  const { id } = await params;

  let ficha: FichaPaciente | null = null;
  let mediciones: Medicion[] = [];
  let missing = false;
  let fichaError: unknown = null;
  let medicionesError: unknown = null;

  // El histórico es una lectura aparte (S2): si falla, la ficha se sigue mostrando completa.
  const [lecturaFicha, lecturaMediciones] = await Promise.allSettled([
    getFicha(id),
    getMediciones(id),
  ]);

  if (lecturaFicha.status === "fulfilled") {
    ficha = lecturaFicha.value;
  } else {
    fichaError = lecturaFicha.reason;
    // Un 404 no es una caída de la API: el paciente no existe.
    if (lecturaFicha.reason instanceof ApiError && lecturaFicha.reason.status === 404) missing = true;
  }

  if (lecturaMediciones.status === "fulfilled") {
    mediciones = lecturaMediciones.value;
  } else {
    medicionesError = lecturaMediciones.reason;
  }

  if (missing) notFound();

  if (ficha === null) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
        <header className="flex flex-col gap-4">
          <Link
            href="/pacientes"
            className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-foreground/55 transition-colors hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <ArrowChevronLeft className="size-4" />
            Volver a pacientes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Ficha del paciente</h1>
        </header>

        <ApiErrorAlert title="No se pudo leer la ficha" error={fichaError} />
      </div>
    );
  }

  const { paciente, cabecera, progreso, situacion, habitos, adherencia30d, alertas, planes } =
    ficha;

  // Un paciente sin mediciones llega con `requerimiento: null`: no hay cinco cifras que mostrar.
  const requerimientoEstado = estadoRequerimiento(ficha.requerimiento);

  const subtitulo = [
    cabecera.edad === null ? null : `${integer.format(cabecera.edad)} años`,
    paciente.sexo ? (SEX_LABEL[paciente.sexo] ?? paciente.sexo) : null,
    paciente.correo,
    paciente.telefono,
  ]
    .filter(Boolean)
    .join(" · ");

  const adherenciaPct =
    adherencia30d.porcentaje === null ? null : Math.round(adherencia30d.porcentaje * 100);
  const adherenciaBar = adherenciaPct === null ? 0 : Math.min(100, Math.max(0, adherenciaPct));

  const deltaPeso = progreso.deltaKg;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/pacientes"
          className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-foreground/55 transition-colors hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowChevronLeft className="size-4" />
          Volver a pacientes
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {paciente.nombre} {paciente.apellido}
          </h1>
          <p className="text-sm text-foreground/60">{subtitulo || "—"}</p>
        </div>
      </header>

      <Card title="Composición actual" hint="Última medición">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="IMC"
            value={value(cabecera.imc)}
            hint={
              cabecera.clasificacionImc
                ? (IMC_LABEL[cabecera.clasificacionImc] ??
                  cabecera.clasificacionImc.replaceAll("_", " ").toLowerCase())
                : "sin clasificar"
            }
          />
          <Stat label="% de grasa" value={value(cabecera.pctGrasa, "%")} />
          <Stat label="Masa grasa" value={value(cabecera.masaGrasaKg, "kg")} />
          <Stat label="Masa muscular" value={value(cabecera.masaMuscularKg, "kg")} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card
          title="Situación clínica"
          hint={
            situacion.condiciones.length > 0
              ? `${situacion.condiciones.length} ${situacion.condiciones.length === 1 ? "condición" : "condiciones"}`
              : undefined
          }
        >
          <SituacionClinica situacion={situacion} />
        </Card>

        <Card title="Hábitos" hint="Del alta">
          <HabitosPaciente habitos={habitos} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card title="Gráfica de mediciones" hint={`${ficha.evolucion.length} registros`}>
          <GraficaEvolucion evolucion={ficha.evolucion} />
        </Card>

        <Card title="Progreso" hint="Peso corporal">
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold leading-none tracking-tight tabular-nums">
              {value(progreso.pesoActual, "kg")}
            </p>
            <p className="pb-0.5 text-sm font-semibold tabular-nums text-foreground/60">
              {signedValue(deltaPeso, "kg")}
            </p>
          </div>
          <div className="flex flex-col divide-y divide-border/60">
            <Row label="Peso inicial" value={value(progreso.pesoInicial, "kg")} />
            <Row label="Peso actual" value={value(progreso.pesoActual, "kg")} />
            <Row label="Ritmo" value={signedValue(progreso.ritmoKgSemana, "kg/sem")} />
            <Row label="Proyección" value={value(progreso.proyeccionKg, "kg")} />
          </div>
          <p className="text-xs text-foreground/50">
            El signo del delta es la variación desde la primera medición. El ritmo y la
            proyección aparecen cuando hay mediciones separadas en el tiempo.
          </p>
        </Card>
      </div>

      <Card
        title="Histórico de mediciones"
        hint={
          medicionesError
            ? "No disponible"
            : `${mediciones.length} ${mediciones.length === 1 ? "registro" : "registros"}`
        }
      >
        <HistoricoMediciones mediciones={mediciones} error={medicionesError} />
      </Card>

      <Card
        title="Requerimiento energético"
        hint={requerimientoEstado.tipo === "sin-mediciones" ? "Sin mediciones" : "Cálculo de la API"}
      >
        {requerimientoEstado.tipo === "sin-mediciones" ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
            <Flame className="size-6 text-foreground/30" />
            <p className="text-sm font-medium text-foreground/70">
              Todavía no hay requerimiento energético
            </p>
            <p className="max-w-sm text-xs text-foreground/50">
              Se calcula con la primera medición de peso: ahí la API puede estimar la TMB, el
              gasto total y la proteína objetivo de este paciente.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="TMB" value={value(requerimientoEstado.requerimiento.tmb, "kcal")} />
            <Stat
              label="Gasto total"
              value={value(requerimientoEstado.requerimiento.gastoTotal, "kcal")}
            />
            <Stat
              label="Ajuste por meta"
              value={signedValue(requerimientoEstado.requerimiento.ajusteMeta, "kcal")}
            />
            <Stat
              label="Kcal objetivo"
              value={value(requerimientoEstado.requerimiento.kcalObjetivo, "kcal")}
            />
            <Stat
              label="Proteína"
              value={value(requerimientoEstado.requerimiento.proteinaG, "g")}
            />
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Adherencia (30 días)"
          hint={`${adherencia30d.cumplidos} de ${adherencia30d.total} ${adherencia30d.total === 1 ? "registro" : "registros"}`}
        >
          <p className="text-3xl font-bold leading-none tracking-tight tabular-nums">
            {adherenciaPct === null ? "—" : `${adherenciaPct} %`}
          </p>
          <div
            role="progressbar"
            aria-label="Adherencia de los últimos 30 días"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={adherenciaBar}
            aria-valuetext={adherenciaPct === null ? "sin datos" : `${adherenciaPct} %`}
            className="h-2 w-full overflow-hidden rounded-full bg-border/70"
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${adherenciaBar}%` }} />
          </div>
          <p className="text-xs text-foreground/50">
            Porcentaje de registros cumplidos sobre el total esperado en la ventana de 30 días.
          </p>
        </Card>

        <Card title="Alertas de seguimiento" hint={`${alertas.length} ${alertas.length === 1 ? "alerta" : "alertas"}`}>
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
              <TriangleExclamation className="size-6 text-foreground/30" />
              <p className="text-sm font-medium text-foreground/70">Sin alertas de seguimiento</p>
              <p className="max-w-xs text-xs text-foreground/50">
                Mediciones, plan y adherencia están al día para este paciente.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {alertas.map((alerta, index) => (
                <li
                  key={`${alerta.tipo}-${index}`}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      alerta.severidad === "alta"
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    {alerta.severidad === "alta" ? "Alta" : "Media"}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-foreground/70">
                      {alerta.tipo.replaceAll("_", " ").toLowerCase()}
                    </span>
                    <span className="block text-sm text-foreground/70">{alerta.detalle}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Planes" hint={`${planes.length} ${planes.length === 1 ? "plan" : "planes"}`}>
        {planes.length === 0 ? (
          <p className="text-sm text-foreground/55">
            Este paciente todavía no tiene planes generados.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {planes.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate text-sm font-medium">{plan.nombre}</span>
                {plan.estado ? (
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-deep">
                    {PLAN_STATE_LABEL[plan.estado] ??
                      plan.estado.replaceAll("_", " ").toLowerCase()}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-foreground/50">
          La edición de planes llega con el módulo de planes; acá solo se listan.
        </p>
      </Card>
    </div>
  );
}
