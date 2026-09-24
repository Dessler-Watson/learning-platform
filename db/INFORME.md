# EduPlay — Informe de auditoría y nueva arquitectura de base de datos

Fecha: 2026-09-23
Alcance: proyecto completo `learning-platform/` (Next.js 14 App Router + React + Zustand + Three.js).
Entregables: `db/schema.sql`, `db/migrations/0001_init.sql`, `db/seed.sql`.

---

## 1. Resumen de la arquitectura actual

EduPlay corre hoy **sin base de datos real**. La persistencia está repartida en tres capas paralelas que no se hablan entre sí:

**A. API routes + JSON en disco (`data/*.json`)**
- Capa de acceso única: `src/lib/data.ts` (`readData`/`writeData` con `fs.readFileSync/writeFileSync`).
- 15 archivos JSON: `usuarios`, `avatares`, `cursos`, `curso_estudiante`, `cuestionarios`, `categorias`, `preguntas`, `juegos`, `juego_cuestionario`, `salas`, `partidas`, `resultados`, `progreso`, `estadisticas`, `ligas`.
- Consumido por `/api/usuarios`, `/api/cursos`, `/api/preguntas`, `/api/salas`, `/api/dashboard`, `/api/estadisticas`, `/api/estudiante/perfil`, `/api/avatares`.
- Sin bloqueo de escritura (riesgo de corrupción por concurrencia).

**B. Panel docente con mocks en memoria (`src/app/panel/data/*.ts` + `services/index.ts`)**
- Cursos, preguntas, salas, resultados y actividad viven en arrays TypeScript con `delay()` simulado; **se pierden al recargar**.
- No consume las API routes del punto A: existen dos modelos distintos de `Curso`, `Pregunta`, `Sala` y `Resultado`.
- Solo persisten: sesión (`panel-auth`) y altas de docentes (`panel-docente-registered`), ambos en localStorage **con contraseñas en texto plano**.

**C. Estado del estudiante en localStorage / sessionStorage / Zustand**
- Sesión: `eduplay_user` (forjable editando el navegador).
- Estrellas/liga: `eduplay_stars_u{id}` (store `league.store`).
- Logros: `eduplay_achievements_u{id}` + `eduplay_achievement_stats_u{id}`.
- Prácticas y resultados: `eduplay_practices_u{id}`, `eduplay_practice_results_u{id}`.
- Bandera de modo práctica: `sessionStorage.eduplay_practice` (es lo que anula las estrellas en los 4 juegos).

**Flujos desconectados:** el código de sala de 6 dígitos que genera el panel no existe en las salas mock que ve el estudiante (`src/lib/rooms.ts`); los juegos cargan siempre el banco fijo `dignidad-mujer.ts`, no las preguntas del curso de la sala.

## 2. Problemas encontrados en la base anterior

De los JSON (`data/`):
1. `ligas.json` es huérfano: 12 ligas por "copas" que nadie lee; las ligas reales (30 por estrellas) están en `src/lib/leagues.ts`.
2. `juegos.json` solo tiene 3 modos e incluye "Modo Estudio" (inexistente en la UI); los 4 modos reales están en `panel/data/juegos.ts` y `shared/lib/game-modes.tsx`.
3. Esquema de usuarios sin contraseña (el login de estudiante solo busca el correo y abre sesión).
4. Preguntas modeladas como `opcion_a..d` + `respuesta_correcta` como texto: frágil, no extensible a modos no opcionales, y duplicado del modelo A/B del panel.
5. Estadísticas pre-agregadas (`estadisticas.json`, `progreso.json`) guardan derivados sin fuente de verdad (no hay respuestas individuales que las respalden).
6. `partidas`/`resultados` mezclan puntaje, copas y posición sin referencia a curso ni a preguntas.
7. Escrituras `writeFileSync` sin transacciones ni bloqueo.
8. API `PUT/DELETE /api/preguntas` apunta a rutas inexistentes.

De localStorage / panel:
9. Contraseñas en claro en `panel-auth`, `panel-docente-registered` y seeds hardcoded (`admin123`, `demo123`).
10. Sin hashing (no hay bcrypt/argon2), sin cookies, sin JWT, sin middleware de protección: toda la autorización es client-side y evitable.
11. `GET /api/usuarios` sin auth expone correos, fecha de nacimiento y sexo de todos los usuarios (enumeración + PII de menores).
12. `PATCH /api/estudiante/perfil` permite modificar cualquier usuario solo con su id (IDOR).
13. `/login-docente` hace bypass total (solo navega a `/panel`).
14. Invitados con `id_usuario: 0`: **todos comparten las mismas claves `_u0`** (progreso mezclado entre invitados).
15. No existe migración de progreso de invitado a cuenta.
16. Actividad del panel: 5 registros semilla que nunca se actualizan; borrado solo en estado local de React.
17. Resultados por estudiante y "preguntas difíciles" son **reconstrucciones deterministas/aleatorias**, no telemetría real de respuestas.
18. Dos sistemas de ligas y dos de rangos (estrellas vs copas vs Bronce–Diamante del perfil) sin reconciliar.

## 3. Entidades detectadas (inventario funcional)

