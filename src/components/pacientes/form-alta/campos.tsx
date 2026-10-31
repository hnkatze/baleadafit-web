"use client";

import {
  Checkbox,
  CheckboxGroup,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";
import type { OpcionCatalogo } from "@/lib/api/pacientes";

/**
 * El Select no acepta una opción vacía: para los campos opcionales el "sin definir" es una clave
 * centinela que se traduce a `undefined` al salir del componente.
 */
const SIN_DEFINIR = "__sin_definir__";

export type Opcion = { value: string; label: string };

type PropsBase = {
  etiqueta: string;
  obligatorio?: boolean;
  error?: string;
  ayuda?: string;
};

type PropsTexto = PropsBase & {
  nombre: string;
  valor?: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
  tipo?: React.ComponentProps<"input">["type"];
  autoComplete?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  min?: number;
  max?: number;
  step?: number;
};

/** Campo de una línea. `error` viene de `validarPaso` (o de la Server Action) y desmarca al escribir. */
export function CampoTexto({
  nombre,
  etiqueta,
  valor,
  onCambio,
  error,
  obligatorio,
  ayuda,
  placeholder,
  tipo,
  autoComplete,
  inputMode,
  min,
  max,
  step,
}: PropsTexto) {
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
      <Input
        placeholder={placeholder}
        type={tipo}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        step={step}
      />
      {ayuda ? <Description>{ayuda}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

/** Campo largo para notas y antecedentes. */
export function CampoTextoLargo({
  nombre,
  etiqueta,
  valor,
  onCambio,
  error,
  obligatorio,
  ayuda,
  placeholder,
}: PropsTexto) {
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
      <TextArea rows={3} placeholder={placeholder} />
      {ayuda ? <Description>{ayuda}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  );
}

type PropsSelect = PropsBase & {
  nombre: string;
  valor?: string;
  opciones: readonly Opcion[];
  onCambio: (valor: string | undefined) => void;
  placeholder?: string;
  /** Texto de la opción que deja el campo vacío. Sin esto, el campo no se puede limpiar. */
  opcional?: string;
};

/** Select de un enum. El `value` es el código de la API y el texto es la etiqueta traducida. */
export function CampoSelect({
  nombre,
  etiqueta,
  valor,
  opciones,
  onCambio,
  error,
  obligatorio,
  ayuda,
  placeholder = "Elegí una opción",
  opcional,
}: PropsSelect) {
  const items: Opcion[] = opcional ? [{ value: SIN_DEFINIR, label: opcional }, ...opciones] : [...opciones];

  return (
    <Select
      fullWidth
      isRequired={obligatorio}
      isInvalid={error !== undefined}
      name={nombre}
      placeholder={placeholder}
      value={valor === undefined || valor === "" ? null : valor}
      onChange={(clave) => {
        const codigo = clave === null ? SIN_DEFINIR : String(clave);
        onCambio(codigo === SIN_DEFINIR ? undefined : codigo);
      }}
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
          {items.map((opcion) => (
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

type PropsOpciones = {
  etiqueta: string;
  ayuda?: string;
  opciones: readonly OpcionCatalogo[];
  seleccion: readonly string[];
  onCambio: (codigos: string[]) => void;
  /** Qué mostrar cuando el catálogo llegó vacío. */
  vacio: string;
};

/** Grupo de checkboxes para los catálogos: se guarda el `codigo`, se muestra el `nombre`. */
export function CampoOpciones({
  etiqueta,
  ayuda,
  opciones,
  seleccion,
  onCambio,
  vacio,
}: PropsOpciones) {
  if (opciones.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{etiqueta}</p>
        <p className="text-xs text-foreground/50">{vacio}</p>
      </div>
    );
  }

  return (
    <CheckboxGroup value={[...seleccion]} onChange={onCambio} className="flex flex-col gap-2">
      <Label>{etiqueta}</Label>
      {ayuda ? <Description>{ayuda}</Description> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {opciones.map((opcion) => (
          <Checkbox key={opcion.codigo} value={opcion.codigo}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {opcion.nombre}
            </Checkbox.Content>
          </Checkbox>
        ))}
      </div>
    </CheckboxGroup>
  );
}
