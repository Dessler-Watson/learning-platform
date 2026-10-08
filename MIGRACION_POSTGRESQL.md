# Migración EduPlay a PostgreSQL

Fecha: 2026-09-24  
Estado: **MIGRACIÓN COMPLETA** — E2E `scripts/e2e_pg.ps1` **563/563**, `tsc` y `build` OK. Limpieza de restos de prototipo (2026-09-28): APIs clase C, `src/lib/data.ts`, `data/*.json`, assets y componentes sin uso **eliminados**; solo queda mock decorativo in-game temporal (§9).

---

## 1. Objetivo

Migrar EduPlay de mocks / localStorage / JSON en disco a **PostgreSQL real**, usando la arquitectura aprobada en `db/` sin rediseñar el frontend: frontend → API → capa de datos (`src/lib/db/`) → PostgreSQL.

## 2. Fuente de verdad

| Fuente | Rol |
|---|---|
| `db/schema.sql` | Esquema completo (27 tablas, 6 vistas, 13 enums, 11 triggers, ~45 índices `idx_*`) |
| `db/migrations/0003_chaos.sql` | Modo Caos ETAPA 1 (idempotente, ya aplicada): `rooms.kind`, `chaos_rooms`, `matches.modifiers` + `matches.chaos_room_id` |
| `db/migrations/0004_chaos_modifiers.sql` | Modo Caos ETAPA 2 (Paso 1, idempotente, ya aplicada): `chaos_rooms.modifiers` (JSONB, sorteo único al crear la sala) |
| `db/migrations/0005_chaos_question_clocks.sql` | Modo Caos ETAPA 2 (Grupo 2, idempotente, ya aplicada): tabla `participant_question_clocks` — reloj de pregunta del servidor para `contrarreloj` (posición -1 = ancla de boot) |
| `db/seed.sql` | Seeds idempotentes: 3 roles, 4 modos, 30 ligas, 13 avatares, 150 logros |
| `eduplay_db` | BD aplicada y verificada en runtime |

Verificación en BD:

- 27 tablas base (`information_schema.tables`)
- 6 vistas
- 13 enums
- 11 triggers (incl. `sync_league_from_stars`)
- 45 índices `idx_*` (86 índices totales en `pg_indexes`; el brief menciona ~45 — el resto son unique/PK)

## 3. Variables de entorno

`.env.example` (plantilla) y `.env.local` (local, en `.gitignore`):

```
DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/eduplay_db
GEMINI_API_KEY=...
```

Nunca commitear `.env` / `.env*.local`.

## 4. Capa de datos

Módulos en `src/lib/db/`:

| Módulo | Responsabilidad |
|---|---|
| `client.ts` | Pool `pg`, `query` / `queryOne` |
| `password.ts` | `scrypt` formato `scrypt$N$r$p$salt$hash` (N=16384) |
| `sessions.ts` | Cookie httpOnly `eduplay_session` (30d) + `user_sessions.token_hash` (sha256) |
| `users.ts` | CRUD usuarios, avatares, invitados |
| `leagues.ts` | `ensureLeagueProgress`, `applyStarsDelta` (row lock + `league_transactions`) |
| `achievements.ts` | Catálogo + progreso de logros |
| `practices.ts` | Prácticas, preguntas, `practice_plays` |
| `rooms.ts` | Salas, participantes, ciclo waiting→in_progress→finished |
| `chaos.ts` | Modo Caos: creación de sala Caos (curso sintético + `chaos_rooms`), estado y enlace de la partida |
| `courses.ts` | Cursos / inscripciones |
| `index.ts` | Barrel público |

## 5. API implementada sobre PostgreSQL