| Entidad | Qué representa | Creador | Modifica | Ve | Elimina | Estado/historial |
|---|---|---|---|---|---|---|
| Usuario (student/teacher/admin/invitado) | Cuenta | Registro, admin, invitado | Él mismo / admin | APIs sin auth (hoy) | Admin (soft) | `estado`, timestamps |
| Institución | Colegio/organización | Admin | Admin | Admin | Soft delete | Hoy es string libre |
| Sesión | Login activo | Backend (futuro) | — | — | Expiración | `last_seen` (online se deriva) |
| Curso | Contenido de un modo por docente | Docente | Docente | Docente, estudiantes inscritos | Soft delete | `estado` draft/activo/inactivo |
| Inscripción | Curso ↔ estudiante | Docente / auto | Docente | Docente | Baja (`dropped`) | `progress` 0–100 |
| Pregunta | Ítem de un curso o de una práctica | Docente, IA, usuario | Docente | Docente, jugadores en partida | Soft delete | `estado`, orden, timestamps |
| Opción | Respuesta de una pregunta | Docente/IA | Docente | Jugador | Cascade | orden, `is_correct` |
| Sala (room) | Lobby con código de acceso | Docente | Docente | Docente, jugadores que tienen el código | Soft delete / archivar | `estado` waiting/en curso/finalizada |
| Partida (match) | Sesión de juego real nacida de una sala | Docente (iniciar) | Sistema | Docente, jugadores | Cascade | `started_at/finished_at` |
| Participante | Jugador dentro de una partida | Al unirse | Sistema | Docente | Cascade | `status` (eliminado/finalizado) |
| Respuesta individual | Telemetría por pregunta | Jugador | — | Docente (analítica) | Cascade | **Dato fuente** de resultados |
| Práctica | Cuestionario privado/público jugable | Usuario con cuenta (crea); cualquiera juega | Creador | Cualquiera (si es pública) | Soft delete | `private/published`, `play_count` |
| Play de práctica | Jugada de práctica con historial | Usuario registrado | — | Su dueño | Cascade | Historial propio |
| Liga | Catálogo de 30 niveles | Seed | — | Todos | No (catálogo) | — |
| Progreso de liga | Estrellas + liga actual del jugador | Sistema al cerrar partida competitiva | Sistema | Todos (ranking) | — | Respaldo en transacciones |
| Transacción de estrellas | Libro mayor de puntos de liga | Sistema | — | Auditoría | — | **Historial de liga** |
| Logro | Catálogo de 150 logros | Seed / futuros INSERT | — | Todos | No (catálogo) | — |
| Progreso de logro | Desbloqueo por jugador | Sistema (eventos) | Sistema | Dueño | Cascade | `progress`, `unlocked_at` |
| Modo de juego | Catálogo de modos | Seed | Admin (futuro) | Todos | No | **No hardcodeado** |
| Avatar | Catálogo de avatares | Seed | — | Todos | No | — |
| Evento de auditoría | Actividad docente + auditoría admin | Sistema | — | Panel/admin | — | Feed derivado de aquí |

## 4. Nueva arquitectura propuesta

```
roles ─< users >─ institutions
              │
              ├─< user_sessions
              ├─< player_league_progress >─ leagues
              ├─< league_transactions  (source: room_match | adjustment | migration)
              ├─< achievement_progress >─ achievements >─ game_modes
              ├─< courses >─ course_enrollments
              │       └─< questions (dueño: course XOR practice)
              │                └─< question_options
              ├─< rooms >─ room_participants
              │       └─< matches >─ match_participants >─ participant_answers >─ questions
              ├─< practices >─ questions (practice_id)
              │       └─< practice_plays >─ practice_answers
              └─< audit_events
```

Principios aplicados:
- **Una sola fuente de verdad por dominio**: respuestas individuales → resultados; transacciones → liga; progreso → logros.
- **Catálogos separados** (roles, modos, ligas, avatares, logros): crecer = INSERT, nunca ALTER por contenido nuevo.
- **Sala ≠ partida ≠ participante ≠ respuesta**: tablas separadas con FK.
- **Práctica ≠ competitivo**: no hay ninguna ruta de datos de práctica hacia `league_transactions`.
- **Datos derivados como vistas**, no como tablas de estadísticas pre-agregadas.

## 5. Lista completa de tablas (24)

**Catálogos:** `roles`, `institutions`, `avatars`, `game_modes`, `leagues`
**Identidad:** `users`, `user_sessions`
**Ligas:** `player_league_progress`, `league_transactions`
**Logros:** `achievements`, `achievement_progress`
**Contenido:** `courses`, `course_enrollments`, `questions`, `question_options`
**Salas/partidas:** `rooms`, `room_participants`, `matches`, `match_participants`, `participant_answers`
**Práctica:** `practices`, `practice_plays`, `practice_answers`
**Auditoría:** `audit_events`

**Vistas (6):** `v_match_participant_stats`, `v_question_match_stats`, `v_user_mode_stats`, `v_league_leaderboard`, `v_match_ranking`, `v_practice_stats`.

## 6. Relaciones principales

- `users.role_id → roles` (N:1); `users.institution_id → institutions` (N:1, opcional).
- `courses.teacher_id → users`; `course_enrollments` (course_id, student_id) N:M con `progress`.
- `questions` tiene **exactamente un dueño**: `course_id` XOR `practice_id` (CHECK).
- `question_options.question_id → questions` (cascade).
- `rooms(course_id, game_mode_id, teacher_id)`; `matches.room_id → rooms` (una sala ⇒ varias partidas posibles).
- `match_participants(match_id, user_id)` únicos; `participant_answers` → participante + pregunta + opción.
- `league_transactions.match_id → matches` (opcional; traza el origen del punto).
- `achievements.game_mode_id → game_modes` (opcional: logros globales posibles).
- `audit_events.actor_id → users` (SET NULL: la auditoría sobrevive al borrado del actor).

## 7. Decisiones importantes de diseño

