import { ClockArrowRotateLeft } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import type { AlimentoVersion } from "@/lib/api/alimentos";
import { fechaCorta, value } from "@/lib/format";

/**
 * Historial de versiones de un alimento (spec S5). Editar cierra la vigente y abre una nueva, así
 * que esta tabla es lo que quedó congelado para los planes ya generados: la versión más reciente
 * primero y las viejas con su fecha de cierre. Cada fila es plana: los nutrientes son campos de la
 * versión y `tabla` es solo el nombre de la revisión de composición.
 *
 * `fechaCorta` va con su zona por defecto (UTC) a propósito: son fechas de calendario, no instantes
 * de Honduras (regla 1 de docs/contexto-api.md).
 */
export function VersionesAlimento({ versiones }: { versiones: AlimentoVersion[] }) {
  if (versiones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
        <ClockArrowRotateLeft className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">Todavía no hay versiones</p>
        <p className="max-w-sm text-xs text-foreground/50">
          Cada guardado del alimento abre una versión con su tabla nutricional. La primera aparece
          acá junto con el alta.
        </p>
      </div>
    );
  }

  // La API las devuelve de la más vieja a la más nueva; el historial se lee al revés.
  const ordenadas = [...versiones].sort((una, otra) => otra.version - una.version);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
            <th scope="col" className="px-3 py-2">
              Versión
            </th>
            <th scope="col" className="px-3 py-2">
              Vigencia
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              kcal
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Proteína
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Carbohidratos
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Grasa
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Fibra
            </th>
            <th scope="col" className="px-3 py-2">
              Fuente
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {ordenadas.map((version) => (
            <tr key={version.version} className="align-middle">
              <th scope="row" className="px-3 py-3 text-left font-semibold tabular-nums">
                v{version.version}
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/45">
                  {version.tabla}
                </span>
              </th>
              <td className="px-3 py-3">
                <span className="block text-foreground/70 tabular-nums">
                  {fechaCorta(version.vigenteDesde)} →{" "}
                  {version.vigenteHasta === null ? "vigente" : fechaCorta(version.vigenteHasta)}
                </span>
                {version.vigenteHasta === null ? (
                  <Chip size="sm" color="success" variant="soft" className="mt-1">
                    Vigente
                  </Chip>
                ) : null}
              </td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">
                {value(version.kcal)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                {value(version.proteinaG, "g")}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                {value(version.carbohidratoG, "g")}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                {value(version.grasaG, "g")}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                {value(version.fibraG, "g")}
              </td>
              <td className="px-3 py-3">
                <span className="block max-w-[14rem] truncate text-foreground/70">
                  {version.fuente ?? "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
