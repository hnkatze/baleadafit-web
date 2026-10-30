<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Contexto de producto

Este repo es el **portal web de la nutricionista** (BO) del proyecto BaleadaFit. Consume la API del repo hermano `../baleadafit-api` (NestJS + Prisma).

**Antes de escribir código, leer `docs/contexto-api.md`**: tiene cómo levantar la API, los tokens de desarrollo, el endpoint de cada pantalla con sus parámetros, las reglas que no se deben romper (fechas UTC, versiones del catálogo, códigos de condición) y los pendientes conocidos.

Datos de referencia rápida:
- API local: `http://localhost:3000` · Swagger en `/docs` · JSON en `/docs-json`
- Rama de la API con todo lo nuevo: `feat/alimentos-versionados`
- Sin Firebase, con `AUTH_DEV_BYPASS=true`: `Authorization: Bearer dev:nutri-1:nutri@correo.hn`
- Pantallas objetivo: `/login`, `/dashboard`, `/pacientes`, `/pacientes/[id]`, `/pacientes/[id]/plan`, `/alimentos`, `/agenda`
