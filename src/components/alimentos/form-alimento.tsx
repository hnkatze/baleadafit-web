"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from "@heroui/react";
import { Check } from "@gravity-ui/icons";
import { actualizarAlimentoAction, crearAlimentoAction } from "@/app/(app)/alimentos/actions";
import { esRedireccionDeNext } from "@/lib/acciones";
import type { Alimento, AlimentoVersion } from "@/lib/api/alimentos";
import {
  CATEGORIA_OPCIONES,
  TIPO_COMIDA_OPCIONES,
  validarAlimento,
  valoresDeAlimento,
  type ResultadoAlimento,
  type ValoresAlimento,
} from "@/lib/alimentos-form";

/**
 * Etiqueta de `GET /restricciones`. El formulario guarda el `codigo` (cerdo, gluten, huevo,
 * lactosa, mani, mariscos) y muestra el `nombre`, igual que el alta de pacientes.
 */
export type EtiquetaContiene = { codigo: string; nombre: string };

type Opcion = { value: string; label: string };

/** Los numéricos del contrato de alimentos (spec S3). */
type CampoNumero =
  | "porcionGramos"
  | "kcal"
  | "proteinaG"
  | "carbohidratoG"
  | "grasaG"
  | "fibraG"
  | "azucaresG"
  | "grasasSatG"
  | "indiceGlucemico"
  | "sodioMg"
  | "potasioMg"
  | "fosforoMg";

type DefinicionNumero = {
  campo: CampoNumero;
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
  min?: number;
  max?: number;
  step: number;
};

/** Los 11 campos de la tabla nutricional, en el orden en que se leen. */
const CAMPOS_NUMERICOS: DefinicionNumero[] = [
  { campo: "kcal", etiqueta: "Calorías (kcal)", obligatorio: true, min: 0, max: 3000, step: 1 },
  { campo: "proteinaG", etiqueta: "Proteína (g)", obligatorio: true, min: 0, step: 0.1 },
  { campo: "carbohidratoG", etiqueta: "Carbohidratos (g)", obligatorio: true, min: 0, step: 0.1 },
  { campo: "grasaG", etiqueta: "Grasa (g)", obligatorio: true, min: 0, step: 0.1 },
  { campo: "fibraG", etiqueta: "Fibra (g)", min: 0, step: 0.1 },
  { campo: "azucaresG", etiqueta: "Azúcares (g)", min: 0, step: 0.1 },
  { campo: "grasasSatG", etiqueta: "Grasas saturadas (g)", min: 0, step: 0.1 },
  { campo: "indiceGlucemico", etiqueta: "Índice glucémico", min: 0, step: 1 },
  { campo: "sodioMg", etiqueta: "Sodio (mg)", min: 0, step: 1 },
  { campo: "potasioMg", etiqueta: "Potasio (mg)", min: 0, step: 1 },
  { campo: "fosforoMg", etiqueta: "Fósforo (mg)", min: 0, step: 1 },
];

type PropsCampo = {
  nombre: string;
  etiqueta: string;
  obligatorio?: boolean;
  error?: string;
  ayuda?: string;
};

