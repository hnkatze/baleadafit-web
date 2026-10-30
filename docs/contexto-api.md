# Contexto de la API para el portal (BO)

Este repo es el **portal web de la nutricionista** (Next.js 16.4.3 + React 19.3). Todo lo que muestra viene de la API de BaleadaFit, que vive en un repo aparte: `../baleadafit-api`.

Este documento es el contrato de trabajo con esa API: cómo levantarla, cómo autenticar, qué endpoint usa cada pantalla, y las reglas que el portal **no** debe romper. Escrito el 2026-10-29, al cerrar la sesión que dejó la API lista para este portal.

---

## 1. Dónde está la API

- Repo local: `C:/Users/Camilo/proyectos/baleadafit-api` · remoto `https://github.com/hnkatze/baleadafit-api.git`
- Rama a usar: **`feat/alimentos-versionados`** (es el tope de tres ramas apiladas; `main` todavía no tiene nada de esto).
- Stack: NestJS 12 (ESM), Prisma 7, PostgreSQL 16, Firebase Auth, AWS Bedrock (opcional).
- Documentación viva: Swagger en `http://localhost:3000/docs` y el JSON en `http://localhost:3000/docs-json` (`docs/openapi.json` está versionado en ese repo).

### Levantarla

```bash
cd ../baleadafit-api
docker compose up -d          # Postgres 16 (TZ=UTC)
cp .env.example .env          # si no existe
npm install                   # genera el cliente de Prisma
npm run db:migrate            # aplica las 4 migraciones
npm run db:seed               # 6 restricciones, 20 condiciones, 150 alimentos
npm run start:dev             # http://localhost:3000
```

### Autenticación

- El API **verifica** el ID token de Firebase; **no emite ni renueva tokens**. La sesión la mantiene el SDK del cliente (`onAuthStateChanged` / `onIdTokenChanged` y `getIdToken()` antes de cada llamada).
- Para desarrollar sin Firebase, con `AUTH_DEV_BYPASS=true` (ya viene así en el `.env` de desarrollo) alcanza con este encabezado:

```
Authorization: Bearer dev:<uid>:<correo>
```

Cuentas de prueba ya registradas en la base local:

| Token | Rol |
|---|---|
| `dev:nutri-1:nutri@correo.hn` | nutricionista ("Lic. Sofía Herrera") con 1 paciente y 7 planes |
| `dev:nutri-2:otra@correo.hn` | segunda nutricionista, sin pacientes (sirve para probar aislamiento) |
| `dev:pac-1:ana@correo.hn` | paciente (Ana, vinculada por correo) |

- Roles: `nutricionista`, `paciente`, `sin_perfil`. `GET /auth/me` devuelve `{ rol, perfil }` y es lo primero que llama el portal después del login. Con rol `sin_perfil`, la única acción posible es `POST /auth/registro-nutricionista` (`nombre` obligatorio; `colegiado` y `telefono` opcionales).
- `403` = el rol no aplica · `401` = falta el token · `404` = el recurso no existe **o es de otra nutricionista** (el API no distingue, a propósito).

---

## 2. Endpoint por pantalla

Las seis rutas del alcance del proyecto (`/login`, `/dashboard`, `/pacientes`, `/pacientes/[id]`, `/pacientes/[id]/plan`, `/alimentos`, `/agenda`).

### `/login`
| Método | Ruta | Para qué |
|---|---|---|
| GET | `/auth/me` | Resolver rol y perfil; decidir navegación |
| POST | `/auth/registro-nutricionista` | Alta cuando el rol es `sin_perfil` |

