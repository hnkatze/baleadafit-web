import Link from "next/link";
import { ArrowChevronLeft } from "@gravity-ui/icons";
import { FormAlimento, type EtiquetaContiene } from "@/components/alimentos/form-alimento";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { getRestricciones } from "@/lib/api/pacientes";

// Cache Components: el alta lee las etiquetas en vivo, no se prerenderiza.
export const instant = false;

/**
 * Alta de alimento (spec S3). Las etiquetas de `contiene` salen de `GET /restricciones`, que es el
 * mismo catálogo que usa el alta de pacientes: los códigos son cerdo, gluten, huevo, lactosa, maní y
 * mariscos. Si ese catálogo falla, el formulario se sigue mostrando sin etiquetas en lugar de
 * romper la pantalla: el alimento se puede crear igual y completar después.
 */
export default async function NuevoAlimentoPage() {
  const restriccionesResult = await getRestricciones().then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );

  const restricciones: EtiquetaContiene[] = restriccionesResult.data ?? [];

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8 xl:px-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/alimentos"
          className="inline-flex w-fit items-center gap-1 rounded-md text-xs font-semibold text-foreground/55 transition-colors hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ArrowChevronLeft className="size-4" />
          Volver a alimentos
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Nuevo alimento</h1>
          <p className="text-sm text-foreground/60">
            Alta del catálogo con su tabla nutricional · los campos con * son obligatorios
          </p>
        </div>
      </header>

      {restriccionesResult.data === null ? (
        <ApiErrorAlert
          title="No pudimos cargar las etiquetas de restricción"
          error={restriccionesResult.error}
        />
      ) : null}

      <FormAlimento modo="alta" restricciones={restricciones} />
    </div>
  );
}
