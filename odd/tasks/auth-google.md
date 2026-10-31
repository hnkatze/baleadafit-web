# Auth con Google (Firebase) — BaleadaFit Pro

Primer tramo de la issue #2: login real con Google, sesión del lado del servidor y el
token viajando a la API en cada request.

## Specs

- **S1** — *"podemos habilitar con correo y contrasena tambien pls, tambien esta habilitado en el auth"*.
  El login acepta **dos métodos**: Google (`signInWithPopup`, con fallback a redirect si el popup se
  bloquea) y **correo/contraseña** (`signInWithEmailAndPassword`). Los dos emiten el mismo ID token
  de Firebase y pasan por la misma cookie de sesión; ninguno crea un camino de auth propio.
- **S6** — *"ve indexando el swagger /docs-json"*. La superficie de la API de producción
  (`https://api-pro.baleadafit.com/docs-json`) queda indexada como referencia de trabajo:
  **32 endpoints** en `auth` (2), `salud` (1), `dashboard` (1), `pacientes` (14), `catálogo` (7),
  `planes` (7), `citas` (3), `ia` (2) y `mi cuenta` (6). No existe endpoint de login: el ID token
  lo emite siempre el cliente (Firebase), igual para los dos métodos de S1.
- **S7** — El mensaje de error de una página respeta el status real del API: 403 no se muestra como
  "la API no responde". Un 403 significa sesión válida sin perfil clínico vinculado (`firebaseUid`); un 401,
  sesión rechazada; solo un fallo de red habla de `API_URL` y `.env.local`.
- **S2** — Las credenciales Web de Firebase son configuración **pública** (viajan en el bundle):
  van en `NEXT_PUBLIC_FIREBASE_*` dentro de `.env.local` y documentadas en `.env.example`.
  Nunca se versionan credenciales de service account.
- **S3** — La sesión se guarda en una cookie **httpOnly** `bfit_session` emitida por un route
  handler (`POST /api/session`) a partir del ID token, y se limpia con `DELETE /api/session`.
  El cliente la refresca cuando Firebase rota el token (`onIdTokenChanged`).
- **S4** — `apiGet` (server) usa el token de la cookie; si no hay sesión cae al `API_DEV_TOKEN`
  para no romper el desarrollo. La API sigue siendo la autoridad final (verifica el token).
- **S5** — Cerrar sesión desde el shell (botón en el perfil del sidebar) y volver a `/login`.

## Tasks

- T1 — Cliente Firebase (`src/lib/firebase/client.ts`) + env · S1, S2 · `de1ecaf`
- T2 — `/login` con "Continuar con Google", estados de carga/error · S1 · `de1ecaf`
- T3 — `POST/DELETE /api/session` con cookie httpOnly y refresh desde el cliente · S3 · `de1ecaf`
- T4 — `apiGet` prioriza la sesión sobre el dev token · S4 · `de1ecaf`
- T5 — Logout en el perfil del sidebar · S5 · `de1ecaf`
- T6 — Verificación: build, lint, navegador y chequeo independiente por ser cambio de auth · S1-S5 · `de1ecaf`
- T7 — Login con correo/contraseña (`signInWithEmailAndPassword`) junto al botón de Google · S1 · pendiente de commit
- T8 — Índice del swagger de producción (`/docs-json`) como contrato de referencia · S6 · pendiente de commit
- T9 — `ApiErrorAlert` compartido: el status del error manda el mensaje (403 sin perfil, 401 sesión, 0 red) · S7 · pendiente de commit
- T10 — Alta del perfil de nutricionista en producción (verificar correo + `POST /auth/registro-nutricionista`) · S7 · sin cambio de código

## Log

- L1 — "crear el env const firebaseConfig = {...}; usa esas credenciales, ya habilite el proveedor
  de google para el auth, para que empecemos a conectar algunas cosas"
- L2 — Config entregada: projectId `baleadafit`, authDomain `baleadafit.firebaseapp.com`,
  appId `1:840274381799:web:fd2a69767d20188ed4cb42`.
- L3 — Del lado del API los tres valores `FIREBASE_*` del service account siguen vacíos y
  `AUTH_DEV_BYPASS=true`: hasta cargarlos, un token real de Google será rechazado por el API
  ("Firebase no está configurado en el servidor") aunque el login funcione en el portal.
- L4 — El guard del API resuelve el rol por `firebaseUid`: el primer login real va a devolver
  `sin_perfil` hasta actualizar `nutricionista.firebaseUid` con el UID de Firebase.
