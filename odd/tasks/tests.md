# Red de tests del portal — BaleadaFit Pro

Infraestructura de tests para el portal: runner instalado, lógica pura extraída a módulos
testeables y cobertura de lo ya entregado (auth, capa de API, mensajes de error, formato de
fechas). Convención: toda unidad nueva entra con su test.

## Specs

- **S1** — *"vamos con los test de lo que vamos haciendo y de lo nuevo"*. Se testea lo ya
  entregado: login (Google y correo/contraseña), mensajes de error de la API por status, y
  formato de fechas/valores del home y la ficha.
- **S2** — *"hagamos test de lo que vamos haciendo pls"*. Convención permanente: cada unidad de
  comportamiento nueva trae su test en el mismo cambio, no en un ticket aparte.
- **S3** — Los tests corren con **un comando** (`npm test`), sin red, sin base de datos y sin
  navegador: deterministas y aptos para correr en cada cambio.
- **S4** — Para poder testear sin DOM no se testea el componente: la lógica pura (mensajes,
  formateo, mapeo de errores) vive en módulos propios. El comportamiento visible **no cambia**;
  solo se mueve de lugar.
- **S5** — El runner no rompe el flujo actual: `npm run lint` y `npm run build` siguen pasando, y
  `/login` sigue prerenderizado como estático.

## Tasks

- T1 — Vitest: devDependency, `vitest.config.ts` con alias `@/`, script `npm test` · S3, S5 · `vitest@4.1.12`, sin commit
- T2 — `src/lib/api/error-message.ts`: mapeo status → mensaje, fuera del componente; tests · S1, S4 · sin commit
- T3 — `src/lib/firebase/errors.ts`: códigos de Firebase → mensaje, fuera del form; tests · S1, S4 · sin commit
- T4 — `src/lib/format.ts`: fechas UTC / instantes GMT-6 / valores nulos / nombre; tests · S1, S4 · sin commit
- T5 — Tests de `src/lib/api/client.ts`: precedencia de token y `ApiError` por status · S1 · sin commit
- T6 — Verificación: `npm test`, `npm run lint`, `npm run build` · S3, S5 · padre, 2026-10-31

## Log

- L1 — "dale, vamos con los test de lo que vamos haciendo y de lo nuevo, hagamos test de lo que vamos haciendo pls"
- L2 — Estado al arrancar: el repo no tenía ningún test, ni runner instalado. Lo entregado hasta acá
  (login Google + correo/contraseña, `ApiErrorAlert`, home, pacientes, ficha) se verificó a mano
  en navegador y con `curl`, nunca con tests.
- L3 — Decisión: tests en `node` (sin jsdom ni Testing Library). La lógica que importa —mensajes,
  formateo de fechas, precedencia de token— es pura; testear componentes exigiría DOM y no agrega
  señal sobre las reglas que realmente duelen (fechas UTC, 403 vs 401, no enumerar cuentas).
- L4 — Reglas que estos tests deben clavar, tomadas de `docs/contexto-api.md` y de lo aprendido:
  fechas de calendario se formatean en **UTC** (el día se adelanta después de las 18:00 en HN),
  instantes en **GMT-6**; `user-not-found` / `wrong-password` / `invalid-credential` colapsan en un
  solo mensaje; un 403 **no** es una caída de la API.
- L5 — Implementación delegada a `gentle-ai-worker` (contexto del padre en el backstop). Entrega:
  vitest 4.1.12 (la 5.x exige `@types/node` ^22 y el repo tiene ^20, cambio fuera de alcance),
  `src/lib/{format,firebase/errors,api/error-message}.ts` + 4 archivos de test, **29 tests**.
- L6 — Verificación del padre (no se creyó el reporte): `npm test` 29/29, `npm run lint` limpio,
  `npx tsc --noEmit` limpio, `npm run build` OK con `/login` todavía estático, y el home en el
  navegador renderiza igual que antes del refactor ("¡Hola, Camilo!", KPIs en 0, sin alerta).
- L7 — Corregido en la revisión: el JSDoc de `todayLabel` afirmaba la regla UTC pero el default es
  `America/Tegucigalpa`; ahora aclara que el default es para instantes y que una fecha de calendario
  del API necesita `"UTC"` explícito. El test ya cubría el corrimiento de día en ambas zonas.
- L8 — Aviso aceptado sin acción: `vitest.config.ts` dispara un warning de Vite por ESM cargado como
  CJS. Se arregla con `.mts`; se deja `.ts` para no cambiar la convención del repo. No rompe nada.