1. **Una tabla `users` para todos los roles** (student/teacher/admin) + FK `roles`: evita tablas de docentes/estudiantes duplicadas (hoy existen dos mundos separados: `usuarios.json` y `panel-docente-registered`). El rol es una fila en `roles`, extensible sin migraciones de enum.
2. **Los invitados son filas reales** (`is_guest = TRUE`, sin credenciales): resuelve el progreso temporal y la migración sin hacks (ver §10).
3. **Sala y partida separadas**: la sala es el lobby durable con código; la partida es el evento de juego con resultados. Permite re-ejecutar una sala y conservar el histórico.
4. **Fuente de verdad = `participant_answers`**: todo lo que hoy se "reconstruye" con hashes y `Math.random()` pasa a calcularse con SQL real.
5. **Estadísticas agregadas como vistas**, no como `estadisticas.json` (derivados sin fuente que los respalde).
6. **`game_modes.stars_per_correct`** centraliza lo que hoy está duplicado en 4 stores de Zustand y en `leagues.ts`.
7. **`audit_events` genérica** en lugar de una tabla `actividad` hardcodeada: el feed del panel se deriva con filtros; la misma tabla sirve de auditoría admin.
8. **No se creó tabla de "configuración"**: la configuración actual (sonido, etc.) es preferencia de UI y no necesita persistir en PostgreSQL. Si surge configuración por institución/curso, se añade después.
9. **`online/offline` no es columna**: se deriva de `user_sessions.last_seen_at` (el cálculo por `ultimaActividad + 5min` actual es un estado temporal, no dato maestro).
10. **Sin ORM impuesto**: el proyecto no tiene backend definitivo; se entregó SQL puro, listo para conectar con Prisma/pg/Drizzle sin cambiar el esquema.
11. **Avatar custom**: `users.custom_avatar` (TEXT, nullable) representa la foto personalizada que hoy vive solo en localStorage (`src/lib/custom-avatar.ts`, dataURL JPEG 512×512); tiene prioridad sobre `avatar_id` cuando no es NULL. El backend puede sustituir el dataURL por una URL de object storage sin tocar el esquema.
12. **Liga derivada de estrellas**: un trigger (`sync_league_from_stars`) recalcula `player_league_progress.current_league_id` en cada INSERT/UPDATE de `stars` (liga con mayor `stars_required <= stars`). Elimina la posibilidad de desincronización estrellas↔liga y cubre subidas y descensos con una sola regla.

### Dudas arquitectónicas documentadas (no inventadas)

| Duda | Estado | Opción elegida (máxima flexibilidad) |
|---|---|---|
| ¿Tiempo real de salas (WebSocket) o polling? | El front actual simula con `setInterval`; no hay backend real | La BD no depende de ello: tablas de sala/partida funcionan con cualquier transporte. |
| ¿Una sala = una partida o varias? | No definido en código actual | `matches` con `room_id` FK: admite 1..N; el flujo actual usará 1. |
| ¿La práctica debe contar para logros? | Hoy **sí cuenta** (el código no filtra `isPractice` pese a existir el campo) | Se documenta como decisión de producto pendiente; la BD la soporta con `practice_plays` separado de `matches` (basta filtrar el origen de los eventos). |
| ¿Estudiantes con institución? | Hoy solo docentes tienen institución | `institution_id` vive en `users` (opcional): admite estudiantes por institución sin ALTER. |
| ¿Migración de invitado: reasignar filas o `merged_into`? | Frontend aún no tiene migración | Se prevé `users.merged_into_user_id` **y** reasignación en transacción; ambos mecanismos caben sin romper nada (ver §10). |

## 8. Estrategia de IDs

- **UUID v4 (`gen_random_uuid()`)** como PK en **todas** las tablas. Justificación:
  - sin enumeración (`/api/usuarios` con ids correlativos invita a IDOR, que hoy existe);
  - merge/import distribuido sin coordinación de secuencias;
  - consistencia total (no se mezclan `serial` con UUID);
  - los ids cortos del panel (`cur-...`, `sala-...`) se reemplazan por UUID.
- **Códigos cortos naturales** (sala y práctica: 6 caracteres alfanuméricos) son **unique constraints**, no PK: identifican en la UI/URLs, no relacionan tablas.
- Los catálogos sembrados usan `code` único (`ach_001`, `cuarzo-I`, `decisiones`) como identificador estable para el seed y para el front.

## 9. Estrategia de autenticación

Preparada en el esquema, implementable por el backend:
- `users.password_hash`: **solo hash** (bcrypt o argon2id). Nunca texto plano. Los usuarios heredados sin contraseña llevan `NULL` + `must_reset_password = TRUE`.
- `users.email` único (índice parcial `lower(email)` donde `deleted_at IS NULL`).
- `user_sessions`: sesión por **cookie httpOnly segura** o JWT; aquí solo se guarda `token_hash` (nunca el token crudo), con `expires_at`, `last_seen_at`, `revoked_at`.
- Autorización por rol vía JOIN a `roles` en el backend + middleware (el guard actual es solo client-side).
- Restricciones de API derivadas del esquema: PII (`birth_date`, `sex`) solo accesible al dueño/admin; `GET /api/usuarios` masivo debe desaparecer o filtrarse.
- La tabla `roles` + `status` (active/inactive/suspended) cubren suspendición sin borrar datos.

## 10. Estrategia para invitados

Regla del producto (hoy en el front): pueden jugar y acumular progreso temporal; no desbloquean logros, no guardan historial de práctica, no publican; al registrarse debe conservarse su progreso.

Diseño:
1. Entrar como invitado = **INSERT en `users`** con `is_guest = TRUE`, `email/password_hash = NULL` (CHECK lo garantiza), nombre y avatar.
2. Se le crea su fila en `player_league_progress` normalmente: sus estrellas y liga viven en PostgreSQL **en su propia fila** (corrige el bug actual de que todos los invitados comparten `_u0`).
3. Durante la sesión, el backend identifica al invitado con su sesión (`user_sessions`), no con `id_usuario: 0`.
4. **Al registrarse**: el registro recibe el `user_id` del invitado de la sesión actual y, en **una sola transacción**:
   - crea la cuenta nueva;
   - reasigna el progreso (`player_league_progress`, `achievement_progress`, `practice_plays`, prácticas creadas, `league_transactions`) de la fila invitado a la nueva cuenta — sumando/mergeando cuando aplique (p. ej. estrellas: `new.stars = max(new, guest)` o `+`, decisión de producto);
   - marca `guest.merged_into_user_id = new_user_id` y `status = 'inactive'` para auditoría;
   - cierra la sesión del invitado.
