# Catálogo de alimentos — BaleadaFit Pro

Módulo de alimentos (issue #7): listado con búsqueda y filtros, alta y edición con el versionado
visible. Es el insumo de los planes: cada alimento tiene una **versión vigente** con su tabla
nutricional, y editar cierra la vigente y abre una nueva.

## Specs

- **S1** — *"avancemos entonces, vamos con los alimentos ?"* + criterio de la issue #7: **"Alta y
  edición"** del catálogo. No es solo lectura: se crea y se edita.
- **S2** — `/alimentos` lista el catálogo real (150 alimentos en producción) y filtra **contra la API**,
  no en memoria, usando los parámetros que existen: `q`, `categoria`, `tipoComida`, `soloTipicos`,
  `excluir` (etiquetas separadas por coma). La entrada "Alimentos" del sidebar deja de estar
  deshabilitada.
- **S3** — Alta en `/alimentos/nuevo` con los campos de `CrearAlimentoDto`: **9 obligatorios**
  (`nombre`, `categoria`, `porcionDescripcion`, `porcionGramos`, `kcal`, `proteinaG`,
  `carbohidratoG`, `grasaG`, `tiposComida`) y 11 opcionales (`fibraG`, `sodioMg`, `potasioMg`,
  `fosforoMg`, `azucaresG`, `grasasSatG`, `indiceGlucemico`, `contiene`, `esTipicoHn`, `fuente`).
  Enums exactos: `categoria` = `PLATO_TIPICO|PROTEINA|CEREAL_TUBERCULO|LEGUMINOSA|LACTEO|FRUTA|VERDURA|GRASA|BEBIDA`;
  `tiposComida` = `DESAYUNO|MERIENDA_AM|ALMUERZO|MERIENDA_PM|CENA` (multi); `contiene` = etiquetas
  que coinciden con los códigos de `GET /restricciones`.
- **S4** — Edición desde la ficha del alimento con `PATCH /alimentos/{id}`: ningún campo es
  obligatorio, así que se envía **solo lo que cambió**, no el objeto entero.
- **S5** — El versionado no es decorativo. `GET /alimentos/{id}/versiones` se muestra como historial
  (versión, vigencia, tabla nutricional) y la edición avisa que guardar **cierra la versión vigente y
  crea una nueva**, porque los planes quedan atados a la versión con la que se generaron.
- **S6** — Los errores de la API se muestran en español, igual que en el alta de pacientes: 400 con
  el detalle de campos, 409 de nombre duplicado, 401/403 y fallo de red.
- **S7** — Toda lógica pura nueva entra con su test (convención de `odd/tasks/tests.md` S2), y la
  suite, el lint y el build siguen verdes.

## Tasks

- T1 — Capa de datos: tipos + `getAlimentos(filtros)`, `getAlimento`, `crearAlimento`, `actualizarAlimento`, `getVersiones` · S2-S5
- T2 — `src/lib/alimentos-form.ts`: etiquetas de enums, validación con rangos, payload de alta y payload de PATCH con solo los campos cambiados · S3, S4, S7
- T3 — Server actions de alta y edición + mapeo de errores a mensajes · S3, S4, S6
- T4 — `/alimentos`: tabla con búsqueda y filtros + navegación habilitada · S2
- T5 — `/alimentos/nuevo`: formulario de alta completo · S3
- T6 — `/alimentos/[id]`: detalle, edición y historial de versiones · S4, S5
- T7 — Verificación: tests, lint, build, y alta + edición reales con las versiones a la vista · S2-S6 · padre, 2026-10-31

## Log

- L1 — "avancemos entonces, vamos con los alimentos ?"
- L2 — La issue #7 pide "Gestión del catálogo" con un único criterio: **"Alta y edición"**. Eso fija el
  alcance: no alcanza con un listado de consulta.
- L3 — Contrato leído del swagger de prod: `GET /alimentos` acepta `q`, `categoria`, `tipoComida`,
  `soloTipicos` y `excluir` (etiquetas por coma). `POST` requiere 9 campos, `PATCH` no requiere
  ninguno y acepta los mismos 20. `GET /alimentos/{id}/versiones` devuelve `version`,
  `vigenteDesde`, `vigenteHasta` y la tabla nutricional de cada versión.
- L4 — Datos: 150 alimentos con 150 versiones iniciales, 87 marcados como típicos hondureños, cargados
  en producción con el seed.
- L5 — Decisión: el listado filtra **por la API** y no en memoria. Duplicar el filtrado en el cliente
  daría dos fuentes de verdad y se desincronizaría del `excluir`, que es semántica clínica (excluir
  alimentos con ciertas etiquetas), no cosmética.
- L6 — Riesgo asumido y visible: editar un alimento **genera una versión nueva**. Los planes ya
  generados quedaron atados a la versión anterior, así que la UI tiene que decirlo antes de guardar,
  no después.
- L7 — **Corrección de contrato (error de esta spec)**: `tabla` **no** es un objeto con los nutrientes.
  Es un `string` con el nombre de la revisión de la tabla de composición (`"Inicial"`, configurable con
  `TABLA_NUTRICIONAL`), y los nutrientes son campos **hermanos** de `version`
  (`../baleadafit-api/src/alimentos/alimento-version.ts`, `datosVersion`). Tipar `tabla` como objeto
  hacía desaparecer de la ficha fibra, azúcares, grasas saturadas, sodio, potasio, fósforo e índice
  glucémico; los macros se salvaban solo por el fallback al alimento.
- L8 — Verificación en producción con el alimento `1efc8386-…` ("Mangú de plátano"): alta real desde
  el formulario, ficha con la tabla nutricional completa (fibra 3.8 g, sodio 8 mg), y tres ediciones
  que produjeron v1 → v2 → v3 con `vigente_hasta` en las anteriores y solo la última vigente.
- L9 — Bug de UX encontrado en esa pasada: el `catch` del formulario trataba la excepción de
  `redirect()` como fallo de red, así que el usuario veía "no se pudo guardar" sobre un guardado que
  sí había ocurrido y quedado versionado. Se detecta el digest `NEXT_REDIRECT` con
  `src/lib/acciones.ts` (`esRedireccionDeNext`, con test) y se relanza.
- L10 — Deuda conocida: los wrappers de campos (`CampoTexto`, `CampoNumero`, `CampoOpciones`) están
  duplicados entre `components/pacientes/form-alta/campos.tsx` y `components/alimentos/form-alimento.tsx`.
  Su lugar sería un módulo compartido; no se hizo para no mezclar refactors con la entrega.
