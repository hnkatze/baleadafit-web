import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowChevronLeft } from "@gravity-ui/icons";
import { Alert, Chip, cn } from "@heroui/react";
import { FormAlimento, type EtiquetaContiene } from "@/components/alimentos/form-alimento";
import { VersionesAlimento } from "@/components/alimentos/versiones-alimento";
import { ApiErrorAlert } from "@/components/layout/api-error-alert";
import { getAlimento, getVersiones } from "@/lib/api/alimentos";
import { ApiError } from "@/lib/api/client";
import { getRestricciones } from "@/lib/api/pacientes";
import { CATEGORIA_OPCIONES, TIPO_COMIDA_OPCIONES } from "@/lib/alimentos-form";
import { value } from "@/lib/format";

// Cache Components: la ficha lee el catálogo en vivo, no se prerenderiza.
export const instant = false;

const CATEGORIA_LABEL = new Map<string, string>(
  CATEGORIA_OPCIONES.map((opcion) => [opcion.value, opcion.label]),
);

const TIPO_COMIDA_LABEL = new Map<string, string>(
  TIPO_COMIDA_OPCIONES.map((opcion) => [opcion.value, opcion.label]),
);

function categoriaLabel(categoria: string) {
  return CATEGORIA_LABEL.get(categoria) ?? categoria.replaceAll("_", " ").toLowerCase();
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {hint ? <span className="text-xs text-foreground/50">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value: valor, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/45">
        {label}
      </p>
      <p className="text-xl font-bold leading-none tracking-tight tabular-nums">{valor}</p>
      {hint ? <p className="text-xs text-foreground/50">{hint}</p> : null}
    </div>
  );
}

/** El bloque de "no pudimos leer el alimento": mismo encabezado que la ficha, sin datos. */
function PantallaError({ error }: { error: unknown }) {
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
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Alimento</h1>
      </header>

      <ApiErrorAlert title="No se pudo leer el alimento" error={error} />
    </div>
  );
}

/**
 * Ficha del alimento (T6). Muestra la tabla nutricional de la **versión vigente**, el aviso de
 * versionado antes de editar (spec S5) y el historial completo (spec S5): editar cierra la versión
 * vigente y abre una nueva, y los planes ya generados quedan atados a la anterior.
 */