5. Nada de esto requiere cambiar el esquema: `merged_into_user_id` ya existe y todas las tablas de progreso referencian `users(id)`.
6. Nota: el front actual **no tiene** este flujo (el registro genera un id nuevo y abandona las claves `_u0`); la migración de datos de localStorage se describe en §19.

## 11. Estrategia para ligas

- **Catálogo `leagues`**: 30 filas (10 minerales × tiers 1–3) con `stars_required`, `sort_order`, imagen y color. Coincide 1:1 con `src/lib/leagues.ts`. Añadir/ajustar una liga = UPDATE de una fila.
- **Estado del jugador**: `player_league_progress(stars, current_league_id)`. `stars` es el número maestro; la liga se recalcula al cerrar cada partida competitiva con el umbral correspondiente (`stars >= stars_required` más alto).
- **Histórico**: `league_transactions` registra cada movimiento: `delta_stars`, `stars_after`, liga antes/después, `source` y `match_id` que lo produjo. Permite responder "¿por qué subí/bajó?" y detectar promociones comparando `league_id_before/after`.
- **La práctica no genera puntos**: `source` es un enum sin valor `practice`; el backend solo inserta `room_match` al finalizar una partida de sala. Imposible "contaminar" por olvido tonto de un valor libre.
- **Ajustes manuales** (becas, correcciones): `source = 'adjustment'`; migración de datos viejos: `source = 'migration'`.
- Los rankings son la vista `v_league_leaderboard` (no una tabla `rankings` a mantener).
- Se ignora el sistema legado de "copas" (`data/ligas.json` y rangos Bronce–Diamante de `api/estudiante/perfil`): documentado como redundante a eliminar en la migración.

## 12. Estrategia para logros

- **`achievements`** = catálogo puro: `code` (ach_001…), nombre, descripción, modo relacionado (FK opcional), dificultad, icono, `goal` y `stat_key`. El motor genérico actual (`progress >= goal` sobre un contador `stat_key`) se reproduce tal cual en la BD.
- Agregar un logro = **un INSERT**. Ninguna columna de `users`, ningún ALTER.
- Los logros meta (`ach_100`, `ach_150`: "desbloquea los otros 49") usan `stat_key` `tierras_all_unlocked` / `abismos_all_unlocked` como cualquier otro contador; el backend los recalcula (como hoy `updateMetaStats`).
- **`achievement_progress`** (PK `user_id + achievement_id`): `progress`, `completed`, `unlocked_at` → buscar, filtrar completados/faltantes, mostrar % y fecha de desbloqueo, todo con índices y sin tocar el catálogo.
- Invitados: el backend simplemente no escribe filas para `is_guest` (regla actual del front).
- Seed: los 150 logros actuales, generados desde `src/shared/lib/achievements-data.ts` (ver `db/generate_achievement_seed.js`).

## 13. Estrategia para salas

Separación estricta en 4 tablas:

| Concepto | Tabla | Contenido |
|---|---|---|
| COURSE | `courses` | material del docente (no se mezcla con la sala) |
| ROOM | `rooms` | lobby: código único de 6 caracteres, curso, modo, docente, `max_players` (capacidad; hoy 20 en el mock de espera, NULL = sin límite), `status` (waiting/in_progress/finished/archived), timestamps |
| MATCH | `matches` | una ejecución real: `question_count` (snapshot al iniciar), `started_at/finished_at`, `status` |
| PARTICIPANT | `match_participants` | por partida: `display_name` (snapshot), `status` (playing/finished/eliminated/left), `eliminated_on_question`, `score`/`stars_earned`/`xp` como **caché de ranking en vivo** |
| ANSWER | `participant_answers` | fila por pregunta respondida |
| RESULT | vistas (`v_match_*`) | se calculan, no se almacenan como tabla independiente |

- El lobby tiene además `room_participants` (quién está esperando, independiente de si jugó).
- El docente inicia la partida → INSERT `matches`; los resultados pertenecen al match, no a la sala: cerrar/eliminar la sala nunca borra histórico (soft delete en rooms, cascade solo si se purga).
- Códigos: índice único parcial `upper(code)` **solo entre salas vivas** → un código archivado puede reusarse, y `Ab12Cd`/`ab12cd` no chocan.
- El monitoreo en vivo se apoya en `match_participants.score` (actualizado transaccionalmente) y la vista `v_match_ranking`.
- Integración estudiante↔docente (hoy rota: mocks `rooms.ts` vs códigos del panel) se resuelve consumiendo `rooms` por `code` desde ambos lados; el transporte en tiempo real queda como pendiente de backend (§21).

## 14. Estrategia para prácticas

- `practices`: código propio de 6 caracteres (compartible), `creator_id`, título, descripción, tema, `game_mode_id`, estado `private|published`, `published_at`, `play_count` (contador de caché para ordenar), soft delete.
- Los agregados del tipo `Practice` del front (`correctAnswers`, `incorrectAnswers`, `lastPlayedAt`) se **derivan** con la vista `v_practice_stats` (SUM/MAX sobre `practice_plays`); no se duplican como columnas.
- Sus preguntas reutilizan la **misma tabla `questions`** con `practice_id` (CHECK impide tener curso y práctica a la vez). Mismo modelo de `question_options`. No se duplica el modelo de pregunta.
- Crear práctica: pueden los invitados (serían filas `is_guest` como creadoras) según el código actual (`addPractice` no filtra); **publicar exige cuenta registrada** (CHECK de negocio en backend: `status='published'` ⇒ creator no invitado).
- El "Modo Práctica" en sí es una **partida sin sala**: el front lo marca con `sessionStorage.eduplay_practice`. En BD, una jugada de práctica es `practice_plays` (+ `practice_answers`), completamente separada de `matches` → **nunca puede escribir `league_transactions`**.
- El límite de 30 preguntas, el swap aleatorio A/B de la IA y la generación con Gemini no tocan el esquema (son reglas de aplicación).

