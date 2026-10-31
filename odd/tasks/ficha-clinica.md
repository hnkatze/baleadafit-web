# Ficha clínica completa + histórico de mediciones — BaleadaFit Pro

La ficha del paciente pasa a mostrar **todo lo que el alta captura**: situación clínica (condiciones,
restricciones, medicación, estado fisiológico, alergias, cirugías, suplementos, motivo) y hábitos, más
un **histórico de mediciones** completo junto a la gráfica de evolución.

## Specs

- **S1** — *"si agrega todo"*. La ficha muestra lo que el alta carga y hoy se pierde. **Situación
  clínica**: condiciones (nombre y descripción del catálogo, más sus notas), restricciones, medicación
  (nombre, dosis, frecuencia, activa o no), estado fisiológico, alergias, cirugías, suplementos y
  motivo de consulta. **Hábitos**: comidas al día, agua, sueño, alcohol, tabaco, quién cocina y
  presupuesto.
- **S2** — *"un historico de mediciones para ver grafica y eso"*. Una sección de histórico lista
  **todas** las mediciones de `GET /pacientes/{id}/mediciones` (no los puntos de `evolucion`, que son
  un resumen): fecha, peso, IMC, % de grasa, cintura, masa muscular, masa grasa, grasa visceral y
  fuente. Más reciente primero. Convive con la gráfica que ya existe.
- **S3** — Datos reales de la API. Cada sección nueva tiene **estado vacío explícito** con el patrón
  que ya usa la ficha (`border-dashed`), nunca una tabla o grilla de guiones mudos.
- **S4** — La `fecha` de una medición es una **fecha de calendario** (medianoche UTC, ver
  `docs/contexto-api.md`): se formatea en **UTC** para no mostrar el día anterior.
- **S5** — Nada de lo ya resuelto se rompe: la ficha de un paciente sin mediciones sigue mostrando su
  estado vacío, la gráfica y el bloque de requerimiento no se tocan, y la suite, el lint y el build
  siguen verdes. Lógica pura nueva con su test.

## Tasks

- T1 — `getMediciones(id)` + `Medicion` (con `imc`) en `src/lib/api/pacientes.ts` · S2, S3
- T2 — `fechaCorta(iso, timeZone)` en `src/lib/format.ts` + test del corrimiento de día · S4, S5
- T3 — `situacion-clinica.tsx`: condiciones, restricciones, medicación, estado fisiológico y antecedentes · S1, S3
- T4 — `habitos-paciente.tsx`: los siete hábitos con su estado vacío · S1, S3
- T5 — `historico-mediciones.tsx`: tabla completa, más reciente primero, con scroll horizontal en mobile · S2, S3, S4
- T6 — Verificación: tests, lint, build y la ficha real de María en el navegador · S1-S5 · padre, 2026-10-31

## Log

- L1 — "si agrega todo, y un historico de mediciones para ver grafica y eso"
- L2 — Estado de datos al arrancar: el paciente `0057129e-8c20-4a00-81ee-ee86d54f9045` (María Isabel
  Hernández Paz) tiene los 25 campos del alta, 2 condiciones (`prediabetes`, `hta`), 1 restricción
  (`lactosa`) y **4 mediciones** con tendencia real: 82.4 kg (15-jul) → 80.9 (20-ago) → 79.6 (25-sep) →
  78.5 (31-oct), IMC 31.4 → 29.9.
- L3 — Hallazgo que origina el pedido: `GET /pacientes/{id}/ficha` devuelve `situacion` y `habitos`
  completos, pero `page.tsx` no tenía **ninguna** referencia a ellos. El alta captura 25 campos y la
  ficha mostraba ~10.
- L4 — Formas del contrato (swagger de prod): `situacion` = `{ estadoFisiologico, condiciones[],
  restricciones[], medicacion[], alergias, cirugias, suplementos, motivoConsulta }`; cada condición es
  `{ notas, condicion: { codigo, nombre, descripcion } }`, cada restricción `{ restriccion: {...} }` y
  cada medicamento `{ nombre, dosis, frecuencia, activo }`. `habitos` = 3 números y 4 textos, todos
  nullable. `GET /pacientes/{id}/mediciones` no pagina y ya devuelve `imc` calculado.
- L5 — Decisión: el histórico lee `GET /pacientes/{id}/mediciones`, no `evolucion`. `evolucion` sirve
  para la gráfica (resumen), pero el histórico tiene que ser la lista completa con todas las columnas.
- L6 — Entrega: `situacion` y `habitos` ahora sí se renderizan, más el histórico de 9 columnas. Detalle
  del contrato que confirmó el worker contra el service del API: `/mediciones` devuelve orden
  **ascendente**, así que el descendente se hace en el componente. 79 tests.
- L7 — Verificación del padre en el navegador con datos reales. Ficha de María: Situación clínica
  (Prediabetes y Hipertensión arterial con su descripción, restricción "Sin lácteos / lactosa",
  alergias/cirugías/suplementos, motivo), Hábitos con los 7 valores, gráfica con **dos series** (peso
  82.4→78.5 y grasa 34.8→32.4 %) e histórico de 4 filas en orden descendente con la fuente traducida
  (Manual, Báscula, InBody). Ficha del paciente mínimo: estados vacíos "Sin situación clínica
  cargada" y "Sin hábitos cargados", histórico con 1 fila, sin errores.
- L8 — Deuda anotada: `tabla-pacientes.tsx` tiene su propio `fechaCorta` local duplicado; conviene
  unificarlo con el de `format.ts` en una próxima pasada (no se hizo por superficies de edición).