export default async function AlimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Las tres lecturas en paralelo: un historial caído no puede tumbar la ficha.
  const [alimentoResult, versionesResult, restriccionesResult] = await Promise.allSettled([
    getAlimento(id),
    getVersiones(id),
    getRestricciones(),
  ]);

  if (alimentoResult.status === "rejected") {
    // Un 404 no es una caída de la API: el alimento no existe.
    if (alimentoResult.reason instanceof ApiError && alimentoResult.reason.status === 404) {
      notFound();
    }

    return <PantallaError error={alimentoResult.reason} />;
  }

  const alimento = alimentoResult.value;
  const versiones = versionesResult.status === "fulfilled" ? versionesResult.value : null;
  const versionesError = versionesResult.status === "rejected" ? versionesResult.reason : null;
  const restricciones: EtiquetaContiene[] =
    restriccionesResult.status === "fulfilled" ? restriccionesResult.value : [];

  // La vigente es la única sin fecha de cierre.
  const vigente = versiones?.find((version) => version.vigenteHasta === null) ?? null;

  // La versión es plana: los nutrientes son campos hermanos de `version`, no una tabla anidada
  // (`tabla` es solo el nombre de la revisión de composición). `GET /alimentos/{id}` ya trae los
  // macros aplanados, pero la versión manda: es la tabla congelada de esta fila.
  const porcion = vigente?.porcionDescripcion ?? alimento.porcionDescripcion;
  const porcionGramos = vigente?.porcionGramos ?? alimento.porcionGramos;

  // Los micronutrientes no existen en `Alimento`: sin versión no hay de dónde leerlos.
  const micros = [
    { label: "Azúcares", valor: vigente?.azucaresG ?? null, unidad: "g" },
    { label: "Grasas saturadas", valor: vigente?.grasasSatG ?? null, unidad: "g" },
    { label: "Sodio", valor: vigente?.sodioMg ?? null, unidad: "mg" },
    { label: "Potasio", valor: vigente?.potasioMg ?? null, unidad: "mg" },
    { label: "Fósforo", valor: vigente?.fosforoMg ?? null, unidad: "mg" },
    { label: "Índice glucémico", valor: vigente?.indiceGlucemico ?? null, unidad: "" },
  ].filter((micro) => micro.valor !== null);

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
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{alimento.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground/60">
              {categoriaLabel(alimento.categoria)}
            </span>
            {alimento.esTipicoHn ? (
              <Chip size="sm" color="accent" variant="soft">
                Típico HN
              </Chip>
            ) : null}
            {alimento.tiposComida.map((tipoComida) => (
              <Chip key={tipoComida} size="sm" variant="soft">
                {TIPO_COMIDA_LABEL.get(tipoComida) ?? tipoComida}
              </Chip>
            ))}
            {alimento.contiene.map((etiqueta) => (
              <Chip key={etiqueta} size="sm" color="danger" variant="soft">
                {etiqueta}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      <Card
        title="Tabla nutricional"
        hint={
          vigente === null
            ? "Por porción"
            : `Versión vigente v${vigente.version} · Tabla: ${vigente.tabla} · por porción`
        }
      >
        <p className="text-sm text-foreground/60">
          {porcion} · {value(porcionGramos, "g")}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="kcal" value={value(vigente?.kcal ?? alimento.kcal)} />
          <Stat
            label="Proteína"
            value={value(vigente?.proteinaG ?? alimento.proteinaG, "g")}
          />
          <Stat
            label="Carbohidratos"
            value={value(vigente?.carbohidratoG ?? alimento.carbohidratoG, "g")}
          />
          <Stat label="Grasa" value={value(vigente?.grasaG ?? alimento.grasaG, "g")} />
          <Stat
            label="Fibra"
            value={value(vigente === null ? alimento.fibraG : vigente.fibraG, "g")}
          />
        </div>

        {/* El aviso aparece solo si NINGÚN micronutriente quedó cargado; falta uno no lo justifica. */}

        {micros.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {micros.map((micro) => (
              <Stat key={micro.label} label={micro.label} value={value(micro.valor, micro.unidad)} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-foreground/50">
            Esta versión no tiene micronutrientes cargados: se pueden agregar al editar el alimento.
          </p>
        )}

        <p className="text-xs text-foreground/50">
          Fuente: {vigente?.fuente ?? alimento.fuente ?? "sin declarar"} ·{" "}
          {alimento.activo ? "activo en el catálogo" : "inactivo en el catálogo"}
        </p>      </Card>

      {/*
        Aviso ANTES del formulario (spec S5): los planes ya generados quedan atados a la versión con
        la que se calcularon. Va en la pantalla y no como mensaje posterior al guardado.
      */}
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Guardar abre una versión nueva</Alert.Title>
          <Alert.Description>
            Al guardar, {vigente === null ? "la versión vigente" : `la versión vigente (v${vigente.version})`}{" "}
            se cierra y se crea una nueva con la tabla nutricional corregida. Los planes ya
            generados siguen atados a la versión anterior: sus cantidades no cambian.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <Card
        title="Editar alimento"
        hint={vigente === null ? undefined : `Vigente: v${vigente.version}`}
      >
        <FormAlimento
          modo="edicion"
          restricciones={restricciones}
          alimento={alimento}
          versionVigente={vigente}
        />
      </Card>

      <Card
        title="Historial de versiones"
        hint={
          versionesError
            ? "No disponible"
            : `${versiones?.length ?? 0} ${versiones?.length === 1 ? "versión" : "versiones"}`
        }
      >
        {versiones === null ? (
          <ApiErrorAlert title="No pudimos leer el historial" error={versionesError} />
        ) : (
          <>
            <VersionesAlimento versiones={versiones} />
            <p className="text-xs text-foreground/50">
              Cada guardado deja una versión cerrada con su fecha de vigencia. Es la referencia de
              los planes que ya se generaron con este alimento.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