## 15. Estrategia para prácticas públicas

- Publicar = UPDATE `status: private → published` + `published_at` (auditable en `audit_events`).
- Listado/búsqueda: índice parcial `WHERE status = 'published' AND deleted_at IS NULL` + índice sobre `lower(title)` para búsqueda; filtro por `game_mode_id` y por `code` (búsqueda exacta de 6 dígitos, como hoy).
- Cualquier persona (también invitados, que ya son filas `users`) puede **jugar** una práctica pública → `practice_plays`.
- **Solo cuentas registradas** obtienen fila en `practice_plays` (historial individual) — el backend omite el INSERT para invitados, respetando la regla actual: el invitado juega pero no guarda historial.
- `play_count` se incrementa en el mismo commit del play (contador denormalizado aceptado para ordenación; la verdad exacta es `COUNT(practice_plays)`).

## 16. Estrategia para resultados

- **Dato fuente**: `participant_answers` (correcto/incorrecto/timeout, tiempo de respuesta, `points_delta`, `stars_delta`, posición de pregunta) y `practice_answers` para prácticas.
- **Dato derivado (vistas/cálculos en el backend)**: promedio de la sala, % correcto/incorrecto, timeouts, ranking, preguntas difíciles (`v_question_match_stats`), detalle por estudiante (`v_match_participant_stats`), estadísticas por usuario/modo (`v_user_mode_stats`).
- **Denormalización mínima y justificada** (caché de carrera, no estadísticas inventadas):
  - `match_participants.score/stars_earned/xp` → ranking en vivo sin agregaciones por respuesta en cada tick;
  - `match_participants.eliminated_on_question` → "eliminado en la pregunta N";
  - `practice_plays.correct_count/incorrect_count/total_questions` → snapshot de la jugada en su historial;
  - `practices.play_count` → ordenación del listado público.
- Lo que hoy es ficción en el panel (`obtenerPreguntasDificiles` con hash, tiempos aleatorios en el detalle del estudiante, `temas_mas_errores` con `Math.random()`) pasa a salir de consultas reales.
- Se elimina la necesidad de `estadisticas.json`, `resultados.json`, `progreso.json` y `data/panel/data/resultados.ts` / `respuestas.ts` (estos dos últimos ya sin consumidores).

## 17. Índices

45 índices (podados en la 2ª auditoría: se eliminaron 8 redundantes/especulativos), creados solo donde hay consulta real:

- **FK** (PostgreSQL no indexa FKs automáticamente): `course_enrollments.student_id`, `questions.course_id/practice_id/author_id`, `question_options.question_id`, `room_participants.user_id`, `matches.room_id`, `match_participants.match_id/user_id`, `participant_answers.match_id/participant_id/question_id`, `practice_plays.user_id/practice_id`, `practice_answers.play_id/question_id`, `league_transactions.user_id/match_id`, `achievement_progress` (prefijo de la PK), `audit_events.actor_id`, `user_sessions.user_id`, `users.role_id/institution_id`.
- **Únicos**: emails (`lower(email)`, parcial), nombres de institución/avatar, `courses (teacher, mode, lower(name))` parcial, códigos de sala (parcial, `upper(code)` entre vivas), códigos de práctica, `achievements.code`, `roles.code`, `game_modes.code`, `leagues.code`, `leagues.sort_order`, `match_participants (match, user)`, respuestas por posición.
- **Consulta**: `rooms(status)` y `rooms(created_at DESC)` para el listado del panel; `practices` parcial para públicas + `lower(title)` + `practices(game_mode_id, published_at)` parcial para los chips de modo; `player_league_progress(stars DESC)` para ranking; `match_participants(match_id, score DESC)` para ranking en vivo; `audit_events(entity_type, entity_id)`.
- **Eliminados en la 2ª auditoría** (sin consumidor real o redundantes): `league_transactions(created_at)` (barrido global no usado), `participant_answers(match_id, question_id)` (cubierto por los dos índices simples), `courses(status)` (baja cardinalidad, cubierto por `courses(teacher_id)`), `achievement_progress(user_id) WHERE completed` (prefijo de PK, ≤150 filas/usuario), `achievements(difficulty)` (sin filtro de dificultad en la UI), `audit_events(created_at)` (el feed es por docente: `audit_actor`), `player_league_progress(current_league_id)` (nadie filtra por liga; el ranking ordena por stars), `users(merged_into_user_id)` (lookup puntual de merge sobre tabla pequeña).
- **Evitados**: no hay GIN/trgm (se añaden con `pg_trgm` si se necesita búsqueda difusa multi-campo); no hay índices sobre enums de baja cardinalidad usados solo en tablas pequeñas de catálogo.

## 18. Constraints

- **PK/FK** en todas las relaciones; `ON DELETE CASCADE` donde el hijo no tiene sentido sin el padre (inscripciones, participantes, respuestas, progreso); `ON DELETE RESTRICT` para histórico docente (cursos/salas referenciando a `users`); `SET NULL` en campos de snapshot (`avatar_id`, `started_by`, `match_id` de transacciones).
- **CHECK relevantes**:
  - invitados sin credenciales y registrados con email (`chk_guest_credentials`);
  - `stars >= 0`, `progress BETWEEN 0 y 100`, `goal > 0`, `question_count > 0`;
  - `questions`: exactamente un dueño (curso XOR práctica);
  - `delta_stars <> 0` y `stars_after >= 0` en el libro mayor de ligas;
  - formato de código de sala/práctica `^[A-Za-z0-9]{6}$`;
  - `sex` restringido; `tier BETWEEN 1 AND 3`.