### `/dashboard`
| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/dashboard` | `{ pacientesActivos, planesEnBorrador, citasHoy[] }` |
| GET | `/ia/estado` | `{ habilitado, modelo?, region, ultimaLlamada }` — para mostrar si la IA está conectada |
| POST | `/ia/estado/probar` | Verifica credenciales de Bedrock (llamada real de 16 tokens) |

### `/pacientes`
| Método | Ruta | Notas |
|---|---|---|
| GET | `/pacientes?q=&incluirInactivos=` | Trae `ultimaMedicion` y `planActivo` aplanados. **Sin paginación todavía** |
| POST | `/pacientes` | Acepta `restricciones` y `condiciones` por **código** |
| DELETE | `/pacientes/:id` | Baja lógica (`activo: false`) |

### `/pacientes/[id]` — la ficha
**Recomendado: una sola llamada.**

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/pacientes/:id/ficha` | Todo: `cabecera` (edad, IMC clasificado, composición con su fecha, masa magra), `progreso` (delta, ritmo, proyección), `situacion`, `habitos`, `requerimiento`, `adherencia30d`, `alertas[]`, `evolucion[]`, `consultas{pasadas,proximas}`, `planes[]` con `tablas` |

Alternativa granular (por si se necesita algo puntual): `GET /pacientes/:id` (detalle clásico), `GET /pacientes/:id/requerimiento`, `GET /pacientes/:id/adherencia?desde=&hasta=`, `GET /pacientes/:id/mediciones`.

Edición y seguimiento:

| Método | Ruta | Notas |
|---|---|---|
| PATCH | `/pacientes/:id` | Acepta todos los campos clínicos y `condiciones[]` (reemplaza el set). Enviar `null` **borra** `fechaObjetivo`; omitirlo no lo toca |
| GET | `/condiciones` | Catálogo de 20 condiciones con `codigo` y la descripción de **qué implican en el plan** |
| GET | `/restricciones` | Catálogo de restricciones alimentarias |
| POST | `/pacientes/:id/mediciones` | Peso y talla obligatorios; composición corporal opcional; `fuente` (`MANUAL`/`BASCULA`/`INBODY`/`OMRON`/`OTRO`). Devuelve `imc` |
| DELETE | `/mediciones/:id` | — |
| POST | `/pacientes/:id/medicamentos` · PATCH/DELETE `/medicamentos/:id` | El DELETE es **baja lógica**: conserva historial |

### `/pacientes/[id]/plan`
| Método | Ruta | Notas |
|---|---|---|
| GET | `/pacientes/:id/planes` | Historial de planes del paciente |
| POST | `/pacientes/:id/planes/generar` | Body: `{ nombre?, usarIa?, kcalObjetivo?, distribucionMacros?, distribucionTiempos?, indicaciones? }`. Devuelve un **BORRADOR** |
| GET | `/planes/:id` | Detalle con `totales` por tiempo y del día: kcal, macros, **fibra, sodio, potasio, fósforo, azúcares, grasa saturada y carga glucémica**, más `desviacion` contra la meta |
| PATCH | `/planes/:id` | Nombre, etc. |
| PUT | `/planes/:id/tiempos/:tipo/items` | Reemplaza los ítems de un tiempo de comida (`tipo`: `DESAYUNO`, `MERIENDA_AM`, `ALMUERZO`, `MERIENDA_PM`, `CENA`) |
| POST | `/planes/:id/activar` | Activa y **archiva** el anterior en una transacción |
| DELETE | `/planes/:id` | — |

### `/alimentos`
| Método | Ruta | Notas |
|---|---|---|
| GET | `/alimentos?q=&categoria=&tipoComida=&excluir=lactosa,gluten&soloTipicos=` | **Sin paginación todavía**. El parámetro es `tipoComida`, no `tipo` |
| GET | `/alimentos/:id` | Detalle |
| POST · PATCH | `/alimentos` · `/alimentos/:id` | Al cambiar un valor nutricional o de porción se abre una **versión nueva** del alimento |
| GET | `/alimentos/:id/versiones` | Historial: `version`, `tabla`, `vigenteDesde`, `vigenteHasta` y los valores |

Categorías: `PLATO_TIPICO`, `PROTEINA`, `CEREAL_TUBERCULO`, `LEGUMINOSA`, `LACTEO`, `FRUTA`, `VERDURA`, `GRASA`, `BEBIDA`.

### `/agenda`
| Método | Ruta | Notas |
|---|---|---|
| GET | `/citas?desde=&hasta=&pacienteId=&estado=` | Fechas ISO 8601 con zona |
| POST | `/citas` | `{ pacienteId, fechaHora, duracionMin?, motivo?, notas? }`; valida choques de horario |
| PATCH | `/citas/:id` | `estado` (`PROGRAMADA`/`COMPLETADA`/`CANCELADA`), SOAP (`subjetivo`, `objetivo`, `analisis`, `plan`) y `proximaCitaSugerida` (`YYYY-MM-DD`) |

