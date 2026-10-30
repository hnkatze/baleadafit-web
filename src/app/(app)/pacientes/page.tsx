import { Plus } from "@gravity-ui/icons";
import { Alert, Button } from "@heroui/react";
import { TablaPacientes } from "@/components/pacientes/tabla-pacientes";
import { getPacientes } from "@/lib/api/pacientes";

// Cache Components: el listado lee la API en vivo, no se prerenderiza.
export const instant = false;

export default async function PacientesPage() {
  const pacientes = await getPacientes().catch(() => null);
  const total = pacientes?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Pacientes</h1>
          <p className="text-sm text-foreground/60">
            {pacientes === null
              ? "No se pudo leer el listado desde la API"
              : `${total} ${total === 1 ? "paciente" : "pacientes"} registrados · último peso y plan activo`}
          </p>
        </div>
        <span title="El alta de pacientes todavía no está disponible">
          <Button isDisabled>
            <Plus className="size-4" />
            Nuevo paciente
          </Button>
        </span>
      </header>

      {pacientes === null ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No se pudo leer la API</Alert.Title>
            <Alert.Description>
              Revisá que la API esté corriendo en <code>localhost:3000</code> y que
              <code> API_URL</code> / <code>API_DEV_TOKEN</code> estén en
              <code> .env.local</code>.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : (
        <TablaPacientes pacientes={pacientes} />
      )}
    </div>
  );
}