- **UNIQUE**: los códigos cortos, códigos de catálogo, correo, nombre de curso por docente+modo.
- **ENUMs** para estados cerrados (evita basura libre en status); `roles` y `game_modes` como **tablas** (no enum) porque crecen sin migración.
- **Triggers `updated_at`** en 10 tablas de entidad principal.
- **Transacciones** esperadas del backend (no del esquema): cierre de partida (respuestas + score + estrellas + logros) y migración de invitado (§10).

## 19. Plan de migración

### 19.1 Qué hay hoy
- **Servidor**: 15 JSON en `data/` (usuarios, cursos, inscripciones, preguntas, cuestionarios, categorías, salas, partidas, resultados, progreso, estadísticas, avatares, juegos, ligas).
- **Cliente**: sesión, estrellas, logros, prácticas e historiales en localStorage; sesión y docentes en localStorage (con contraseñas en claro).
- **Memoria**: panel docente completo (cursos/preguntas/salas/actividad) que no persiste.

### 19.2 Qué se conserva / transforma / se descarta

| Origen | Destino | Acción |
|---|---|---|
| `usuarios.json` (17) | `users` + `roles` + `player_league_progress` | **Migrar**: `rol`→`roles`; `password_hash = NULL` + `must_reset_password` (no tenían contraseña); correo único; avatares por id→uuid vía `name`. |
| `avatares.json` (13) | `avatars` | **Migrar** (el seed ya los incluye; reconciliar por nombre). |
| `cursos.json` (4) | `courses` | **Migrar** (mapear `docente_id`→uuid, `juego_id`→`game_modes.code`; nombres legacy `juego-1..` → `decisiones..`). |
| `curso_estudiante.json` (12) | `course_enrollments` | **Migrar**. |
| `preguntas.json` (18) + `categorias/cuestionarios` | `questions` + `question_options` | **Transformar**: `opcion_a..d` → filas de opción; `respuesta_correcta` ('A'…) → `is_correct`; `categoria_id` → `metadata->>'categoria'` (la jerarquía cuestionario/categoría no existe en el flujo real del panel; se conserva como metadata si se quiere). |
| `juegos.json` (3, con "Modo Estudio") | `game_modes` (4 reales) | **Descartar contenido**: el archivo está desincronizado; usar el seed con los 4 modos reales. |
| `ligas.json` (12 por copas) | — | **Descartar**: sistema muerto, reemplazado por las 30 ligas del seed. |
| `salas.json` (6, códigos tipo `CD-001`), `partidas.json` (3), `resultados.json` (7) | `rooms/matches/...` | **Descartar como contenido** (datos de prueba de hackathon con estructura incompatible: no distinguen match/participante/respuesta). Opcional: importar como partidas históricas sintéticas solo si el producto lo pide. |
| `estadisticas.json`, `progreso.json` | vistas | **Descartar**: derivados sin fuente; se recalculan. |
| `panel/data/*.ts` (seeds del panel) | — | **Descartar**: mocks de demo (`sala_creada` hardcodeado, resultados sin consumidores). |
| `panel/data/docentes.ts` + `panel-auth` (localStorage) | `users` (role teacher/admin) + `institutions` | **Migrar cuentas**: correos e instituciones → `institutions` + `users`; **contraseñas en claro → RESETEAR** (generar hash temporal o flux de "olvidé mi contraseña"); nunca copiar texto plano. |
| Estrellas `eduplay_stars_u{id}` (localStorage) | `player_league_progress` + transacción `migration` | **Migrar por usuario** si se desea conservar (script por id de correo). |
| Logros `eduplay_achievements_u{id}` | `achievement_progress` | **Migrar** (`completed`/`progress`; `unlockedAt` epoch→timestamptz). |
| Prácticas `eduplay_practices_u{id}` | `practices` + `questions` | **Migrar** (mapear A/B→opciones). |
| Historial `eduplay_practice_results_u{id}` | `practice_plays` + `practice_answers` | **Migrar** si los datos siguen en el navegador de cada usuario (solo posible desde el propio cliente: exportar→importar). |
| Invitados (`_u0` compartido) | — | **No migrable de forma fiable**: todos los invitados comparten claves; imposible separar progreso individual. Documentado como pérdida aceptada. |
| `data/*.json` en general | — | **No borrar**: mantener como backup `data/legacy-backup/` antes del corte; los JSON dejan de usarse cuando el backend apunte a PostgreSQL. |

### 19.3 Script de migración previsto (no ejecutado todavía)
1. `pg_dump` / backup de todo + copia de `data/` y export de localStorage relevante.
2. Aplicar `schema.sql` + `seed.sql`.
3. Script Node `scripts/migrate-legacy.js`: leer JSON → mapear a UUIDs (tabla de correspondencia viejo→nuevo) → INSERT en transacción.
4. Reset de credenciales docentes (hash de contraseña temporal + `must_reset_password`).
5. Verificación: conteos por tabla, FKs, y muestreo.
6. Solo después de validar, el frontend se apunta al backend.

**Regla**: nada se elimina automáticamente; los datos de prueba de hackathon se marcan como descartados en este informe y requieren tu confirmación antes del corte.

## 20. Qué partes del frontend todavía son simuladas

