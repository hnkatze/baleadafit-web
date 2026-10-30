# Pacientes (listado + ficha) — BaleadaFit Pro

Módulo de pacientes del portal clínico: listado con búsqueda y ficha del paciente con
evolución de mediciones. Cubre la issue #4 ("Tabla con búsqueda" + "Gráfica de mediciones").

## Specs

- **S1** — *"vamos con el modulo de pacientes"*. Dos rutas dentro del shell existente:
  `/pacientes` (listado) y `/pacientes/[id]` (ficha del paciente).
- **S2** — *"pero vamos haciendo los commits pls"*. Un commit por slice revisable, con
  Conventional Commits, sin atribución de IA, y build + lint verificados antes de commitear.
- **S3** — Issue #4: el listado es una **tabla con búsqueda** por nombre/apellido y el detalle
  incluye la **gráfica de mediciones** (evolución de peso y % de grasa).
- **S4** — Datos reales, sin mocks: `GET /pacientes` para el listado y `GET /pacientes/{id}/ficha`
  para el detalle (que ya trae `cabecera`, `progreso`, `requerimiento`, `adherencia30d`,
  `evolucion`, `alertas`, `planes`). Si la API no responde, la página muestra una alerta en vez
  de romperse (mismo criterio que el home).
- **S5** — Nada de dependencias nuevas para la gráfica: se dibuja con SVG propio a partir de
  `evolucion` (`fecha`, `pesoKg`, `pctGrasa`).

## Tasks

- T1 — `src/lib/api/pacientes.ts`: tipos (Paciente, FichaPaciente) + `getPacientes`, `getFicha` · S4 · `e14873e`, `7fd60f1`
- T2 — `/pacientes`: tabla con búsqueda y acceso a la ficha · S1, S3, S4 · `e14873e`
- T3 — `/pacientes/[id]`: cabecera, progreso, requerimiento, adherencia, alertas y gráfica de evolución · S1, S3, S4, S5 · `7fd60f1`
- T4 — Navegación: habilitar "Pacientes" en el sidebar · S1 · `e14873e`
- T5 — Verificación por slice: build, lint y navegador (desktop + mobile) · S1-S5 · `e14873e`, `7fd60f1`

## Log

- L1 — "vamos con el modulo de pacientes, pero vamos haciendo los commits pls"
- L2 — Contrato verificado contra la API con dev bypass:
  `GET /pacientes` → array con `id, nombre, apellido, sexo, fechaNacimiento, meta, activo,
  ultimaMedicion{pesoKg,tallaCm,pctGrasa,fecha}, planActivo{id,nombre}|null`.
  `GET /pacientes/{id}/ficha` → `{paciente, cabecera{edad,imc,clasificacionImc,pctGrasa,...},
  progreso{pesoInicial,pesoActual,deltaKg,ritmoKgSemana,proyeccionKg},
  situacion{condiciones,restricciones,medicacion,...}, habitos{...},
  requerimiento{medicion,edad,tmb,factorActividad,gastoTotal,ajusteMeta,kcalObjetivo,proteinaG},
  adherencia30d{porcentaje,cumplidos,total}, alertas[], evolucion[7], consultas{proximas,pasadas},
  planes[]}`.
- L3 — Verificación: `npm run build` exit 0 (`ƒ /pacientes`, `◐ /pacientes/[id]`), `eslint src` limpio, listado y
  ficha completos revisados en el navegador contra la API real (Ana Lopez: IMC 28.7 sobrepeso, 34% grasa,
  TMB 1,418 / objetivo 1,450 kcal / proteína 90.6 g, adherencia 100%, 7 planes).
- L4 — Hallazgos de contrato corregidos en el camino: `adherencia30d.porcentaje` viene como fracción 0..1
  (se normaliza ×100); `progreso.ritmoKgSemana` y `proyeccionKg` llegan `null`; las 7 entradas de `evolucion`
  comparten fecha, así que el eje X es el orden de medición y no tiempo proporcional; las fechas de
  calendario (nacimiento, mediciones) se formatean en UTC porque la API las guarda a medianoche UTC.
- L5 — Pendientes: el botón "Nuevo paciente" sigue deshabilitado (falta `POST /pacientes`), `notFound()`
  muestra el 404 por defecto en inglés (falta `not-found.tsx` en español), y las ramas de 0/1 medición de la
  gráfica están inspeccionadas pero no ejecutadas porque la base tiene un solo paciente con 7 registros.
