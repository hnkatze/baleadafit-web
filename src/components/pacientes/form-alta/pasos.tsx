"use client";

import type { OpcionCatalogo } from "@/lib/api/pacientes";
import {
  ESTADO_FISIOLOGICO_OPCIONES,
  META_OPCIONES,
  NIVEL_ACTIVIDAD_OPCIONES,
  SEXO_OPCIONES,
  type CampoPaciente,
  type ValoresPaciente,
} from "@/lib/pacientes-form";
import { CampoOpciones, CampoSelect, CampoTexto, CampoTextoLargo } from "./campos";

/** Lo que cada paso recibe del formulario: los valores, los errores por campo y el setter. */
export type PropsPaso = {
  valores: ValoresPaciente;
  errores: Record<string, string>;
  set: <C extends CampoPaciente>(campo: C, valor: ValoresPaciente[C]) => void;
};

/** Paso 1: los cuatro obligatorios (S2) más el contacto. */
export function PasoIdentificacion({ valores, errores, set }: PropsPaso) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoTexto
        nombre="nombre"
        etiqueta="Nombre"
        obligatorio
        autoComplete="given-name"
        valor={valores.nombre}
        onCambio={(valor) => set("nombre", valor)}
        error={errores.nombre}
      />
      <CampoTexto
        nombre="apellido"
        etiqueta="Apellido"
        obligatorio
        autoComplete="family-name"
        valor={valores.apellido}
        onCambio={(valor) => set("apellido", valor)}
        error={errores.apellido}
      />
      <CampoSelect
        nombre="sexo"
        etiqueta="Sexo"
        obligatorio
        opciones={SEXO_OPCIONES}
        valor={valores.sexo}
        onCambio={(valor) => set("sexo", valor)}
        error={errores.sexo}
      />
      <CampoTexto
        nombre="fechaNacimiento"
        etiqueta="Fecha de nacimiento"
        obligatorio
        tipo="date"
        valor={valores.fechaNacimiento}
        onCambio={(valor) => set("fechaNacimiento", valor)}
        error={errores.fechaNacimiento}
      />
      <CampoTexto
        nombre="correo"
        etiqueta="Correo electrónico"
        tipo="email"
        autoComplete="email"
        placeholder="paciente@correo.hn"
        valor={valores.correo}
        onCambio={(valor) => set("correo", valor)}
        error={errores.correo}
      />
      <CampoTexto
        nombre="telefono"
        etiqueta="Teléfono"
        tipo="tel"
        autoComplete="tel"
        placeholder="+504 9999-9999"
        valor={valores.telefono}
        onCambio={(valor) => set("telefono", valor)}
      />
    </div>
  );
}

/** Paso 2: la meta clínica y su fecha. */
export function PasoObjetivo({ valores, errores, set }: PropsPaso) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoSelect
        nombre="meta"
        etiqueta="Meta"
        opciones={META_OPCIONES}
        valor={valores.meta}
        onCambio={(valor) => set("meta", valor)}
        error={errores.meta}
        opcional="Sin definir"
      />
      <CampoSelect
        nombre="estadoFisiologico"
        etiqueta="Estado fisiológico"
        opciones={ESTADO_FISIOLOGICO_OPCIONES}
        valor={valores.estadoFisiologico}
        onCambio={(valor) => set("estadoFisiologico", valor)}
        error={errores.estadoFisiologico}
        opcional="Sin definir"
        ayuda="Embarazo y lactancia cambian el requerimiento energético."
      />
      <CampoTexto
        nombre="pesoObjetivoKg"
        etiqueta="Peso objetivo (kg)"
        tipo="number"
        inputMode="decimal"
        min={20}
        max={400}
        step={0.1}
        valor={valores.pesoObjetivoKg}
        onCambio={(valor) => set("pesoObjetivoKg", valor)}
        error={errores.pesoObjetivoKg}
      />
      <CampoTexto
        nombre="fechaObjetivo"
        etiqueta="Fecha objetivo"
        tipo="date"
        valor={valores.fechaObjetivo}
        onCambio={(valor) => set("fechaObjetivo", valor)}
        error={errores.fechaObjetivo}
      />
      <div className="sm:col-span-2">
        <CampoTextoLargo
          nombre="motivoConsulta"
          etiqueta="Motivo de consulta"
          placeholder="Qué la trae a la consulta, en sus palabras."
          valor={valores.motivoConsulta}
          onCambio={(valor) => set("motivoConsulta", valor)}
        />
      </div>
    </div>
  );
}

