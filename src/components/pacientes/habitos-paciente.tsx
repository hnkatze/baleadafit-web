import { FileText } from "@gravity-ui/icons";
import type { HabitosFicha } from "@/lib/api/pacientes";
import { value } from "@/lib/format";

/** `null` y las cadenas de solo espacios cuentan como "sin dato". */
function texto(input: string | null | undefined): string | null {
  const limpio = input?.trim();
  return limpio ? limpio : null;
}

function numero(input: number | null | undefined): boolean {
  return typeof input === "number" && Number.isFinite(input);
}

/**
 * Cuerpo de la sección "Hábitos" (spec S1). Los numéricos pasan por `value()` y los textos van
 * tal cual; un hábito faltante se muestra como "—" en su fila, para que la lista siempre se lea
 * igual. Si no hay ninguno cargado, la sección entera cae en su estado vacío (spec S3).
 */
export function HabitosPaciente({ habitos }: { habitos: HabitosFicha }) {
  const filas = [
    { label: "Comidas al día", valor: value(habitos.comidasAlDia) },
    { label: "Agua", valor: value(habitos.aguaLitros, "L") },
    { label: "Sueño", valor: value(habitos.horasSueno, "h") },
    { label: "Alcohol", valor: texto(habitos.alcohol) ?? "—" },
    { label: "Tabaco", valor: texto(habitos.tabaco) ?? "—" },
    { label: "Quién cocina", valor: texto(habitos.quienCocina) ?? "—" },
    { label: "Presupuesto", valor: texto(habitos.presupuesto) ?? "—" },
  ];

  const hayDatos =
    numero(habitos.comidasAlDia) ||
    numero(habitos.aguaLitros) ||
    numero(habitos.horasSueno) ||
    texto(habitos.alcohol) !== null ||
    texto(habitos.tabaco) !== null ||
    texto(habitos.quienCocina) !== null ||
    texto(habitos.presupuesto) !== null;

  if (!hayDatos) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
        <FileText className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">Sin hábitos cargados</p>
        <p className="max-w-sm text-xs text-foreground/50">
          Comidas al día, agua, sueño y el resto de los hábitos se completan en el alta del
          paciente.
        </p>
      </div>
    );
  }

  return (
    <dl className="flex flex-col divide-y divide-border/60">
      {filas.map((fila) => (
        <div key={fila.label} className="flex items-baseline justify-between gap-3 py-2 text-sm">
          <dt className="shrink-0 text-foreground/60">{fila.label}</dt>
          <dd className="min-w-0 text-right font-semibold tabular-nums">{fila.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
