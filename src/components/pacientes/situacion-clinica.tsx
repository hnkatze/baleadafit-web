import { Stethoscope } from "@gravity-ui/icons";
import { cn } from "@heroui/react";
import type { SituacionFicha } from "@/lib/api/pacientes";
import { ESTADO_FISIOLOGICO_OPCIONES } from "@/lib/pacientes-form";

/** `null` y las cadenas de solo espacios cuentan como "sin dato". */
function texto(input: string | null | undefined): string | null {
  const limpio = input?.trim();
  return limpio ? limpio : null;
}

/**
 * `NINGUNO` significa "sin condición fisiológica": no es un dato que la ficha tenga que mostrar,
 * y por eso tampoco cuenta para decidir el estado vacío (spec S3).
 */
function etiquetaEstado(estado: SituacionFicha["estadoFisiologico"]): string | null {
  if (!estado || estado === "NINGUNO") return null;

  return (
    ESTADO_FISIOLOGICO_OPCIONES.find((opcion) => opcion.value === estado)?.label ??
    estado.replaceAll("_", " ").toLowerCase()
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
      {children}
    </h3>
  );
}

/**
 * Cuerpo de la sección "Situación clínica" (spec S1): condiciones del catálogo con su nota,
 * restricciones, medicación, estado fisiológico y antecedentes. Se renderiza dentro de la card
 * de la ficha, que aporta el marco.
 */
export function SituacionClinica({ situacion }: { situacion: SituacionFicha }) {
  const { condiciones, restricciones, medicacion } = situacion;
  const motivoConsulta = texto(situacion.motivoConsulta);

  const antecedentes = [
    { label: "Estado fisiológico", valor: etiquetaEstado(situacion.estadoFisiologico) },
    { label: "Alergias", valor: texto(situacion.alergias) },
    { label: "Cirugías", valor: texto(situacion.cirugias) },
    { label: "Suplementos", valor: texto(situacion.suplementos) },
  ].filter((fila): fila is { label: string; valor: string } => fila.valor !== null);

  const vacia =
    condiciones.length === 0 &&
    restricciones.length === 0 &&
    medicacion.length === 0 &&
    antecedentes.length === 0 &&
    motivoConsulta === null;

  if (vacia) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
        <Stethoscope className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">Sin situación clínica cargada</p>
        <p className="max-w-sm text-xs text-foreground/50">
          Cuando el alta registre condiciones, restricciones, medicación o antecedentes, aparecen
          acá.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {condiciones.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Titulo>Condiciones</Titulo>
          <ul className="flex flex-col gap-2">
            {condiciones.map(({ condicion, notas }) => {
              const nota = texto(notas);

              return (
                <li
                  key={condicion.codigo}
                  className="rounded-xl border border-border/60 bg-background px-3 py-2.5"
                >
                  <p className="text-sm font-semibold">{condicion.nombre}</p>
                  {condicion.descripcion ? (
                    <p className="text-xs text-foreground/60">{condicion.descripcion}</p>
                  ) : null}
                  {nota ? (
                    <p className="mt-1.5 text-xs text-foreground/60">
                      <span className="font-semibold text-foreground/70">Nota: </span>
                      {nota}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {restricciones.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Titulo>Restricciones</Titulo>
          <ul className="flex flex-wrap gap-2">
            {restricciones.map(({ restriccion }) => (
              <li
                key={restriccion.codigo}
                className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-deep"
              >
                {restriccion.nombre}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {medicacion.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Titulo>Medicación</Titulo>
          <ul className="flex flex-col divide-y divide-border/60">
            {medicacion.map((medicamento) => {
              const detalle = [medicamento.dosis, medicamento.frecuencia]
                .filter(Boolean)
                .join(" · ");

              return (
                <li
                  key={medicamento.id}
                  className={cn(
                    "flex items-start justify-between gap-3 py-2",
                    // Baja lógica de medicamentos: se conserva en el historial, atenuado.
                    medicamento.activo ? null : "opacity-60",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{medicamento.nombre}</span>
                    <span className="block text-xs text-foreground/60">
                      {detalle || "Sin dosis ni frecuencia"}
                    </span>
                  </span>
                  {medicamento.activo ? null : (
                    <span className="shrink-0 rounded-full bg-default/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground/50">
                      Inactivo
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {antecedentes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Titulo>Antecedentes</Titulo>
          <dl className="flex flex-col divide-y divide-border/60">
            {antecedentes.map((fila) => (
              <div
                key={fila.label}
                className="flex items-baseline justify-between gap-3 py-2 text-sm"
              >
                <dt className="shrink-0 text-foreground/60">{fila.label}</dt>
                <dd className="min-w-0 text-right font-semibold">{fila.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {motivoConsulta ? (
        <div className="flex flex-col gap-2">
          <Titulo>Motivo de consulta</Titulo>
          <p className="rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm text-foreground/70">
            {motivoConsulta}
          </p>
        </div>
      ) : null}
    </div>
  );
}
