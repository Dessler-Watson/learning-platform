# EduPlay — Base de datos PostgreSQL

Estructura aprobada y **ya aplicada** en `eduplay_db` (fuente única de verdad en runtime).

## Archivos

| Archivo | Propósito |
|---|---|
| `schema.sql` | Esquema completo: 27 tablas, enums, índices, constraints, triggers y 6 vistas. Fuente de referencia. |
| `migrations/0001_init.sql` | Primera migración histórica (base inicial; **no** incluye `solo_plays`). Punto de partida del historial de migraciones. |
| `migrations/0002_solo_plays.sql` | Agrega `solo_plays` + índice (ya contenido en `schema.sql` actual). |
| `migrations/0003_chaos.sql` | MODO CAOS ETAPA 1: `rooms.kind` ('docente'/'caos'), tabla `chaos_rooms`, `matches.modifiers` + `matches.chaos_room_id` (ya contenido en `schema.sql` actual). |
| `migrations/0004_chaos_modifiers.sql` | MODO CAOS ETAPA 2 (Paso 1): `chaos_rooms.modifiers` (JSONB, sorteo único al crear la sala; ya contenido en `schema.sql` actual). |
| `migrations/0005_chaos_question_clocks.sql` | MODO CAOS ETAPA 2 (Grupo 2): tabla `participant_question_clocks` — reloj de pregunta del servidor para `contrarreloj` (posición -1 = ancla de boot; ya contenido en `schema.sql` actual). |
| `seed.sql` | Datos iniciales idempotentes: roles (3), modos de juego (4), ligas (30), avatares (13), logros (150). |
| `generate_achievement_seed.js` | Regenera la sección de logros del seed desde `src/shared/lib/achievements-data.ts`. |
| `INFORME.md` | Informe de auditoría, diseño, decisiones y plan de migración. |

El informe de la **migración ejecutada** (capa `src/lib/db/`, APIs, smoke tests, pendientes) está en la raíz: [`MIGRACION_POSTGRESQL.md`](../MIGRACION_POSTGRESQL.md).

## Cómo aplicar

```bash
createdb eduplay_db

psql -U postgres -d eduplay_db -f db/schema.sql
psql -U postgres -d eduplay_db -f db/seed.sql
```

Requisitos: PostgreSQL 13+ (usa `gen_random_uuid()` nativo; en versiones anteriores se carga `pgcrypto`, ya declarado).

## Orden de aplicación

1. `schema.sql` (incluye todo el historial; para BDs existentes aplicar las migraciones pendientes `migrations/0002_*.sql`, etc.)
2. `seed.sql`

Ambos archivos están envueltos en `BEGIN/COMMIT` y el seed usa `ON CONFLICT` para poder re-ejecutarse.

## Estado de verificación (runtime)

Aplicado y verificado en `eduplay_db`:

- **26** tablas base, **6** vistas, **13** enums, **11** triggers
- **45** índices `idx_*` (86 índices totales en `pg_indexes`; el diseño apunta a ~45 sin duplicados)
- Seeds: 3 roles / 4 modos / 30 ligas / 13 avatares / 150 logros

Usuarios demo (hash scrypt, idempotente): exporta `DATABASE_URL` en el entorno (el script **no** lee `.env.local`) y ejecuta `npm run seed:demo` → `scripts/seed_demo_users.mjs`.

E2E: `scripts/e2e_pg.ps1` → **563/563 PASS** (2026-09-28). Estado migración: **COMPLETA** (restos de prototipo eliminados; ver [`MIGRACION_POSTGRESQL.md`](../MIGRACION_POSTGRESQL.md) §9).

## Notas

- **No** se sembraron usuarios de prueba con contraseñas en `seed.sql` (hashes van en el script de demo).
- El contenido creado por usuarios (cursos, preguntas, salas, prácticas) no se siembra: se genera en runtime.
- Contraseñas: solo `password_hash` (**scrypt** en `src/lib/db/password.ts`). Tokens: solo `token_hash`.
- El orden **importa**: `leagues` debe estar sembrada antes del primer INSERT en `player_league_progress` (trigger `sync_league_from_stars` deriva la liga de las estrellas). El orden documentado (schema → seed → datos de usuarios) lo garantiza.