| Ruta | Notas |
|---|---|
| `POST /api/auth/register` | Student; hash scrypt; sesión cookie |
| `POST /api/auth/login` | Verifica hash; 401 en credencial mala |
| `POST /api/auth/logout` | Destruye sesión |
| `GET /api/auth/me` | Sesión actual |
| `POST /api/auth/guest` | Invitado (`is_guest`, sin email/password) |
| `POST /api/auth/migrate` | Migra estrellas guest → cuenta solo si guest > actual |
| `POST /api/panel/auth/login` | Docente/admin |
| `POST /api/panel/auth/register` | Acepta `role: admin\|teacher` |
| `POST /api/panel/auth/logout`, `GET /api/panel/auth/me` | Sesión panel |
| `GET /api/usuarios` | Solo teacher/admin (403 student) |
| `GET /api/avatares` | Catálogo |
| `GET/PATCH /api/estudiante/perfil` | Session-based (sin IDOR) |
| `GET /api/estrellas` | Estrellas + liga del usuario en sesión |
| `POST /api/estrellas` | Solo admin (ajuste) |
| `GET/POST /api/logros` | Catálogo+progreso / upsert propio |
| `GET/POST /api/practicas` | create / submit / publish; guest no persiste |
| `GET/POST /api/salas` | create / join / leave / start / answer / finish; GET por `?code=` devuelve sala+participantes+`usuario_id`+`es_host` |
| `POST /api/salas/unirse` | Unirse por código (delega a `joinRoom`, re-entrada en in_progress OK) |
| `GET /api/ranking` | Ranking global por estrellas (`v_league_leaderboard`); sesión requerida; solo campos públicos |
| `GET /api/cursos` | Cursos |

## 6. Reglas de negocio aplicadas

- **ESTRELLAS ≠ monedas**: solo de salas/partidas (`league_tx_source = 'room_match'`). Práctica **no** otorga estrellas.
- Trigger `sync_league_from_stars` es la única regla de cambio de liga.
- Ranking de sala al finish: 3-2-1 estrellas a top-3 de `match_participants` por `score`.
- Contraseñas solo como hash scrypt; tokens solo `token_hash`.
- Autorización por rol (`student|teacher|admin`); sin IDOR en perfil/usuarios.

## 7. Seeds de usuarios demo

```bash
node scripts/seed_demo_users.mjs
```

- 2 admin (`admin123`), 8 teacher (`demo123`), todos `@gmail.com`
- Idempotente (omite emails existentes)
- Añadido como `npm run seed:demo`

## 8. Pruebas end-to-end (smoke)

Servidor: `npm run dev` → **http://localhost:3000** (log `dev_server.log`). Suite: `scripts/e2e_pg.ps1`.

**Resultado E2E fase 3: PASS=82 FAIL=0 TOTAL=82** (2026-09-24). Fase 2 fue 44/44 (base intacta, sin regresiones).

| Área | Cubierto |
|---|---|
| Logros | catálogo 150; batch upsert; progress/completado persisten en PG |
| Práctica | guest crea/juega sin estrellas; registrada crea→publish→submit; pública visible; estrellas 0 tras práctica |
| Estrellas / sala | student create→join→start→answer→finish; estrellas >0 solo vía `room_match` (3) |
| Panel CRUD | login teacher; cursos; preguntas create/delete; sala create/start/poll/finish; inicio stats; audit |
| Admin / authz | docentes list/create/delete; student 403 en `/api/usuarios` y `/api/panel/docentes` |
| Migrate guest | admin da estrellas a guest; register; `POST /api/auth/migrate` con `guest_id` migra 7; logout→401 |
| **Waiting Room** | host+player register; create max=3; join por código; 2 jugadores; nombres reales; estrellas; status waiting; docente/curso; 404 código; leave→1; rejoin; start→in_progress |
| **Ranking** | 3 users con estrellas 100/25/250 vía admin; orden desc; ligas Cuarzo III/II/I; nivel num; sin campos privados; 401 sin sesión |

`tsc --noEmit`: **TSC_OK**. `npm run build`: **OK** (37 páginas).

### Bugs corregidos durante smoke / E2E

1. `createUser`: CTE `INSERT…RETURNING` + SELECT no devolvía fila → INSERT en dos pasos.
2. `createPractice`: `CASE WHEN` con string enum → parámetro booleano aparte.
3. `startRoom` / `publishPractice`: `UPDATE` sin `RETURNING` → `query().length` siempre 0 → añadido `RETURNING id`.
4. Respuesta en sala: `$3`/`$2` desalineados en `UPDATE match_participants` → error de tipo de parámetro.
5. `panel/docentes`: SQL usaba `users.role` / `users.institution` inexistentes → `role_id`+`roles`, `institution_id`+`institutions`.
6. `panel/salas` audit: `jsonb_build_object('name', $3)` con tipo indeterminado → `coalesce($3::text, '')`.
7. `RegisterScreen`: `catch` duplicado → error TS de sintaxis; eliminado.
8. **Fase 3:** `leaveRoom` usaba `RETURNING id` pero `room_participants` tiene PK compuesta `(room_id, user_id)` sin columna `id` → `RETURNING room_id` (E2E leave 500 → 200).