| Sistema | Estado hoy | Listo para backend |
|---|---|---|
| Registro/login estudiante | API JSON, **sin contraseña real** | Necesita `POST /auth/*` con hash + sesión |
| Login/panel docente | localStorage + texto plano | Necesita auth server + middleware |
| `/login-docente` | Bypass total (ninguna validación) | Reescribir o eliminar |
| Cursos, preguntas, salas del panel | **100% mock en memoria** (services con `delay`) | Modelos casi 1:1 con el esquema nuevo → adaptar `services/index.ts` a fetch de API |
| Sala real docente ↔ estudiante | **Desconectada**: `rooms.ts` mock con códigos distintos | Consumir `rooms` por código + transporte en vivo |
| Preguntas en partida | Banco fijo `dignidad-mujer.ts` | Cargar desde `questions` de la sala/práctica |
| Resultados/monitoreo | Reconstruidos con hash/aleatoriedad | Sustituir por vistas SQL (mismos componentes) |
| Estrellas/liga | localStorage (`league.store`) | API de progreso de liga;practice ya no suma (igual que hoy) |
| Logros | localStorage (`achievement.store`) | Motor de eventos → `achievement_progress` |
| Prácticas + públicas | localStorage (`practice.store` + `publicPractices` simuladas) | CRUD de `practices` + plays |
| Historial de práctica | localStorage | `practice_plays` (solo registrados) |
| Perfil/dashboard/avatares | API JSON funcionando | Endpoints ya existentes → apuntar a PG + auth |
| Admin de docentes | localStorage (CRUD completo) | API con rol `admin` |
| Actividad del panel | 5 seeds muertos, borrado en React state | Derivar de `audit_events` |
| Dashboard/estadísticas API | Parte calculada con `Math.random()` | Reemplazar por vistas SQL |
| Rankings (`MOCK_RANKING`, `MOCK_CLASSMATES`) y `ProfileScreen` hardcodeado | Mock puro | `v_league_leaderboard` y stats por usuario |
| IndexDB / mocks externos | No hay IndexDB; mocks en `panel/data`, `rooms.ts`, `lib/*` | — |

**Ya casi listos para backend** (solo cambia la fuente): modelos TypeScript del panel (`panel/types/index.ts`) y los stores de práctica/logros/liga, cuyos shape coinciden con las tablas nuevas.

## 21. Qué queda pendiente para conectar el backend

> **Actualización 2026-09-24 (fase 3 ejecutada):** WaitingRoom → `/api/salas` (join/poll/leave/estados); Leagues ranking → `/api/ranking` (`v_league_leaderboard`, campos públicos); decision-road documentado ACTIVO con consumidores (`GameCanvas`, `/camino-decisiones`), mocks decorativos clasificados ACTIVO PERO TEMPORAL; clase C verificada 0 consumidores. E2E `scripts/e2e_pg.ps1` **82/82**; `tsc` y `next build` OK. Bug: `leaveRoom` `RETURNING id` → `room_id` (PK compuesta). Detalle en `MIGRACION_POSTGRESQL.md` §8–§9. **Sin commit.**

1. **Elegir/crear el backend**: ✅ Next.js API Routes + `pg` sobre este esquema (sin ORM).
2. **Auth real**: ✅ scrypt + cookie httpOnly `eduplay_session` + `user_sessions`; panel auth separado.
3. **Endpoints mínimos**: ✅ auth; perfil; cursos/preguntas panel; salas; prácticas; logros; estrellas; actividad `audit_events`.
4. **Tiempo real de salas**: polling real en lobby/monitoreo (`salasService.refrescar`); sin WebSocket aún.
5. **Migración de datos** (§19): seeds de catálogo en PG; contenido de usuarios en runtime.
6. **Migración de invitados**: ✅ `POST /api/auth/migrate` con `guest_id` (server-side).
7. **Retirada progresiva de mocks**: ✅ stores + `panel/data` + WaitingRoom + Leagues ranking eliminados/migrados; ⏳ decision-road `MOCK_CLASSMATES`/`MOCK_PLAYER_NAMES` aún mock decorativo in-game (ACTIVO PERO TEMPORAL).
8. **Corregir falsos cálculos**: ✅ panel sobre SQL real; `api/dashboard` clase C con `Math.random` (sin consumidores).
9. **Limpieza**: ⏳ rutas clase C + `data/*.json` se conservan (0 consumidores; no auto-borrar JSON).
10. **Decisiones de producto abiertas** (§7): prácticas invitado no persisten historial (por diseño actual).

---

## Archivos entregados

```
db/
├── schema.sql                 # esquema completo (24 tablas, 45 índices, 6 vistas)
├── migrations/
│   └── 0001_init.sql          # primera migración (mismo contenido)
├── seed.sql                   # roles, modos, 30 ligas, 13 avatares, 150 logros
├── generate_achievement_seed.js
├── README.md                  # cómo aplicar
└── INFORME.md                 # este documento
```

---

## 22. Segunda auditoría (2026-09-23) — contraste con la versión actual

Se re-analizó el proyecto completo contra el esquema, sin ejecutar migraciones ni tocar datos. Resultados por sistema:

### 22.1 Sistemas modelados y verificados

