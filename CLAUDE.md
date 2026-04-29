# CLAUDE.md

Instructions for Claude when working in this repo.

## Idioma

- Responder en español neutro / mexicano. **No usar voseo argentino** ("vos", "tenés", "querés", "podés", "dale", "mandá", etc.).
- Usar "tú": "tienes", "quieres", "puedes", "manda", "envía", "ok / sí / listo" en vez de "dale".

## Coding Principles (Karpathy Guidelines)

Behavioral guidelines to reduce common LLM coding mistakes. Bias toward caution over speed; for trivial tasks, use judgment.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- Declara suposiciones antes de implementar. Si algo no está claro, dilo.
- Si hay múltiples interpretaciones, preséntalas — no decidas en silencio.
- Si existe un enfoque más simple, dilo. Empuja en contra cuando sea apropiado.
- Si algo no tiene sentido, para. Nombra qué es confuso.
- En este repo el flujo es autónomo: cuando el usuario pide algo, ejecútalo sin pedir confirmación para correr comandos. Pero declarar suposiciones sigue siendo obligatorio antes de tocar código.

### 2. Simplicity First
**Mínimo código que resuelva el problema. Nada especulativo.**
- Solo lo que se pidió. Cero features de más.
- Sin abstracciones para código de un solo uso.
- Sin "flexibilidad" o "configurabilidad" que no se pidió.
- Sin manejo de errores para escenarios imposibles.
- Si escribes 200 líneas y podrían ser 50, reescríbelo.

### 3. Surgical Changes
**Toca solo lo necesario. Limpia solo tu propio desorden.**
- No "mejores" código adyacente, comentarios o formato.
- No refactorices lo que no está roto.
- Iguala el estilo existente, aunque tú lo harías diferente.
- Si notas dead code no relacionado, menciónalo — no lo borres.
- Cuando tus cambios dejan huérfanos (imports, vars, funciones que TÚ dejaste sin uso), límpialos. Pero el dead code preexistente no se toca sin permiso.

### 4. Goal-Driven Execution
**Define criterios de éxito verificables. Loopea hasta verificar.**
- "Agregar validación" → "Tests para inputs inválidos, luego hacer que pasen"
- "Arreglar bug" → "Test que reproduce el bug, luego hacer que pase"
- Para tareas multi-paso, declara un plan corto con verificación por paso.
- Cuando un comando falla, postmortem corto: qué pasó, por qué, qué cambia. No solo retry.

## Next.js / Prisma Pitfalls

- **Server vs Client Components**: Por defecto los componentes son server. `"use client"` solo cuando hay state, effects o handlers de browser. No mezclar imports de Prisma en client components.
- **Prisma Client en edge runtime**: El cliente normal de Prisma no corre en edge. Si una API route usa edge runtime, usar Accelerate / Data Proxy o cambiar a node runtime.
- **Migrations**: `prisma migrate dev` solo en local. Producción usa `prisma migrate deploy`. Nunca editar migrations ya aplicadas.
- **Generated types**: Después de cambiar `schema.prisma`, correr `prisma generate` antes de tipar — si no, los tipos quedan stale y el build de TS falla en CI sin razón aparente.
- **Env vars**: `NEXT_PUBLIC_*` se exponen al cliente — nunca poner secretos ahí. Las que no tienen prefijo solo viven en server.
- **Hidratación**: Diferencias server/client (fechas con `new Date()`, `Math.random()`, `localStorage`) producen mismatches. Usar `useEffect` o `suppressHydrationWarning` con cuidado.
- **API routes y caching**: `export const dynamic = "force-dynamic"` cuando la respuesta depende de cookies/headers. Default puede cachear y servir respuestas viejas.
- **Sentry**: El proyecto ya tiene `sentry.client.config.ts` y `sentry.server.config.ts`. Para errores nuevos, capturar con contexto, no `console.error` y olvidarse.
- **Vercel deploy**: `vercel.json` controla rewrites/headers. Cambios ahí pueden romper rutas en prod aunque local funcione — verificar con `vercel dev` o preview deploy.
- **Connection pooling**: En serverless, una nueva instancia por invocación agota conexiones. Usar pooler (PgBouncer / Prisma Accelerate) en `DATABASE_URL` y `directUrl` separado para migrations.
