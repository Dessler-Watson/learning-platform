# EduPlay — Base de datos PostgreSQL

Estructura aprobada y **ya aplicada** en `eduplay_db` (fuente única de verdad en runtime).

## Archivos

| Archivo | Propósito |
|---|---|
| `schema.sql` | Esquema completo: 24 tablas, enums, índices, constraints, triggers y 6 vistas. Fuente de referencia. |
| `migrations/0001_init.sql` | Primera migración (idéntica a `schema.sql`). Punto de partida del historial de migraciones. |
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

1. `schema.sql` (o `migrations/0001_init.sql` — el mismo contenido; en el futuro los cambios van como `0002_*.sql`, etc.)
2. `seed.sql`

Ambos archivos están envueltos en `BEGIN/COMMIT` y el seed usa `ON CONFLICT` para poder re-ejecutarse.

## Estado de verificación (runtime)

Aplicado y verificado en `eduplay_db`:

- **24** tablas base, **6** vistas, **13** enums, **11** triggers
- **40** índices `idx_*` (79 índices totales en `pg_indexes`; el diseño apunta a ~45 sin duplicados)
- Seeds: 3 roles / 4 modos / 30 ligas / 13 avatares / 150 logros

Usuarios demo (hash scrypt, idempotente): `npm run seed:demo` → `scripts/seed_demo_users.mjs`.

E2E fase 3: `scripts/e2e_pg.ps1` → 82/82 PASS (2026-09-24). Estado migración: **COMPLETA** (legacy documentado en [`MIGRACION_POSTGRESQL.md`](../MIGRACION_POSTGRESQL.md) §9: APIs clase C sin consumidores; mocks decorativos temporales decision-road; sin commit).

## Notas

- **No** se sembraron usuarios de prueba con contraseñas en `seed.sql` (hashes van en el script de demo).
- El contenido creado por usuarios (cursos, preguntas, salas, prácticas) no se siembra: se genera en runtime.
- Contraseñas: solo `password_hash` (**scrypt** en `src/lib/db/password.ts`). Tokens: solo `token_hash`.
- El orden **importa**: `leagues` debe estar sembrada antes del primer INSERT en `player_league_progress` (trigger `sync_league_from_stars` deriva la liga de las estrellas). El orden documentado (schema → seed → datos de usuarios) lo garantiza.
