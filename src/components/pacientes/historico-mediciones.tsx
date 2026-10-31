import { ChartLine } from "@gravity-ui/icons";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import type { FuenteMedicion, Medicion } from "@/lib/api/pacientes";
import { fechaCorta, value } from "@/lib/format";

const FUENTE_LABEL: Record<FuenteMedicion, string> = {
  MANUAL: "Manual",
  BASCULA: "Báscula",
  INBODY: "InBody",
  OMRON: "Omron",
  OTRO: "Otro",
};

/**
 * Cuerpo de la sección "Histórico de mediciones" (spec S2): la lista completa de
 * `GET /pacientes/{id}/mediciones`, no los puntos resumidos de `evolucion`. La API la entrega
 * de más vieja a más nueva, así que acá se ordena al revés (S2).
 */
export function HistoricoMediciones({
  mediciones,
  error = null,
}: {
  mediciones: Medicion[];
  /** Lectura fallida del histórico: la ficha igual se muestra, con este aviso en su lugar. */
  error?: unknown;
}) {
  if (error !== null && error !== undefined) {
    return <ApiErrorAlert title="No se pudo leer el histórico de mediciones" error={error} />;
  }

  if (mediciones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
        <ChartLine className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">
          Todavía no hay mediciones registradas.
        </p>
        <p className="max-w-sm text-xs text-foreground/50">
          Con la primera medición de peso y talla aparecen el IMC, la composición corporal y la
          gráfica de evolución.
        </p>
      </div>
    );
  }

  const ordenadas = [...mediciones].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
            <th scope="col" className="px-3 py-2">
              Fecha
            </th>
            <th scope="col" className="px-3 py-2">
              Peso (kg)
            </th>
            <th scope="col" className="px-3 py-2">
              IMC
            </th>
            <th scope="col" className="px-3 py-2">
              % de grasa
            </th>
            <th scope="col" className="px-3 py-2">
              Cintura (cm)
            </th>
            <th scope="col" className="px-3 py-2">
              Masa muscular (kg)
            </th>
            <th scope="col" className="px-3 py-2">
              Masa grasa (kg)
            </th>
            <th scope="col" className="px-3 py-2">
              Grasa visceral
            </th>
            <th scope="col" className="px-3 py-2">
              Fuente
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {ordenadas.map((medicion) => (
            <tr key={medicion.id} className="align-middle">
              <th scope="row" className="whitespace-nowrap px-3 py-3 text-left font-normal">
                <span className="font-semibold tabular-nums">{fechaCorta(medicion.fecha)}</span>
              </th>
              <td className="whitespace-nowrap px-3 py-3 font-semibold tabular-nums">
                {value(medicion.pesoKg)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">{value(medicion.imc)}</td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">{value(medicion.pctGrasa)}</td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                {value(medicion.cinturaCm)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                {value(medicion.masaMuscularKg)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                {value(medicion.masaGrasaKg)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 tabular-nums">
                {value(medicion.grasaVisceral)}
              </td>
              <td className="whitespace-nowrap px-3 py-3 text-foreground/60">
                {FUENTE_LABEL[medicion.fuente] ?? medicion.fuente}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
