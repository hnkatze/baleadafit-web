# Alta de paciente — BaleadaFit Pro

Formulario de admisión clínica completa: los 25 campos de `POST /pacientes`, contra la API real,
con la sesión del nutricionista. Habilita los botones "Nuevo paciente" que hoy están deshabilitados
y desbloquea los datos que faltan en producción (la base tiene 0 pacientes).

## Specs

- **S1** — *"trabajemos en lo que sigue pls"* + alcance elegido: *"Alta completa (todos los campos)"*.
  Un formulario por pasos con la admisión clínica entera, no la versión mínima de 4 campos.
- **S2** — Se cubren **todos** los campos del contrato real de `POST /pacientes`: obligatorios
  (`nombre`, `apellido`, `sexo`, `fechaNacimiento`) y opcionales (`correo`, `telefono`,
  `nivelActividad`, `meta`, `notas`, `restricciones`, `pesoObjetivoKg`, `fechaObjetivo`,
  `estadoFisiologico`, `motivoConsulta`, `alergias`, `cirugias`, `suplementos`, `comidasAlDia`,
  `aguaLitros`, `horasSueno`, `alcohol`, `tabaco`, `quienCocina`, `presupuesto`, `condiciones`).
  Los enums van tal cual los espera la API (`M`/`F`; `SEDENTARIO`…`MUY_INTENSO`;
  `BAJAR`/`MANTENER`/`SUBIR`; `NINGUNO`/`EMBARAZO`/`LACTANCIA`), traducidos solo en la etiqueta.
  `condiciones` y `restricciones` se eligen de `GET /condiciones` y `GET /restricciones` (códigos).
- **S3** — Datos reales: el alta pega contra la API con la sesión del nutricionista. Sin mocks y sin
  datos locales.
- **S4** — Los errores de la API se muestran en español dentro del formulario: el 400 con el detalle
  de campos y el 409 de correo duplicado. Un envío fallido no puede dejar el formulario en estado
  "enviado" ni perder lo cargado.
- **S5** — Al crear el paciente se navega a su ficha (`/pacientes/[id]`), donde se comprueba que un
  paciente **sin mediciones** no rompe las secciones de progreso, requerimiento ni la gráfica.
- **S6** — Los botones "Nuevo paciente" del home y del listado dejan de estar deshabilitados y llevan
  al alta.
- **S7** — Toda lógica pura nueva (validación por paso, armado del payload, etiquetas de enums) entra
  con su test, según la convención de `odd/tasks/tests.md` S2.

## Tasks

- T1 — `apiPost` en `src/lib/api/client.ts`: body JSON, cookie de sesión, `ApiError` que conserva el detalle de validación · S3, S4
- T2 — `src/lib/api/pacientes.ts`: tipos del alta + `crearPaciente`, `getCondiciones`, `getRestricciones` · S2, S3
- T3 — `src/lib/pacientes-form.ts`: etiquetas de enums, validación por paso (rangos incluidos), armado del payload omitiendo vacíos · S2, S7
- T4 — Server action de alta en `src/app/(app)/pacientes/nuevo/actions.ts` + mapeo de error a mensaje · S3, S4
- T5 — `/pacientes/nuevo`: formulario por pasos (identificación, objetivo, condiciones, hábitos) · S1, S2, S4
- T6 — Habilitar los botones "Nuevo paciente" (home y listado) · S6
- T7 — Verificación: `npm test`, lint, build y alta real en el navegador con apertura de la ficha · S2-S5 · padre, 2026-10-31

## Log

- L1 — "trabajemos en lo que sigue pls"
- L2 — Alcance elegido entre tres opciones: *"Alta completa (todos los campos)"* (se descartaron la
  mínima de 4 campos y la intermedia "clínica").
- L3 — Contrato leído del swagger de producción: `POST /pacientes` con 4 obligatorios y 20 opcionales;
  `condiciones`/`restricciones` son `string[]` de **códigos**; rangos numéricos `pesoObjetivoKg` 20-400,
  `comidasAlDia` 1-12, `aguaLitros` 0.2-10, `horasSueno` 0-24. `PATCH /pacientes/{id}` acepta los mismos
  25 campos como opcionales, así que nada queda perdido por completar después.
- L4 — Restricción de diseño: el ID token vive en la cookie httpOnly `bfit_session` (S3 de
  `auth-google.md`), así que **el navegador no puede llamar a la API**. Las mutaciones van por
  **Server Action**; el token nunca llega al cliente. Guía leída:
  `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`.
- L5 — Riesgo a verificar en T7: la ficha de un paciente **sin mediciones** nunca se vio en el portal.
  Hay que confirmar que la gráfica de 0 puntos y los bloques `progreso`/`requerimiento` no explotan.
- L6 — T7 encontró el bug previsto. El alta funcionó (paciente `3543a8c6-22a3-4b4c-a9d5-76db42867600`
  creado y redirect a su ficha), pero la ficha **rompe**: `src/app/(app)/pacientes/[id]/page.tsx:199`
  → `Runtime TypeError: Cannot read properties of null (reading 'tmb')`. La API devuelve
  `requerimiento: null` cuando el paciente no tiene ninguna medición (no hay con qué calcular TMB ni
  gasto), y `evolucion: []`. El resto de la ficha llega bien: `cabecera`, `progreso`, `situacion`,
  `habitos`, `adherencia30d` y `consultas` son objetos, `alertas` trae 2 y `planes` viene vacío.
- L7 — Segundo hallazgo de T7, de datos y no de UI: **el catálogo de condiciones y restricciones está
  vacío en producción**, así que el paso 3 del alta no ofrece nada que elegir (el form lo avisa y deja
  seguir porque son opcionales). Falta correr el seed del catálogo en prod.
- L8 — Arreglo de L6: `src/lib/ficha-estado.ts` con `estadoRequerimiento()` (unión `sin-mediciones` |
  `disponible`) y estado vacío explícito en el bloque de requerimiento. La gráfica ya manejaba 0 y 1
  puntos con su propio `EmptyState`; no se tocó. 77 tests.
- L9 — Verificado en navegador con el mismo paciente, antes y después de una medición:
  sin mediciones → "Todavía no hay requerimiento energético" + "Sin mediciones registradas" en la
  gráfica; con una medición (72.4 kg, 174 cm, 19.5 % grasa) → las cinco tarjetas vuelven (TMB 1,662 ·
  gasto 1,994 · ajuste −500 · objetivo 1,500 kcal · proteína 93.8 g) y las alertas bajan de 2 a 1
  (desaparece "sin medición"). Sin overlay de error en ninguno de los dos estados.
- L10 — Hallazgo de contrato para el futuro módulo de mediciones: el swagger documenta `fuente` como
  string libre, pero la API exige `MANUAL|BASCULA|INBODY|OMRON|OTRO` (400 si no). También: sin
  `nivelActividad` el requerimiento asume factor 1.2 (sedentario).
