import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { BotonNuevoAlimento } from "@/components/alimentos/boton-nuevo-alimento";
import { FiltrosAlimentos } from "@/components/alimentos/filtros-alimentos";
import { TablaAlimentos } from "@/components/alimentos/tabla-alimentos";
import { filtrosDeApi, leerFiltros } from "@/lib/alimentos-filtros";
import { getAlimentos } from "@/lib/api/alimentos";

// Cache Components: el catálogo se lee en vivo y el filtrado lo hace la API, no la memoria.
export const instant = false;

export default async function AlimentosPage({
  searchParams,
}: {
  // En Next 16 los `searchParams` son una Promise: se esperan antes de pedir el listado.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filtros = leerFiltros(await searchParams);
  const filtrosApi = filtrosDeApi(filtros);
  const hayFiltros = Object.keys(filtrosApi).length > 0;

  // El status importa: un 403 no es una caída de la API (ver ApiErrorAlert).
  const alimentosResult = await getAlimentos(filtrosApi).then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );
  const alimentos = alimentosResult.data;
  const total = alimentos?.length ?? 0;
  const tipicos = alimentos?.filter((alimento) => alimento.esTipicoHn).length ?? 0;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Alimentos</h1>
          <p className="text-sm text-foreground/60">
            {alimentos === null
              ? "No se pudo leer el catálogo desde la API"
              : `${total} ${total === 1 ? "alimento" : "alimentos"} · ${tipicos} ${
                  tipicos === 1 ? "típico hondureño" : "típicos hondureños"
                }`}
          </p>
        </div>
        <BotonNuevoAlimento />
      </header>

      {alimentos === null ? (
        <ApiErrorAlert title="No se pudo leer el catálogo" error={alimentosResult.error} />
      ) : (
        <>
          <FiltrosAlimentos filtros={filtros} />
          <TablaAlimentos alimentos={alimentos} hayFiltros={hayFiltros} />
        </>
      )}
    </div>
  );
}
