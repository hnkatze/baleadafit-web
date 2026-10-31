import Link from "next/link";
import { ArrowChevronLeft } from "@gravity-ui/icons";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { FormAlta } from "@/components/pacientes/form-alta";
import { getCondiciones, getRestricciones } from "@/lib/api/pacientes";

// Cache Components: el alta lee los catálogos en vivo, no se prerenderiza.
export const instant = false;

export default async function NuevoPacientePage() {
  // En paralelo y guardando el error: un catálogo caído no puede romper la pantalla.
  const [condicionesResult, restriccionesResult] = await Promise.all([
    getCondiciones().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error }),
    ),
    getRestricciones().then(
      (data) => ({ data, error: null }),
      (error: unknown) => ({ data: null, error }),
    ),
  ]);

  const condiciones = condicionesResult.data;
  const restricciones = restriccionesResult.data;

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
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Nuevo paciente</h1>
          <p className="text-sm text-foreground/60">
            Admisión clínica completa en cuatro pasos · los campos con * son obligatorios
          </p>
        </div>
      </header>

      {condiciones === null || restricciones === null ? (
        <ApiErrorAlert
          title="No pudimos cargar el catálogo"
          error={condicionesResult.error ?? restriccionesResult.error}
        />
      ) : (
        <FormAlta condiciones={condiciones} restricciones={restricciones} />
      )}
    </div>
  );
}
