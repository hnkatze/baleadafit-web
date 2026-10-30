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

- T1 — `src/lib/api/pacientes.ts`: tipos (Paciente, FichaPaciente) + `getPacientes`, `getFicha` · S4
- T2 — `/pacientes`: tabla con búsqueda y acceso a la ficha · S1, S3, S4 · commit
- T3 — `/pacientes/[id]`: cabecera, progreso, requerimiento, adherencia, alertas y gráfica de evolución · S1, S3, S4, S5 · commit
- T4 — Navegación: habilitar "Pacientes" en el sidebar · S1 · commit
- T5 — Verificación por slice: build, lint y navegador (desktop + mobile) · S1-S5

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