## 9. Legacy restante

**Clasificación de APIs legacy (brief §APIs):**

| Clase | Rutas | Consumidores front | Acción |
|---|---|---|---|
| **C** (0 consumidores) | `api/preguntas`, `api/cuestionarios`, `api/dashboard`, `api/estadisticas`, `api/juegos` + `src/lib/data.ts` + `data/*.json` (15) | **0** (grep `@/lib/data` solo en esas rutas; sin `fetch` en `src/`) | **ELIMINADAS** (2026-09-28) |
| A/B | — | — | no aplican |

**decision-road (P4):** **ACTIVO** — consumidores en `GameCanvas.tsx` (DecisionWorld, GameFlow, DecisionHUD, QuestionPanel, FeedbackOverlay, ResultsScreen, MobileControls, Leaderboard) y `/camino-decisiones/page.tsx`. No migrado automáticamente (brief). Dependencias documentadas.

**Mocks restantes (clasificación final):**

| Clasificación | Ubicación | Notas |
|---|---|---|
| **ACTIVO Y DEBE MIGRAR** | — | **Ninguno** en auth, usuarios, estrellas, ligas, ranking, logros, práctica, historial, prácticas públicas, salas, waiting room, partidas, respuestas, panel docente |
| **ACTIVO PERO TEMPORAL** | `games/decision-road/ui/ResultsScreen.tsx` `MOCK_CLASSMATES` | Compañeros ficticios decorativos en leaderboard de resultados in-game |
| **ACTIVO PERO TEMPORAL** | `games/decision-road/ui/Leaderboard.tsx` `MOCK_PLAYER_NAMES` + `INITIAL_COMPETITORS` | Rivales animados decorativos in-game (scores `Math.random` de UI) |
| **ACTIVO PERO TEMPORAL** | `eduplay_user` / `panel-auth` localStorage | Solo UX de arranque; auth real = cookie httpOnly `eduplay_session` |
| **ACTIVO PERO TEMPORAL** | `achievement.store` `eduplay_achievement_stats` | Cache UI efímera; fuente de verdad = `/api/logros` |
| **LEGACY SIN CONSUMIDORES** | `api/{preguntas,cuestionarios,dashboard,estadisticas,juegos}`, `src/lib/data.ts`, `data/*.json` (15) | **ELIMINADOS** (2026-09-28) |
| No es mock de negocio | `panel/ui/toast` id, `panel/lib/aiGenerator` shuffle, texturas/three `Math.random` | IDs o aleatoriedad visual; no datos de dominio |

**Migración fase 3 (resumen):**

- WaitingRoom → `GET /api/salas?code=` + poll; join/leave; estados full/closed/countdown; sin mocks en `src/lib/rooms.ts`.
- Leagues ranking → `GET /api/ranking` (`v_league_leaderboard` + `users` + `avatars`); orden desc; liga client-side `getLeagueByStars`.
- Seguridad ranking: solo `posicion,id,nombre,avatar,estrellas,liga,mineral,nivel,es_tu` (sin email/role/password).
- Estrellas: solo `league_tx_source='room_match'`; práctica → 0 (sin sistema de puntos separado).

**Pendientes operativos:**

- Migrar `MOCK_CLASSMATES` / `MOCK_PLAYER_NAMES` (decision-road) cuando el juego multiusuario real lo requiera (hoy decorativos).
- ~~Destino de rutas clase C + `data/*.json`~~ → **resuelto**: eliminados en `chore: clean up unused prototype code` (2026-09-28).

## 10. Cómo ejecutar

```bash
# 1. BD (una vez)
psql -U postgres -c "CREATE DATABASE eduplay_db;"
psql -U postgres -d eduplay_db -f db/schema.sql
psql -U postgres -d eduplay_db -f db/seed.sql

# 2. Env
cp .env.example .env.local   # ajustar DATABASE_URL

# 3. Deps + usuarios demo
npm install
npm run seed:demo

# 4. Dev
npm run dev                  # http://localhost:3000
```