---

## 3. Reglas que el portal no debe romper

1. **Fechas: todo en UTC.** Las fechas de calendario (`fechaObjetivo`, `proximaCitaSugerida`, `medicion.fecha`) se mandan como `YYYY-MM-DD` y el API las guarda como medianoche UTC del día enviado. Los instantes (`cita.fechaHora`) son ISO con zona y se muestran en GMT-6. La "fecha de hoy" del servidor es el día UTC: a partir de las 18:00 en Honduras ya es el día siguiente, así que **mandá la fecha local** cuando pidas algo del día.
2. **El `plan` de una cita no es el plan de comida**: es el "P" del SOAP. En la UI rotularlo "Plan de la consulta".
3. **Los planes quedan atados a la versión de la tabla nutricional** que usaron. Corregir un alimento en el catálogo **no cambia** los planes existentes: si querés un plan con los valores nuevos, hay que regenerarlo. El campo `tablas` de la ficha dice con qué revisión se calculó cada plan.
4. **`condiciones` y `restricciones` van por `codigo`**, no por id. Código inexistente = `400` con la lista de los que faltaron.
5. **Errores**: `{ statusCode, message, error }`. Los de validación traen `message` como **array** de strings.
6. **No hay paginación** en `/pacientes` ni `/alimentos`: traer todo y filtrar en el cliente hasta que exista.
7. **El objetivo de peso puede ser `null`** para borrarlo, pero `undefined` (campo ausente) significa "no tocar".

---

## 4. Datos de la semilla (para maquetar con datos reales)

- 150 alimentos hondureños con macros, fibra, sodio, potasio, fósforo, azúcares, grasa saturada e índice glucémico (valores **estimados**, a verificar con INCAP).
- 20 condiciones clínicas con su descripción de qué cambian en el plan; 6 restricciones.
- Paciente "Ana López": 31 años, IMC 28.7, prediabetes + HTA, restricción de lactosa, 7 mediciones, 7 planes (uno ACTIVO).
- Cita programada con SOAP de ejemplo.

---

## 5. Pendientes del API que afectan al portal

| Pendiente | Impacto en el BO |
|---|---|
| **Umbrales por condición (sodio, carga glucémica)** — esperando decisión clínica | Hoy la ficha **no** alerta por exceso de sodio. Cuando exista, aparece sola en `alertas[]` y no hay que tocar el portal |
| Paginación en `/pacientes` y `/alimentos` | Con muchos registros, traer todo no escala |
| `PATCH /pacientes/:id` con correo duplicado responde 500 | Mostrar un mensaje genérico hasta que sea 409 |
| Despliegue en Railway | El portal todavía tiene que apuntar a `localhost:3000` |

Detalle profundo de cada decisión y su evidencia: `odd/tasks/*.md` en el repo de la API (`alineacion-semana2`, `expediente-clinico`, `nutrientes-clinicos`, `alimentos-versionados`, `ficha-del-paciente`).

---

## 6. Stack sugerido para este portal

Lo que declara el alcance del proyecto: **Next.js App Router**, **Tailwind + shadcn/ui**, **TanStack Query** para el consumo de la API y el **SDK de Firebase** para la sesión.

Primer paso recomendado, en este orden:

1. Cliente de API tipado (`src/lib/api.ts`) con el token de Firebase inyectado y el manejo unificado de `{ statusCode, message }`.
2. Guard de sesión en el layout del dashboard + `GET /auth/me` para resolver rol.
3. `/dashboard` (una sola llamada) → valida el circuito completo contra la API real.
4. `/pacientes/[id]` con `GET /pacientes/:id/ficha`: es la pantalla que decide si el producto se siente clínico.

> Nota sobre Next 16: este proyecto tiene reglas de agente generadas por `next dev` en `AGENTS.md`. Antes de escribir código, leer `node_modules/next/dist/docs/` (esa versión tiene cambios de API respecto de versiones anteriores).
