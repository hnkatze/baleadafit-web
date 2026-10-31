import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { BotonNuevoPaciente } from "@/components/pacientes/boton-nuevo-paciente";
import { TablaPacientes } from "@/components/pacientes/tabla-pacientes";
import { getPacientes } from "@/lib/api/pacientes";

// Cache Components: el listado lee la API en vivo, no se prerenderiza.
export const instant = false;

export default async function PacientesPage() {
  // El status importa: un 403 no es una caída de la API (ver ApiErrorAlert).
  const pacientesResult = await getPacientes().then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );
  const pacientes = pacientesResult.data;
  const total = pacientes?.length ?? 0;

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Pacientes</h1>
          <p className="text-sm text-foreground/60">
            {pacientes === null
              ? "No se pudo leer el listado desde la API"
              : `${total} ${total === 1 ? "paciente" : "pacientes"} registrados · último peso y plan activo`}
          </p>
        </div>
        <BotonNuevoPaciente />
      </header>

      {pacientes === null ? (
        <ApiErrorAlert title="No se pudo leer el listado" error={pacientesResult.error} />
      ) : (
        <TablaPacientes pacientes={pacientes} />
      )}
    </div>
  );
}
