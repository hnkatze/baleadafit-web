# Auth con Google (Firebase) — BaleadaFit Pro

Primer tramo de la issue #2: login real con Google, sesión del lado del servidor y el
token viajando a la API en cada request.

## Specs

- **S1** — *"usa esas credenciales, ya habilite el proveedor de google"*. El login usa
  **Google** (`signInWithPopup`, con fallback a redirect si el popup se bloquea) contra el
  proyecto `baleadafit`. No se usa email/contraseña porque ese proveedor no está habilitado.
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

- T1 — Cliente Firebase (`src/lib/firebase/client.ts`) + env · S1, S2
- T2 — `/login` con "Continuar con Google", estados de carga/error · S1
- T3 — `POST/DELETE /api/session` con cookie httpOnly y refresh desde el cliente · S3
- T4 — `apiGet` prioriza la sesión sobre el dev token · S4
- T5 — Logout en el perfil del sidebar · S5
- T6 — Verificación: build, lint, navegador y chequeo independiente por ser cambio de auth · S1-S5

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