| Sistema | Fuente en el código | Veredicto vs esquema |
|---|---|---|
| 4 modos de juego | `src/shared/lib/game-modes.tsx:5` (`decisiones/lava/tierras/abismos`) | ✅ Seed = 4. No existe quinto modo ("Modo Estudio" solo en `data/juegos.json` huérfano, descartado en §19). Panel `ModoJuego` declara solo 2 (`panel/types/index.ts:130`) pero `panel/data/juegos.ts` lista los 4: el catálogo amplio gana. |
| 150 logros (25/25/50/50) | `src/shared/lib/achievements-data.ts` (único catálogo, 4 consumidores) | ✅ Seed = 150; `ach_100`/`ach_150` con goal 49 y stat_key `*_all_unlocked` tal cual el motor actual. |
| 30 ligas | `src/lib/leagues.ts` (umbrales y orden) | ✅ Seed = 30 filas; verificación programática de `stars_required`/`sort_order`: **0 mismatches**. |
| Avatar custom | `src/lib/custom-avatar.ts` (`eduplay_custom_avatar`, JPEG 512×512) | ✅ **Ajustado**: nueva columna `users.custom_avatar` (§7.11). Antes: parcialmente modelado. |
| Capacidad de sala | `src/lib/rooms.ts:14` `maxJugadores: 20` + lógica de "sala llena" en `WaitingRoomScreen.tsx:104-114` (UI viva) | ✅ **Ajustado**: nueva columna `rooms.max_players` (nullable, sin default inventado). La API muerta `/api/salas` usaba 8; el panel no expone campo. |
| Estrellas ↔ liga | `league.store` recalcula en cliente; riesgo de divergencia | ✅ **Ajustado**: trigger `sync_league_from_stars` (§7.12). |
| Agregados de práctica | `Practice.correctAnswers/incorrectAnswers/lastPlayedAt` (`practice.store.ts:174-185`) | ✅ **Ajustado**: vista `v_practice_stats` deriva los tres campos de `practice_plays` (§14). Solo registrados incrementan (`PracticeResultsScreen.tsx:105`). |
| Banco fallback `dignidad-mujer` | `src/education/question-bank/` (21 preguntas A/B, importado por los 4 GameFlows con guard `length===0`) | ✅ No es contenido docente: es fallback estático. Documentado en `schema.sql`; importable en migración §19 si se desea. `Course` no tiene campo `questions` (modelo separado `Pregunta.cursoId` ≡ `questions.course_id`). |

### 22.2 Sistemas NO representados (correctamente ausentes)

No existen en el código vivo; no se inventan tablas:

- Temporadas, torneos/recompensas, misiones, amigos, chat, tienda, insignias de evento, notificaciones persistentes, rankings con premios.
- **Alertas del panel**: mock muerto (`actividadReciente` con 5 seeds; borrado solo en React state) → se deriva de `audit_events` (§4).
- **Notificaciones de logro**: toasts efímeros, no entidad.
- **Configuración `/configuracion`**: edita `nombre/apellido` vía `PATCH /api/estudiante/perfil` (ya modelado en `users`); cambio de contraseña es `setTimeout` sin API (pendiente de auth, §21.2); sin tema/sonido persistido → decisión §7.8 se mantiene.
- **Rangos Bronce–Plata–Oro–Diamante** (perfil): mock estático, redundante con ligas (§11).
- **Estrellas de resultado por precisión** (3/2/1 de `completeLevel`): solo en memoria de la partida; no se persisten hoy y no son estrellas de liga → no se modelan.
- Estudiante→docente directo (`panel/types Estudiante.teacherId`): mock; la relación real es vía `course_enrollments`.

### 22.3 APIs y datos huérfanos confirmados (no afectan al esquema)

- **APIs órfanas** (0 consumidores en el front): `/api/preguntas`, `/api/cuestionarios`, `/api/salas`, `/api/salas/unirse`, `/api/cursos`, `/api/dashboard`, `/api/juegos`, `/api/estadisticas`. APIs con consumo vivo: `/api/usuarios`, `/api/estudiante/perfil`, `/api/avatares`, `/api/ai/generate`.
- JSON `data/*.json` (15) y mocks `panel/data/*.ts` (9): respaldos/descartes según §19.

### 22.4 Índices podados (53 → 45)

Eliminados por redundancia o falta de consumidor: `idx_ltx_created`, `idx_panswers_match_q`, `idx_courses_status`, `idx_achprog_unlocked`, `idx_achievements_difficulty`, `idx_audit_created`, `idx_plp_league`, `idx_users_guest_merge`. Sustituido `idx_practices_mode` por `idx_practices_mode_pub (game_mode_id, published_at DESC) WHERE published` (chip de modo en listado público). Detalle en §17.

### 22.5 Verificación final ejecutada

- Seed vs código: ligas **30/30 umbrales y orden idénticos**, modos **4**, logros **150**, roles **3**, avatares **13**.
- Estructura: **24 tablas, 45 índices sin duplicados, 6 vistas, 13 enums, 11 triggers**.
- `schema.sql` ≡ `migrations/0001_init.sql` (hash SHA-256 idénticos).
- Solo se modificaron archivos dentro de `db/`; no se ejecutó ningún `psql`/DROP/conexión a BD.

---

## VEREDICTO TÉCNICO

**APROBADA Y EJECUTADA.**

La 2ª auditoría detectó 4 ajustes de diseño (avatar custom, capacidad de sala, trigger de consistencia de liga, vista de agregados de práctica) y 8 índices redundantes; **todos ya aplicados** dentro de `db/` y re-verificados contra el código fuente. El esquema (24 tablas / ~45 índices `idx_*` / 6 vistas + seeds de 4 modos, 30 ligas, 150 logros) representa fielmente la versión actual del proyecto, con los sistemas inexistentes documentados como ausentes intencionales y las decisiones de producto abiertas listadas en §7/§19/§21.

### Estado post-migración (2026-09-24, fase 3)

- Esquema y seeds **aplicados** en `eduplay_db` y verificados en runtime (24 tablas, 6 vistas, 13 enums, 11 triggers; 40 índices `idx_*` medidos en `pg_indexes`).
- Capa de datos real en `src/lib/db/` + APIs de auth/estrellas/logros/prácticas/salas/**ranking/waiting room** sobre PostgreSQL.
- Smoke E2E end-to-end superado **82/82** (base fase 2 44/44 sin regresiones + waiting room + ranking).
- WaitingRoom consume `/api/salas`; Leagues consume `/api/ranking`; decision-road documentado ACTIVO (no migrado auto); clase C 0 consumidores.
- Detalle completo, bugs corregidos y **clasificación de mocks**: ver [`MIGRACION_POSTGRESQL.md`](../MIGRACION_POSTGRESQL.md) §8–§9. **MIGRACIÓN COMPLETA** (sin commit).
