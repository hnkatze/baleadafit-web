import Link from "next/link";
import { ListUl, Magnifier } from "@gravity-ui/icons";
import { Chip } from "@heroui/react";
import type { Alimento } from "@/lib/api/alimentos";
import { CATEGORIA_OPCIONES } from "@/lib/alimentos-form";
import { value } from "@/lib/format";

/** Los `value` del API son códigos; la tabla muestra la etiqueta en español (spec S3). */
const CATEGORIA_LABEL = new Map<string, string>(
  CATEGORIA_OPCIONES.map((opcion) => [opcion.value, opcion.label]),
);

function categoriaLabel(categoria: string) {
  return CATEGORIA_LABEL.get(categoria) ?? categoria;
}

/**
 * Tabla del catálogo (spec S2). Sin estado propio a propósito: el filtrado lo hace la API
 * (`GET /alimentos`), así que lo que llega acá ya es lo que se muestra.
 */
export function TablaAlimentos({
  alimentos,
  hayFiltros,
}: {
  alimentos: Alimento[];
  hayFiltros: boolean;
}) {
  if (alimentos.length === 0) {
    // Dos vacíos distintos: el catálogo no tiene nada, o los filtros no devolvieron nada.
    return hayFiltros ? (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <Magnifier className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">
          Ningún alimento coincide con los filtros
        </p>
        <p className="max-w-sm text-xs text-foreground/50">
          Probá con otro nombre, categoría o tiempo de comida. Si vaciás la búsqueda y elegís
          “Todas”, volvés al catálogo completo.
        </p>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <ListUl className="size-6 text-foreground/30" />
        <p className="text-sm font-medium text-foreground/70">Todavía no hay alimentos</p>
        <p className="max-w-sm text-xs text-foreground/50">
          Cuando des de alta el primero, va a aparecer acá con su porción y su tabla nutricional.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[62rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/70 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
              <th scope="col" className="px-3 py-2">
                Alimento
              </th>
              <th scope="col" className="px-3 py-2">
                Categoría
              </th>
              <th scope="col" className="px-3 py-2">
                Porción
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
              <th scope="col" className="px-3 py-2">
                <span className="sr-only">Típico hondureño</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {alimentos.map((alimento) => (
              <tr key={alimento.id} className="align-middle">
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <Link
                    href={`/alimentos/${alimento.id}`}
                    className="inline-flex max-w-[20rem] items-center rounded-md text-sm font-semibold text-brand-deep transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="truncate">{alimento.nombre}</span>
                  </Link>
                </th>
                <td className="px-3 py-3 text-foreground/70">
                  {categoriaLabel(alimento.categoria)}
                </td>
                <td className="px-3 py-3">
                  <span className="block max-w-[16rem] truncate text-foreground/70">
                    {alimento.porcionDescripcion}
                  </span>
                  <span className="block text-xs text-foreground/50">
                    {value(alimento.porcionGramos, "g")}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">
                  {value(alimento.kcal)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                  {value(alimento.proteinaG, "g")}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                  {value(alimento.carbohidratoG, "g")}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-foreground/70">
                  {value(alimento.grasaG, "g")}
                </td>
                <td className="px-3 py-3">
                  {alimento.esTipicoHn ? (
                    <Chip size="sm" color="accent" variant="soft">
                      Típico HN
                    </Chip>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
