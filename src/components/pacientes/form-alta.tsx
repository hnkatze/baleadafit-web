"use client";

import { useState } from "react";
import { ArrowChevronLeft, ArrowChevronRight, Check } from "@gravity-ui/icons";
import { Alert, Button, ProgressBar, cn } from "@heroui/react";
import { crearPacienteAction } from "@/app/(app)/pacientes/nuevo/actions";
import type { OpcionCatalogo } from "@/lib/api/pacientes";
import {
  PASOS,
  validarFormulario,
  validarPaso,
  type CampoPaciente,
  type ResultadoAlta,
  type ValoresPaciente,
} from "@/lib/pacientes-form";
import {
  PasoCondiciones,
  PasoHabitos,
  PasoIdentificacion,
  PasoObjetivo,
  type PropsPaso,
} from "./form-alta/pasos";

type Props = {
  condiciones: OpcionCatalogo[];
  restricciones: OpcionCatalogo[];
};

/** Índice del primer paso que contiene alguno de los campos con error. */
function pasoConError(errores: Record<string, string>): number {
  return PASOS.findIndex((paso) => paso.campos.some((campo) => errores[campo] !== undefined));
}

/**
 * Alta de paciente por pasos (T5). La validación de cada paso es `validarPaso` de
 * `@/lib/pacientes-form`: la misma que revalida la Server Action, así que acá solo guía.
 *
 * El envío llama a `crearPacienteAction`. En el camino feliz esa action hace `redirect()`: el
 * promise del cliente no resuelve y el router navega a la ficha, por eso el botón queda pendiente y
 * nunca se resetea el formulario. Solo un `ok: false` devuelve el control acá.
 */
export function FormAlta({ condiciones, restricciones }: Props) {
  const [valores, setValores] = useState<ValoresPaciente>({});
  const [indice, setIndice] = useState(0);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const paso = PASOS[indice];
  const esUltimo = indice === PASOS.length - 1;
  const progreso = Math.round(((indice + 1) / PASOS.length) * 100);

  /** Escribe un campo y desmarca su error: el mensaje no sobrevive a la corrección. */
  function set<C extends CampoPaciente>(campo: C, valor: ValoresPaciente[C]) {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => {
      if (previos[campo] === undefined) return previos;

      const siguientes = { ...previos };
      delete siguientes[campo];

      return siguientes;
    });
  }

  function irA(indiceNuevo: number) {
    setErrores({});
    setErrorGeneral(null);
    setIndice(indiceNuevo);
  }

  /** Atrás / Siguiente: el paso actual tiene que estar limpio para avanzar. */
  function siguiente() {
    const delPaso = validarPaso(paso.id, valores);

    if (Object.keys(delPaso).length > 0) {
      setErrores(delPaso);
      return;
    }

    irA(indice + 1);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    // Todos los pasos, no solo el visible: la Server Action valida lo mismo y no se confía del orden.
    const todos = validarFormulario(valores);

    if (Object.keys(todos).length > 0) {
      const primero = pasoConError(todos);

      setErrores(todos);
      setErrorGeneral("Revisá los campos marcados antes de crear el paciente.");
      if (primero >= 0) setIndice(primero);

      return;
    }

    setErrores({});
    setErrorGeneral(null);
    setEnviando(true);

    try {
      const resultado: ResultadoAlta | undefined = await crearPacienteAction(valores);

      if (resultado !== undefined && !resultado.ok) {
        setErrorGeneral(resultado.error);
        setErrores(resultado.errores ?? {});
        setEnviando(false);

        const primero = resultado.errores ? pasoConError(resultado.errores) : -1;
        if (primero >= 0) setIndice(primero);
      }
      // Con `ok: true` el redirect de la action ya está en curso: no se toca nada más.
    } catch {
      setErrorGeneral("No pudimos crear el paciente. Revisá la conexión e intentá de nuevo.");
      setEnviando(false);
    }
  }

  const compartido: PropsPaso = { valores, errores, set };

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{paso.titulo}</h2>
          <span className="text-xs text-foreground/50">
            Paso {indice + 1} de {PASOS.length}
          </span>
        </div>

        <ProgressBar
          aria-label={`Paso ${indice + 1} de ${PASOS.length}`}
          value={progreso}
          size="sm"
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        <ol className="flex flex-wrap gap-x-4 gap-y-1">
          {PASOS.map((cadaPaso, posicion) => (
            <li
              key={cadaPaso.id}
              aria-current={posicion === indice ? "step" : undefined}
              className={cn(
                "text-xs font-semibold",
                posicion === indice
                  ? "text-brand-deep"
                  : posicion < indice
                    ? "text-foreground/70"
                    : "text-foreground/40",
              )}
            >
              {posicion + 1}. {cadaPaso.titulo}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface p-5">
        {paso.id === "identificacion" ? <PasoIdentificacion {...compartido} /> : null}
        {paso.id === "objetivo" ? <PasoObjetivo {...compartido} /> : null}
        {paso.id === "condiciones" ? (
          <PasoCondiciones
            {...compartido}
            condiciones={condiciones}
            restricciones={restricciones}
          />
        ) : null}
        {paso.id === "habitos" ? <PasoHabitos {...compartido} /> : null}
      </section>

      {errorGeneral === null ? null : (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>No se pudo crear el paciente</Alert.Title>
            <Alert.Description>{errorGeneral}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="tertiary"
          isDisabled={indice === 0 || enviando}
          onPress={() => irA(indice - 1)}
        >
          <ArrowChevronLeft className="size-4" />
          Atrás
        </Button>

        {esUltimo ? (
          <Button type="submit" isPending={enviando} isDisabled={enviando}>
            {enviando ? null : <Check className="size-4" />}
            {enviando ? "Creando…" : "Crear paciente"}
          </Button>
        ) : (
          <Button type="button" onPress={siguiente}>
            Siguiente
            <ArrowChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