/** Paso 3: los dos catálogos de la API, elegidos por código. */
export function PasoCondiciones({
  valores,
  set,
  condiciones,
  restricciones,
}: PropsPaso & { condiciones: OpcionCatalogo[]; restricciones: OpcionCatalogo[] }) {
  return (
    <div className="grid gap-6">
      <CampoOpciones
        etiqueta="Condiciones clínicas"
        ayuda="Diagnósticos que la API usa para ajustar el requerimiento y las alertas."
        opciones={condiciones}
        seleccion={valores.condiciones ?? []}
        onCambio={(codigos) => set("condiciones", codigos)}
        vacio="El catálogo de condiciones llegó vacío: se puede completar más tarde en la ficha."
      />
      <CampoOpciones
        etiqueta="Restricciones alimentarias"
        ayuda="Lo que el plan no debe incluir."
        opciones={restricciones}
        seleccion={valores.restricciones ?? []}
        onCambio={(codigos) => set("restricciones", codigos)}
        vacio="El catálogo de restricciones llegó vacío: se puede completar más tarde en la ficha."
      />
    </div>
  );
}

/** Paso 4: hábitos, antecedentes y notas libres. */
export function PasoHabitos({ valores, errores, set }: PropsPaso) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CampoSelect
        nombre="nivelActividad"
        etiqueta="Nivel de actividad"
        opciones={NIVEL_ACTIVIDAD_OPCIONES}
        valor={valores.nivelActividad}
        onCambio={(valor) => set("nivelActividad", valor)}
        error={errores.nivelActividad}
        opcional="Sin definir"
      />
      <CampoTexto
        nombre="comidasAlDia"
        etiqueta="Comidas al día"
        tipo="number"
        inputMode="numeric"
        min={1}
        max={12}
        valor={valores.comidasAlDia}
        onCambio={(valor) => set("comidasAlDia", valor)}
        error={errores.comidasAlDia}
      />
      <CampoTexto
        nombre="aguaLitros"
        etiqueta="Agua al día (litros)"
        tipo="number"
        inputMode="decimal"
        min={0.2}
        max={10}
        step={0.1}
        valor={valores.aguaLitros}
        onCambio={(valor) => set("aguaLitros", valor)}
        error={errores.aguaLitros}
      />
      <CampoTexto
        nombre="horasSueno"
        etiqueta="Horas de sueño"
        tipo="number"
        inputMode="decimal"
        min={0}
        max={24}
        step={0.5}
        valor={valores.horasSueno}
        onCambio={(valor) => set("horasSueno", valor)}
        error={errores.horasSueno}
      />
      <CampoTexto
        nombre="alcohol"
        etiqueta="Consumo de alcohol"
        placeholder="Ocasional, los fines de semana…"
        valor={valores.alcohol}
        onCambio={(valor) => set("alcohol", valor)}
      />
      <CampoTexto
        nombre="tabaco"
        etiqueta="Tabaco"
        placeholder="No fuma, medio paquete al día…"
        valor={valores.tabaco}
        onCambio={(valor) => set("tabaco", valor)}
      />
      <CampoTexto
        nombre="quienCocina"
        etiqueta="¿Quién cocina?"
        valor={valores.quienCocina}
        onCambio={(valor) => set("quienCocina", valor)}
      />
      <CampoTexto
        nombre="presupuesto"
        etiqueta="Presupuesto semanal"
        valor={valores.presupuesto}
        onCambio={(valor) => set("presupuesto", valor)}
      />
      <div className="sm:col-span-2">
        <CampoTextoLargo
          nombre="suplementos"
          etiqueta="Suplementos"
          placeholder="Qué toma, desde cuándo y en qué dosis."
          valor={valores.suplementos}
          onCambio={(valor) => set("suplementos", valor)}
        />
      </div>
      <CampoTextoLargo
        nombre="alergias"
        etiqueta="Alergias"
        valor={valores.alergias}
        onCambio={(valor) => set("alergias", valor)}
      />
      <CampoTextoLargo
        nombre="cirugias"
        etiqueta="Cirugías"
        valor={valores.cirugias}
        onCambio={(valor) => set("cirugias", valor)}
      />
      <div className="sm:col-span-2">
        <CampoTextoLargo
          nombre="notas"
          etiqueta="Notas"
          placeholder="Cualquier cosa que la ficha tenga que recordar."
          valor={valores.notas}
          onCambio={(valor) => set("notas", valor)}
        />
      </div>
    </div>
  );
}