- L5 — Verificación independiente (gentle-ai-verify): sin bloqueantes en S1-S5. Hallazgo Medium real:
  `request.json()` ignora el content-type, así que un form `text/plain` cross-site podía plantar la cookie
  con el token de un atacante (login CSRF / session fixation). Corregido: el route exige
  `application/json` (415), valida `Origin` contra `Host` (403) y limita el token a 4096 chars (400).
- L6 — Comprobado después del fix: sin Origin 403, Origin ajeno 403, text/plain 415, token de 9 KB 400,
  Origin correcto 204. Cookie sigue `HttpOnly; SameSite=lax; Path=/; Max-Age=3600`.
- L7 — "ya tenemos api api-pro.baleadafit.com". Verificado: `/docs-json` 200, `/dashboard` 401 sin token,
  y los tres endpoints devuelven 401 con `dev:nutri-1:...` → **el dev bypass no existe en producción**.
- L8 — "podemos habilitar con correo y contrasena tambien pls, tambien esta habilitado en el auth y ve
  indexando el swagger /docs-json". Correo/contraseña habilitado en Firebase: se sumó al form (S1).
  Swagger de prod indexado: 32 endpoints, sin POST de login (S6).
- L9 — Decisión del form de correo: `user-not-found`, `wrong-password` e `invalid-credential` colapsan en
  **un solo** mensaje ("Correo o contraseña incorrectos.") para no revelar qué correos clínicos existen, y
  no se valida el largo mínimo de contraseña en el cliente porque Firebase ya es la autoridad (una regla
  más estricta acá dejaría afuera cuentas válidas).
- L10 — `.env.local` y `.env.example` quedan bloqueados por la política del harness (rutas sensibles): el
  apunte a `api-pro` se hace levantando el server con `API_URL=https://api-pro.baleadafit.com`, y el cambio
  permanente en los `.env*` lo hace el humano.
- L11 — "playercamiloh504@gmail.com 123456 me funciono": el login con correo/contraseña entra al shell. La
  contraseña **no** se guarda en memoria.
- L12 — Comprobado con el ID token real de esa cuenta contra prod: `GET /auth/me` → **200**
  `{"rol":"sin_perfil","perfil":null}` (Firebase Admin **sí** está configurado en el API),
  `GET /dashboard` y `GET /pacientes` → **403** `No tienes permiso para este recurso.`
- L13 — Consecuencia de L12: el bloqueo no es de auth sino de datos. Falta vincular
  `nutricionista.firebaseUid = GVBP1uwbZGMMkT1F8VmXvjujZrv1` en la base que usa la API de prod (escritura de datos:
  requiere autorización explícita del humano).
- L14 — "si dale actualiza" (autorización para escribir). Al ir a la base de prod por `railway ssh` se descubre que
  **`nutricionista` tiene 0 filas**: no hay nada que actualizar, hay que crear el perfil. El `sin_perfil` era
  ausencia de perfil, no un uid mal vinculado.
- L15 — La cuenta `playercamiloh504@gmail.com` tiene `email_verified: false` (claim del ID token, proveedor `password`),
  así que `POST /auth/registro-nutricionista` devolvería 403. Se disparó el mail de verificación de Firebase
  (`accounts:sendOobCode`, requestType `VERIFY_EMAIL`).
- L16 — Credenciales de prod expuestas: `railway variables` imprimió la contraseña de Postgres y la
  `FIREBASE_PRIVATE_KEY` completas en el transcript. Hay que rotarlas. No se guardaron en memoria.
- L17 — "ya esta verificado". Alta completada por la vía diseñada, sin tocar la base a mano:
  `POST /auth/registro-nutricionista` con `{"nombre":"Lic. Camilo Henriquez"}` → **201**,
  id `46358776-9c74-4b01-a507-729344a61df2`. Después: `GET /auth/me` 200 `rol: nutricionista`,
  `GET /dashboard` 200 `{pacientesActivos:0,planesEnBorrador:0,citasHoy:[]}`, `GET /pacientes` 200 `[]`.
  En el portal: sidebar "Lic. Camilo Henriquez · Nutricionista", saludo "¡Hola, Camilo!", KPIs en 0, sin alerta.
- L18 — El token emitido **antes** del alta siguió sirviendo: el guard resuelve el rol por request, no hace falta re-loguear.