function CampoTexto({
  nombre,
  etiqueta,
  valor,
  onCambio,
  error,
  obligatorio,
  ayuda,
  placeholder,
}: PropsCampo & {
  valor?: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      fullWidth
      isRequired={obligatorio}
      isInvalid={error !== undefined}
      name={nombre}
      value={valor ?? ""}
      onChange={onCambio}
    >
      <Label>{etiqueta}</Label>
      <Input placeholder={placeholder} />
      {ayuda ? <Description>{ayuda}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

function CampoNumero({
  definicion,
  valor,
  onCambio,
  error,
}: {
  definicion: DefinicionNumero;
  valor?: string;
  onCambio: (valor: string) => void;
  error?: string;
}) {
  const { campo, etiqueta, obligatorio, ayuda, min, max, step } = definicion;

  return (
    <TextField
      fullWidth
      isRequired={obligatorio}
      isInvalid={error !== undefined}
      name={campo}
      value={valor ?? ""}
      onChange={onCambio}
    >
      <Label>{etiqueta}</Label>
      <Input type="number" inputMode="decimal" min={min} max={max} step={step} />
      {ayuda ? <Description>{ayuda}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

function CampoSelect({
  nombre,
  etiqueta,
  valor,
  opciones,
  onCambio,
  error,
  obligatorio,
  ayuda,
}: PropsCampo & {
  valor?: string;
  opciones: readonly Opcion[];
  onCambio: (valor: string | undefined) => void;
}) {
  return (
    <Select
      fullWidth
      isRequired={obligatorio}
      isInvalid={error !== undefined}
      name={nombre}
      placeholder="Elegí una opción"
      value={valor === undefined || valor === "" ? null : valor}
      onChange={(clave) => onCambio(clave === null ? undefined : String(clave))}
    >
      <Label>{etiqueta}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      {ayuda ? <Description>{ayuda}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <Select.Popover>
        <ListBox>
          {opciones.map((opcion) => (
            <ListBox.Item key={opcion.value} id={opcion.value} textValue={opcion.label}>
              {opcion.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function CampoOpciones({
  etiqueta,
  ayuda,
  opciones,
  seleccion,
  onCambio,
  error,
  obligatorio,
  vacio,
}: {
  etiqueta: string;
  ayuda?: string;
  opciones: readonly Opcion[];
  seleccion: readonly string[];
  onCambio: (valores: string[]) => void;
  error?: string;
  obligatorio?: boolean;
  /** Qué mostrar cuando el catálogo llegó vacío. */
  vacio: string;
}) {
  if (opciones.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{etiqueta}</p>
        <p className="text-xs text-foreground/50">{vacio}</p>
      </div>
    );
  }

  return (
    <CheckboxGroup
      isRequired={obligatorio}
      value={[...seleccion]}
      onChange={onCambio}
      className="flex flex-col gap-2"
    >
      <Label>{etiqueta}</Label>
      {ayuda ? <Description>{ayuda}</Description> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {opciones.map((opcion) => (
          <Checkbox key={opcion.value} value={opcion.value}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {opcion.label}
            </Checkbox.Content>
          </Checkbox>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </CheckboxGroup>
  );
}

type Props = {
  modo: "alta" | "edicion";
  restricciones: EtiquetaContiene[];
  /** Solo en edición: el alimento que se está editando. */
  alimento?: Alimento;
  /** Solo en edición: versión vigente, de donde salen los nutrientes que la ficha no trae. */
  versionVigente?: AlimentoVersion | null;
};

/**
 * Formulario del catálogo (T5 alta, T6 edición). Un solo formulario para los dos modos: la única
 * diferencia es de dónde salen los valores iniciales y a qué Server Action se envía.
 *
 * La validación de `validarAlimento` corre acá para guiar y otra vez en la Server Action, que
 * revalida y además arma el diff del `PATCH` (spec S4). El camino feliz de las dos actions hace
 * `redirect()`, así que la promesa del cliente no resuelve: el botón queda pendiente y el formulario
 * nunca se resetea. Solo vuelve el control cuando hay error o cuando la edición no cambió nada.
 */
export function FormAlimento({ modo, restricciones, alimento, versionVigente = null }: Props) {
  // Los originales quedan congelados: son la referencia contra la que la action arma el diff.
  const [originales] = useState<ValoresAlimento>(
    alimento === undefined ? {} : valoresDeAlimento(alimento, versionVigente),
  );
  const [valores, setValores] = useState<ValoresAlimento>(originales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [sinCambios, setSinCambios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const esEdicion = modo === "edicion" && alimento !== undefined;

  /** Escribe un campo y desmarca su error: el mensaje no sobrevive a la corrección. */
  function set<C extends keyof ValoresAlimento>(campo: C, valor: ValoresAlimento[C]) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => {
      if (previos[campo] === undefined) return previos;

      const siguientes = { ...previos };
      delete siguientes[campo];

      return siguientes;
    });
    setSinCambios(false);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    const delCliente = validarAlimento(valores);

    if (Object.keys(delCliente).length > 0) {
      setErrores(delCliente);
      setErrorGeneral("Revisá los campos marcados antes de guardar el alimento.");
      return;
    }

    setErrores({});
    setErrorGeneral(null);
    setSinCambios(false);
    setEnviando(true);

    try {
      const resultado: ResultadoAlimento | undefined =
        alimento === undefined
          ? await crearAlimentoAction(valores)
          : await actualizarAlimentoAction(alimento.id, originales, valores);

      // Con el redirect de la action en curso la promesa no resuelve: no se toca nada más.
      if (resultado === undefined) return;

      if (!resultado.ok) {
        setErrorGeneral(resultado.error);
        setErrores(resultado.errores ?? {});
        setEnviando(false);

        return;
      }

      // Edición sin cambios: la action no llamó al API, así que no hay redirect ni versión nueva.
      setSinCambios(resultado.sinCambios);
      setEnviando(false);
    } catch (error) {
      // `redirect()` sí llega acá: viaja como excepción de control de flujo de Next. Si se trata
      // como fallo, el usuario ve "no se pudo guardar" sobre un guardado que ocurrió y quedó
      // versionado. Se relanza para que el framework navegue.
      if (esRedireccionDeNext(error)) throw error;

      setErrorGeneral(
        "No pudimos guardar el alimento. Revisá la conexión e intentá de nuevo: los datos siguen cargados.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Identificación</h2>
          <span className="text-xs text-foreground/50">Los campos con * son obligatorios</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            nombre="nombre"
            etiqueta="Nombre"
            obligatorio
            valor={valores.nombre}
            onCambio={(valor) => set("nombre", valor)}
            error={errores.nombre}
            ayuda="Es único en el catálogo: si ya existe, la API lo rechaza."
          />
          <CampoSelect
            nombre="categoria"
            etiqueta="Categoría"
            obligatorio
            opciones={CATEGORIA_OPCIONES}
            valor={valores.categoria}
            onCambio={(valor) => set("categoria", valor)}
            error={errores.categoria}
          />
          <div className="sm:col-span-2">
            <CampoTexto
              nombre="porcionDescripcion"
              etiqueta="Descripción de la porción"
              obligatorio
              placeholder="1 taza cocida"
              valor={valores.porcionDescripcion}
              onCambio={(valor) => set("porcionDescripcion", valor)}
              error={errores.porcionDescripcion}
              ayuda="Cómo se mide la porción en la casa; los gramos van en el campo siguiente."
            />
          </div>
          <CampoNumero
            definicion={{
              campo: "porcionGramos",
              etiqueta: "Porción (gramos)",
              obligatorio: true,
              min: 1,
              max: 2000,
              step: 1,
            }}
            valor={valores.porcionGramos}
            onCambio={(valor) => set("porcionGramos", valor)}
            error={errores.porcionGramos}
          />
          <div className="sm:col-span-2">
            <CampoOpciones
              etiqueta="Tiempos de comida"
              obligatorio
              ayuda="Los planes buscan alimentos por tiempo de comida, así que hace falta al menos uno."
              opciones={TIPO_COMIDA_OPCIONES}
              seleccion={valores.tiposComida ?? []}
              onCambio={(codigos) => set("tiposComida", codigos)}
              error={errores.tiposComida}
              vacio="El listado de tiempos de comida llegó vacío."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Switch
            isSelected={valores.esTipicoHn === true}
            onChange={(seleccionado) => set("esTipicoHn", seleccionado)}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label>Típico hondureño</Label>
            </Switch.Content>
          </Switch>
          <p className="text-xs text-foreground/50">
            Marcá el alimento si es parte de la comida típica de Honduras: el listado y los planes
            lo pueden filtrar por eso.
          </p>
        </div>

        <CampoTexto
          nombre="fuente"
          etiqueta="Fuente"
          placeholder="Tabla de composición de alimentos del INCAP"
          valor={valores.fuente}
          onCambio={(valor) => set("fuente", valor)}
          error={errores.fuente}
          ayuda="De dónde salió la tabla nutricional: etiqueta del producto, INCAP o USDA."
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Tabla nutricional</h2>
          <span className="text-xs text-foreground/50">Por la porción declarada arriba</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS_NUMERICOS.map((definicion) => (
            <CampoNumero
              key={definicion.campo}
              definicion={definicion}
              valor={valores[definicion.campo]}
              onCambio={(valor) => set(definicion.campo, valor)}
              error={errores[definicion.campo]}
            />
          ))}
        </div>

        <p className="text-xs text-foreground/50">
          Los micronutrientes son opcionales: si no hay dato, dejá el campo vacío en vez de poner
          cero. Un cero afirma que el alimento no aporta ese nutriente.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">Contiene</h2>
          <span className="text-xs text-foreground/50">Etiquetas de restricción</span>
        </div>

        <CampoOpciones
          etiqueta="Alérgenos y restricciones"
          ayuda="Lo que un plan tiene que excluir cuando el paciente tiene esa restricción."
          opciones={restricciones.map((restriccion) => ({
            value: restriccion.codigo,
            label: restriccion.nombre,
          }))}
          seleccion={valores.contiene ?? []}
          onCambio={(etiquetas) => set("contiene", etiquetas)}
          error={errores.contiene}
          vacio="No pudimos cargar las etiquetas de restricción: el resto del formulario sí se puede guardar."
        />
      </section>

      {errorGeneral === null ? null : (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No se pudo guardar el alimento</Alert.Title>
            <Alert.Description>{errorGeneral}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {sinCambios ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Sin cambios</Alert.Title>
            <Alert.Description>
              No modificaste ningún campo, así que el alimento conserva su versión vigente: no se
              generó una versión nueva.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="submit" isPending={enviando} isDisabled={enviando}>
          <Check className="size-4" />
          {esEdicion ? "Guardar cambios" : "Crear alimento"}
        </Button>
      </div>
    </form>
  );
}
