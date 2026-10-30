# Home (shell + dashboard) — BaleadaFit Pro

Módulo de entrada del portal de la nutricionista: shell de navegación, saludo con datos
reales de la API y KPIs del día. Referencia visual: pantalla de Stitch "Dashboard Principal".

## Specs

- **S1** — Logo: *"agregamos un nuevo logo usemso ese"*. Se usan los isotipos nuevos de Stitch
  (arco de baleada + línea de pulso): `Clinic` (claro) como principal y `Pro` (navy) para
  superficies oscuras. Reemplazan al logo anterior en `/login`, en el icono de la app y en el shell.
- **S2** — Home: *"vamos trabajando en el modulo de home"*. Ruta `/` dentro del shell de la app:
  sidebar con navegación del panel clínico, topbar con buscador y usuario, y contenido con saludo,
  KPIs del día, próximas citas y accesos rápidos.
- **S3** — Los datos del home salen de la API real, no de mocks: `GET /dashboard`
  (`pacientesActivos`, `planesEnBorrador`, `citasHoy`) y `GET /auth/me` (nombre del nutricionista),
  autenticando con `AUTH_DEV_BYPASS` (`Authorization: Bearer dev:<uid>:<correo>`) mientras no
  exista Firebase Auth (issue #2). Ver `docs/contexto-api.md`.
- **S4** — El diseño respeta el tema de marca ya definido: esmeralda (#10B981), Plus Jakarta Sans,
  superficies claras, tarjetas con borde suave y estados de navegación activos en verde.

## Tasks

- T1 — Logo nuevo (componente + icono + reemplazo en login) · S1 · `c7b57c0`
- T2 — Cliente de API server-side (`src/lib/api`) · S3 · `014d2eb`
- T3 — Shell de la app: sidebar + topbar · S2, S4 · `014d2eb`
- T4 — Home `/` con saludo, KPIs, citas y accesos rápidos · S2, S3, S4 · `014d2eb`
- T5 — Verificación (build, lint, navegador desktop/mobile) · S1-S4 · `014d2eb`

## Log

- L1 — "agregamos un nuevo logo usemso ese, y vamos trabajando en el modulo de home"
- L2 — Referencias: Stitch "BaleadaFit Pro - Isotipo Minimalista", "BaleadaFit Clinic - Isotipo
  Monograma (Versión Blanca)", "Dashboard Principal - BaleadaFit Pro".
- L3 — API verificada con dev bypass: `/dashboard` = `{"pacientesActivos":1,"planesEnBorrador":6,"citasHoy":[]}`,
  `/auth/me` = `{"rol":"nutricionista","perfil":{"nombre":"Lic. Sofia Herrera",...}}`.
- L4 — Verificación (T5): `npm run build` exit 0 (`ƒ /` dinámica, `○ /login` estática), `eslint src` limpio,
  desktop 1440 y mobile 390 revisados en el navegador con datos reales de la API.
- L5 — Bug encontrado en verificación y corregido: `CitaHoy` declaraba `horaInicio`/`horaFin`/`modalidad`,
  pero la API manda `fechaHora` + `duracionMin`; con una cita agendada `horaLabel(undefined)` rompía `/`.
  También `/auth/me` puede devolver `perfil: null`.
- L6 — Pendientes abiertos por decisión de producto: (a) la API no expone `modalidad` de la cita (chip oculto),
  (b) no hay guard por rol para `perfil: null`, (c) falta navegación en mobile, (d) `.env*` corregido con
  `!.env.example`.
