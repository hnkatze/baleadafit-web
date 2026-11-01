"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { Xmark } from "@gravity-ui/icons";
import { CATEGORIA_OPCIONES, TIPO_COMIDA_OPCIONES } from "@/lib/alimentos-form";
import {
  SIN_FILTROS,
  etiquetasExcluidas,
  queryDeFiltros,
  type FiltrosActivos,
} from "@/lib/alimentos-filtros";

/**
 * El `Select` de HeroUI no tiene opción vacía, así que "Todas" es una clave centinela que se
 * traduce a `""` (sin filtro) al leer el control. Mismo recurso que el `__sin_definir__` del alta
 * de pacientes.
 */
const TODAS = "__todas__";

type Opcion = { value: string; label: string };

/** Un `Select` de filtro nunca está vacío: la primera opción es el "sin filtro". */
function conTodas(opciones: readonly Opcion[]): Opcion[] {
  return [{ value: TODAS, label: "Todas" }, ...opciones];
}

/** Lo que tarda el texto en viajar a la URL: sin esto cada tecla pide el catálogo entero. */
const DEBOUNCE_MS = 250;

/** La query string de una URL de `/alimentos`, para comparar lo enviado con lo aplicado. */
function query(filtros: FiltrosActivos): string {
  return queryDeFiltros(filtros).toString();
}

export function FiltrosAlimentos({ filtros: aplicados }: { filtros: FiltrosActivos }) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<FiltrosActivos>(aplicados);
  /** El primer render no navega: la URL ya está en el estado inicial. */
  const primerRender = useRef(true);
  /** La última query que mandamos nosotros, para distinguirla de la que trae atrás/adelante. */
  const enviada = useRef(query(aplicados));

  // Atrás/adelante cambian la URL sin pasar por los controles: si la query aplicada no es la
  // nuestra, la pantalla se vuelve a sincronizar con ella.
  useEffect(() => {
    const aplicada = query(aplicados);

    if (aplicada === enviada.current) return;

    enviada.current = aplicada;
    setFiltros(aplicados);
  }, [aplicados]);

  // Cada cambio reescribe la URL, porque el filtrado lo hace la API y no la tabla (spec S2).
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }

    const siguiente = query(filtros);

    if (siguiente === enviada.current) return;

    const id = setTimeout(() => {
      enviada.current = siguiente;
      router.push(siguiente.length > 0 ? `/alimentos?${siguiente}` : "/alimentos", {
        scroll: false,
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [filtros, router]);

  const cambiar = (cambios: Partial<FiltrosActivos>) =>
    setFiltros((previo) => ({ ...previo, ...cambios }));

  const excluidas = etiquetasExcluidas(filtros.excluir);
  const hayFiltros = query(filtros).length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-surface p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <TextField
            fullWidth
            name="q"
            value={filtros.q}
            onChange={(valor) => cambiar({ q: valor })}
          >
            <Label>Buscar</Label>
            <Input type="search" placeholder="Nombre del alimento" />
          </TextField>
        </div>

        <Select
          fullWidth
          name="categoria"
          value={filtros.categoria.length > 0 ? filtros.categoria : TODAS}
          onChange={(clave) =>
            cambiar({ categoria: clave === null || String(clave) === TODAS ? "" : String(clave) })
          }
        >
          <Label>Categoría</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {conTodas(CATEGORIA_OPCIONES).map((opcion) => (
                <ListBox.Item key={opcion.value} id={opcion.value} textValue={opcion.label}>
                  {opcion.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          fullWidth
          name="tipoComida"
          value={filtros.tipoComida.length > 0 ? filtros.tipoComida : TODAS}
          onChange={(clave) =>
            cambiar({
              tipoComida: clave === null || String(clave) === TODAS ? "" : String(clave),
            })
          }
        >
          <Label>Tiempo de comida</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {conTodas(TIPO_COMIDA_OPCIONES).map((opcion) => (
                <ListBox.Item key={opcion.value} id={opcion.value} textValue={opcion.label}>
                  {opcion.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <div className="sm:col-span-2">
          <TextField
            fullWidth
            name="excluir"
            value={filtros.excluir}
            onChange={(valor) => cambiar({ excluir: valor })}
          >
            <Label>Excluir etiquetas</Label>
            <Input placeholder="gluten, lactosa" />
            <Description>
              Saca del listado los alimentos que contengan alguna de estas etiquetas.
            </Description>
          </TextField>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:justify-end">
          <Checkbox
            isSelected={filtros.soloTipicos}
            onChange={(seleccionado) => cambiar({ soloTipicos: seleccionado })}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              Solo típicos hondureños
            </Checkbox.Content>
          </Checkbox>

          {hayFiltros ? (
            <Button variant="tertiary" size="sm" onPress={() => setFiltros(SIN_FILTROS)}>
              <Xmark className="size-4" />
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      {excluidas.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground/50">Se excluyen:</span>
          {excluidas.map((etiqueta) => (
            <Chip key={etiqueta} size="sm" color="danger" variant="soft">
              {etiqueta}
            </Chip>
          ))}
        </div>
      ) : null}
    </section>
  );
}
