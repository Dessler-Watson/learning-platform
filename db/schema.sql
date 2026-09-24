-- ============================================================================
-- EduPlay — Esquema PostgreSQL (diseño definitivo post-hackathon)
-- Archivo: db/schema.sql
--
-- Estrategia de IDs : UUID v4 (gen_random_uuid) en todas las tablas.
--                     Códigos cortos naturales (salas, prácticas) aparte, con
--                     UNIQUE — no se usan como PK.
-- Timestamps        : TIMESTAMPTZ en todo; created_at/updated_at donde aportan;
--                     deleted_at (soft delete) solo en entidades de contenido
--                     y cuentas.
-- Soft delete       : usuarios, cursos, preguntas, prácticas, salas.
-- Contraseñas       : solo hash (password_hash). Nunca texto plano.
-- Tokens            : solo hash (token_hash) en sesiones. Nunca el token crudo.
--
-- Aplicar con:  psql -U <user> -d eduplay -f db/schema.sql
--               psql -U <user> -d eduplay -f db/seed.sql
-- ============================================================================

BEGIN;

-- gen_random_uuid() es nativo desde PostgreSQL 13; pgcrypto lo respalda antes.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- TIPOS (enums)
-- ============================================================================

CREATE TYPE user_status          AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE institution_status   AS ENUM ('active', 'inactive');
CREATE TYPE course_status        AS ENUM ('active', 'inactive', 'draft');
CREATE TYPE enrollment_status    AS ENUM ('active', 'dropped');
CREATE TYPE question_kind        AS ENUM ('single_choice', 'open');
CREATE TYPE content_status       AS ENUM ('active', 'inactive');
CREATE TYPE room_status          AS ENUM ('waiting', 'in_progress', 'finished', 'archived');
CREATE TYPE room_member_status   AS ENUM ('waiting', 'ready', 'kicked', 'left');
CREATE TYPE match_status         AS ENUM ('in_progress', 'finished', 'cancelled');
CREATE TYPE match_player_status  AS ENUM ('playing', 'finished', 'eliminated', 'left');
CREATE TYPE practice_status      AS ENUM ('private', 'published');
CREATE TYPE achievement_difficulty AS ENUM ('easy', 'medium', 'hard', 'legendary');
CREATE TYPE league_tx_source     AS ENUM ('room_match', 'adjustment', 'migration');

-- ============================================================================
-- CATÁLOGOS / CONFIGURACIÓN BASE
-- ============================================================================

-- Roles normalizados: student / teacher / admin (extensible sin tocar el esquema).
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE institutions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    status     institution_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_institutions_name
    ON institutions (lower(name)) WHERE deleted_at IS NULL;

-- Catálogo de avatares (contenido fijo de la app).
CREATE TABLE avatars (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    image      TEXT NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_avatars_name ON avatars (lower(name));

-- Modos de juego: catálogo abierto. Agregar un modo = INSERT, no ALTER TABLE.
-- stars_per_correct concentra aquí lo que hoy está duplicado en 4 stores.
CREATE TABLE game_modes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code               TEXT NOT NULL UNIQUE,   -- 'decisiones' | 'lava' | 'tierras' | 'abismos' | futuros
    name               TEXT NOT NULL,
    description        TEXT,
    logo_path          TEXT,
    color              TEXT,
    stars_per_correct  INTEGER NOT NULL DEFAULT 10 CHECK (stars_per_correct >= 0),
    sort_order         SMALLINT NOT NULL DEFAULT 0,
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ligas: 10 minerales x 3 niveles = 30 filas. Catálogo, no hardcodear en tablas de progreso.
CREATE TABLE leagues (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code           TEXT NOT NULL UNIQUE,     -- 'cuarzo-I' ... 'obsidiana-III'
    mineral        TEXT NOT NULL,            -- 'Cuarzo', 'Bronce', ...
    tier           SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 3),
    full_name      TEXT NOT NULL,            -- 'Cuarzo I'
    stars_required INTEGER NOT NULL CHECK (stars_required >= 0),
    sort_order     SMALLINT NOT NULL UNIQUE CHECK (sort_order > 0),
    image_path     TEXT,
    color          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================================================

-- Un solo universo de usuarios (student/teacher/admin) vía FK a roles.
-- Los invitados son filas reales con is_guest = TRUE: permiten persistir su
-- progreso temporal y migrarlo después a una cuenta registrada.
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id             UUID NOT NULL REFERENCES roles (id),
    institution_id      UUID REFERENCES institutions (id),
    avatar_id           UUID REFERENCES avatars (id) ON DELETE SET NULL,
    -- Foto personalizada (hoy: dataURL JPEG 512x512 en localStorage —
    -- src/lib/custom-avatar.ts). Tiene prioridad sobre avatar_id cuando
    -- no es NULL. El backend puede reemplazar el dataURL por una URL de
    -- object storage sin cambiar la columna.
    custom_avatar       TEXT,

    nombre              TEXT NOT NULL,
    apellido            TEXT,                      -- opcional (invitados)
    email               TEXT,                      -- NULL para invitados
    password_hash       TEXT,                      -- bcrypt/argon2; NULL para invitados / legacy
    must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,

    is_guest            BOOLEAN NOT NULL DEFAULT FALSE,
    status              user_status NOT NULL DEFAULT 'active',

    birth_date          DATE,                      -- PII sensible: restringir en API
    sex                 TEXT CHECK (sex IN ('masculino', 'femenino')),

    -- Cuando un invitado se registra, su fila origen apunta a la cuenta nueva
    -- y el servicio de migración reasigna el progreso en una transacción.
    merged_into_user_id UUID REFERENCES users (id),

    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,

    -- Invitados nunca llevan credenciales; registrados siempre tienen email.
    CONSTRAINT chk_guest_credentials CHECK (
        (is_guest AND email IS NULL AND password_hash IS NULL)
        OR (NOT is_guest AND email IS NOT NULL)
    )
);
CREATE UNIQUE INDEX uq_users_email
    ON users (lower(email)) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_users_role       ON users (role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_institution ON users (institution_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created     ON users (created_at DESC);

-- Sesiones de autenticación: solo hash del token (cookie httpOnly / JWT).
-- "online/offline" NO es una columna permanente: se deriva de last_seen_at.
CREATE TABLE user_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    user_agent   TEXT,
    ip_address   INET,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ
);
CREATE INDEX idx_sessions_user    ON user_sessions (user_id);
CREATE INDEX idx_sessions_expires ON user_sessions (expires_at);

-- ============================================================================
-- GAMIFICACIÓN: LIGAS
-- ============================================================================

-- Estado actual de la liga del jugador (denormalización controlada: se
-- recalcula al cerrar una partida competitiva y siempre se respalda en
-- league_transactions, que es la fuente de verdad del histórico).
CREATE TABLE player_league_progress (
    user_id           UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    stars             INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0),
    current_league_id UUID NOT NULL REFERENCES leagues (id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_plp_stars ON player_league_progress (stars DESC);

-- Consistencia garantizada: current_league_id SIEMPRE se deriva de stars
-- (la liga con mayor stars_required <= stars). No depende de que el backend
-- recuerde recalcularla; permite promoción y descenso con la misma regla.
CREATE OR REPLACE FUNCTION trg_sync_league_from_stars() RETURNS TRIGGER AS $$
DECLARE
    lid UUID;
BEGIN
    SELECT id INTO lid
    FROM leagues
    WHERE stars_required <= NEW.stars
    ORDER BY stars_required DESC, sort_order DESC
    LIMIT 1;

    IF lid IS NULL THEN
        SELECT id INTO lid FROM leagues ORDER BY sort_order ASC LIMIT 1;
    END IF;

    NEW.current_league_id := lid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_league_from_stars
    BEFORE INSERT OR UPDATE OF stars ON player_league_progress
    FOR EACH ROW EXECUTE FUNCTION trg_sync_league_from_stars();
-- Requiere que el catálogo de leagues esté sembrado antes del primer INSERT
-- de progreso (orden garantizado: schema.sql → seed.sql).

-- Libro mayor de estrellas de liga. La práctica NUNCA escribe aquí:
-- el enum no contempla 'practice' y el backend solo inserta
-- source='room_match' al finalizar una partida competitiva.
CREATE TABLE league_transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    delta_stars       INTEGER NOT NULL CHECK (delta_stars <> 0),
    stars_after       INTEGER NOT NULL CHECK (stars_after >= 0),
    league_id_before  UUID NOT NULL REFERENCES leagues (id),
    league_id_after   UUID NOT NULL REFERENCES leagues (id),
    source            league_tx_source NOT NULL,
    match_id          UUID,                      -- FK agregada tras crear matches
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ltx_user  ON league_transactions (user_id, created_at DESC);
CREATE INDEX idx_ltx_match ON league_transactions (match_id);

-- ============================================================================
-- GAMIFICACIÓN: LOGROS
-- ============================================================================

-- Catálogo de logros: agregar un logro = INSERT. Nunca columnas en users.
-- stat_key + goal replican el motor actual (achievement.store) de forma genérica.
CREATE TABLE achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code          TEXT NOT NULL UNIQUE,          -- 'ach_001' ... 'ach_150'
    name          TEXT NOT NULL,
    description   TEXT NOT NULL,
    game_mode_id  UUID REFERENCES game_modes (id),
    difficulty    achievement_difficulty NOT NULL,
    icon          TEXT,
    goal          INTEGER NOT NULL CHECK (goal > 0),
    stat_key      TEXT NOT NULL,                 -- 'tierras_best_streak', ...
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_achievements_mode     ON achievements (game_mode_id);
CREATE INDEX idx_achievements_stat_key ON achievements (stat_key);

-- Progreso por jugador. Los invitados no acumulan (regla de negocio del backend).
CREATE TABLE achievement_progress (
    user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
    progress       INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
    completed      BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ============================================================================
-- CONTENIDO DOCENTE: CURSOS Y PREGUNTAS
-- ============================================================================

CREATE TABLE courses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id    UUID NOT NULL REFERENCES users (id),          -- ON DELETE RESTRICT: histórico
    game_mode_id  UUID NOT NULL REFERENCES game_modes (id),
    name          TEXT NOT NULL,
    description   TEXT,
    status        course_status NOT NULL DEFAULT 'draft',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_courses_teacher_mode_name
    ON courses (teacher_id, game_mode_id, lower(name)) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_teacher ON courses (teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_mode    ON courses (game_mode_id) WHERE deleted_at IS NULL;

CREATE TABLE course_enrollments (
    course_id   UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    student_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status      enrollment_status NOT NULL DEFAULT 'active',
    progress    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (course_id, student_id)
);
CREATE INDEX idx_enrollments_student ON course_enrollments (student_id);

-- Preguntas: un dueño exacto por fila — curso (contenido docente) O práctica
-- (generada por IA / usuario). kind permite modos sin opción múltiple clásica.
-- Nota: src/education/question-bank/dignidad-mujer.ts es el banco FALLBACK
-- estático de los 4 juegos (solo se usa con 0 preguntas en el store); no es
-- contenido docente. Se importa como course+questions en la migración §19 si
-- el producto lo pide; el seed no incluye contenido de usuarios.
CREATE TABLE questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID REFERENCES courses (id) ON DELETE CASCADE,
    practice_id  UUID,                          -- FK agregada tras crear practices
    author_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    kind         question_kind NOT NULL DEFAULT 'single_choice',
    prompt       TEXT NOT NULL,
    explanation  TEXT,
    difficulty   TEXT CHECK (difficulty IN ('facil', 'media', 'dificil')),
    points       INTEGER NOT NULL DEFAULT 10 CHECK (points >= 0),
    status       content_status NOT NULL DEFAULT 'active',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT chk_question_single_owner CHECK (
        (course_id IS NOT NULL AND practice_id IS NULL)
        OR (course_id IS NULL AND practice_id IS NOT NULL)
    )
);
CREATE INDEX idx_questions_course   ON questions (course_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_practice ON questions (practice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_questions_author   ON questions (author_id);
CREATE INDEX idx_questions_course_sort
    ON questions (course_id, sort_order) WHERE deleted_at IS NULL AND status = 'active';

-- Opciones flexibles: 2 (A/B), 4 o ninguna (open). La correcta se marca aquí,
-- no como texto suelto en la pregunta.
CREATE TABLE question_options (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    sort_order  SMALLINT NOT NULL DEFAULT 0,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qoptions_question ON question_options (question_id, sort_order);

-- ============================================================================
-- SALAS Y PARTIDAS (separación estricta)
-- ============================================================================

-- ROOM = lobby con código de acceso. No contiene resultados.
CREATE TABLE rooms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id    UUID NOT NULL REFERENCES users (id),
    course_id     UUID NOT NULL REFERENCES courses (id),
    game_mode_id  UUID NOT NULL REFERENCES game_modes (id),
    name          TEXT,
    code          TEXT NOT NULL CHECK (code ~ '^[A-Za-z0-9]{6}$'),
    -- Capacidad del lobby (hoy: maxJugadores = 20 en el mock de sala de
    -- espera; la API muerta usaba 8). NULL = sin límite. No se inventa
    -- default: lo decide el backend/panel al crear la sala.
    max_players   SMALLINT CHECK (max_players IS NULL OR max_players > 0),
    status        room_status NOT NULL DEFAULT 'waiting',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at    TIMESTAMPTZ,
    finished_at   TIMESTAMPTZ,
    archived_at   TIMESTAMPTZ,
    deleted_at    TIMESTAMPTZ
);
-- Único entre salas vivas: los códigos de salas archivadas/eliminadas pueden
-- reutilizarse (los de prácticas no: sus enlaces deben seguir siendo únicos).
CREATE UNIQUE INDEX uq_rooms_code_active
    ON rooms (upper(code)) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_teacher ON rooms (teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_status  ON rooms (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_created ON rooms (created_at DESC);

-- Membership en el lobby de la sala.
CREATE TABLE room_participants (
    room_id       UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    display_name  TEXT NOT NULL,               -- snapshot al entrar
    avatar_id     UUID REFERENCES avatars (id) ON DELETE SET NULL,
    status        room_member_status NOT NULL DEFAULT 'waiting',
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at       TIMESTAMPTZ,
    PRIMARY KEY (room_id, user_id)
);
CREATE INDEX idx_roomparts_user ON room_participants (user_id);

-- MATCH = sesión de juego nacida de una sala. Una sala puede generar varias
-- partidas (re-runs); los resultados viven SIEMPRE en el match, no en la sala.
CREATE TABLE matches (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id        UUID NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
    game_mode_id   UUID NOT NULL REFERENCES game_modes (id),
    course_id      UUID NOT NULL REFERENCES courses (id),
    started_by     UUID REFERENCES users (id) ON DELETE SET NULL,
    status         match_status NOT NULL DEFAULT 'in_progress',
    question_count SMALLINT NOT NULL CHECK (question_count > 0),  -- snapshot del curso al iniciar
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at    TIMESTAMPTZ
);
CREATE INDEX idx_matches_room    ON matches (room_id, created_at DESC);
CREATE INDEX idx_matches_status  ON matches (status);
CREATE INDEX idx_matches_started ON matches (started_at DESC);

-- Participación individual dentro de una partida.
-- score/stars_earned/xp son caché de carrera en vivo (ranking live);
-- correctas/incorrectas/timeouts se DERIVAN de participant_answers.
CREATE TABLE match_participants (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id                UUID NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    display_name            TEXT NOT NULL,
    status                  match_player_status NOT NULL DEFAULT 'playing',
    eliminated_on_question  SMALLINT,
    score                   INTEGER NOT NULL DEFAULT 0,
    stars_earned            INTEGER NOT NULL DEFAULT 0 CHECK (stars_earned >= 0),
    xp                      INTEGER NOT NULL DEFAULT 0,
    joined_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at             TIMESTAMPTZ,
    UNIQUE (match_id, user_id)
);
CREATE INDEX idx_mparts_match ON match_participants (match_id, score DESC);
CREATE INDEX idx_mparts_user  ON match_participants (user_id);

-- DATO FUENTE de resultados: cada respuesta individual.
-- Todo lo que muestra el panel (promedios, %, timeouts, preguntas difíciles,
-- detalle por estudiante) se calcula a partir de esta tabla.
CREATE TABLE participant_answers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id         UUID NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    participant_id   UUID NOT NULL REFERENCES match_participants (id) ON DELETE CASCADE,
    question_id      UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    option_id        UUID REFERENCES question_options (id) ON DELETE SET NULL,
    question_position SMALLINT NOT NULL,
    is_correct       BOOLEAN,                    -- NULL si no respondió
    timed_out        BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    points_delta     INTEGER NOT NULL DEFAULT 0,
    stars_delta      INTEGER NOT NULL DEFAULT 0, -- estrellas de liga ganadas en esta respuesta
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (participant_id, question_position)
);
CREATE INDEX idx_panswers_match    ON participant_answers (match_id);
CREATE INDEX idx_panswers_part     ON participant_answers (participant_id);
CREATE INDEX idx_panswers_question ON participant_answers (question_id);

-- ============================================================================
-- PRÁCTICA (independiente de la competitiva; nunca otorga estrellas de liga)
-- ============================================================================

CREATE TABLE practices (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Za-z0-9]{6}$'),
    creator_id   UUID NOT NULL REFERENCES users (id),
    game_mode_id UUID NOT NULL REFERENCES game_modes (id),
    title        TEXT NOT NULL,
    description  TEXT,
    topic        TEXT,
    status       practice_status NOT NULL DEFAULT 'private',
    play_count   INTEGER NOT NULL DEFAULT 0 CHECK (play_count >= 0),  -- caché de plays
    published_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);
CREATE INDEX idx_practices_creator ON practices (creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_practices_mode_pub ON practices (game_mode_id, published_at DESC)
    WHERE deleted_at IS NULL AND status = 'published';  -- chips de modo en listado público
CREATE INDEX idx_practices_public  ON practices (status, published_at DESC)
    WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX idx_practices_title   ON practices (lower(title))
    WHERE deleted_at IS NULL AND status = 'published';

-- Preguntas de la práctica → questions.practice_id (dueño único, arriba).

-- Historial de jugadas de práctica. Solo se insertan filas para usuarios con
-- cuenta (regla de negocio actual): los invitados juegan sin historial.
CREATE TABLE practice_plays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id     UUID NOT NULL REFERENCES practices (id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    score           INTEGER NOT NULL DEFAULT 0,
    correct_count   SMALLINT NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count SMALLINT NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    total_questions SMALLINT NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
    duration_ms     INTEGER,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_pplays_user     ON practice_plays (user_id, started_at DESC);
CREATE INDEX idx_pplays_practice ON practice_plays (practice_id);

CREATE TABLE practice_answers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_id          UUID NOT NULL REFERENCES practice_plays (id) ON DELETE CASCADE,
    question_id      UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    option_id        UUID REFERENCES question_options (id) ON DELETE SET NULL,
    question_position SMALLINT NOT NULL,
    is_correct       BOOLEAN,
    timed_out        BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (play_id, question_position)
);
CREATE INDEX idx_practanswers_play     ON practice_answers (play_id);
CREATE INDEX idx_practanswers_question ON practice_answers (question_id);

-- ============================================================================
-- AUDITORÍA / ACTIVIDAD
-- ============================================================================

-- Fuente única para el feed de actividad del panel y la auditoría admin.
-- La actividad visible se deriva filtrando por actor_id + entity de interés;
-- no se mantiene una lista paralela hardcodeada.
CREATE TABLE audit_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,                  -- 'room' | 'course' | 'question' | 'user' | ...
    entity_id   UUID,
    action      TEXT NOT NULL,                  -- 'created' | 'updated' | 'deleted' | 'published' ...
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor  ON audit_events (actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_events (entity_type, entity_id, created_at DESC);

-- ============================================================================
-- FKs DIFERIDAS (tablas referenciadas creadas después)
-- ============================================================================

ALTER TABLE league_transactions
    ADD CONSTRAINT fk_ltx_match
    FOREIGN KEY (match_id) REFERENCES matches (id) ON DELETE SET NULL;

ALTER TABLE questions
    ADD CONSTRAINT fk_questions_practice
    FOREIGN KEY (practice_id) REFERENCES practices (id) ON DELETE CASCADE;

-- ============================================================================
-- TRIGGERS updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON game_modes
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON player_league_progress
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON achievement_progress
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON course_enrollments
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON practices
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- VISTAS (datos derivados — no almacenarlos como tablas)
-- ============================================================================

-- Estadísticas por participante en partidas (correctas/incorrectas/timeouts).
CREATE OR REPLACE VIEW v_match_participant_stats AS
SELECT
    mp.id                AS participant_id,
    mp.match_id,
    mp.user_id,
    mp.display_name,
    mp.status,
    mp.score,
    mp.stars_earned,
    COUNT(pa.id)                                              AS answered,
    COUNT(pa.id) FILTER (WHERE pa.is_correct = TRUE)          AS correct,
    COUNT(pa.id) FILTER (WHERE pa.is_correct = FALSE)         AS incorrect,
    COUNT(pa.id) FILTER (WHERE pa.timed_out)                  AS timeouts,
    COUNT(pa.id) FILTER (WHERE pa.is_correct IS NULL AND NOT pa.timed_out) AS unanswered,
    ROUND(AVG(pa.response_time_ms) FILTER (WHERE pa.response_time_ms IS NOT NULL)) AS avg_response_ms
FROM match_participants mp
LEFT JOIN participant_answers pa ON pa.participant_id = mp.id
GROUP BY mp.id;

-- Dificultad por pregunta dentro de partidas (preguntas difíciles del panel).
CREATE OR REPLACE VIEW v_question_match_stats AS
SELECT
    pa.question_id,
    COUNT(*)                                        AS total_answers,
    COUNT(*) FILTER (WHERE pa.is_correct = TRUE)    AS correct,
    COUNT(*) FILTER (WHERE pa.is_correct = FALSE)   AS incorrect,
    COUNT(*) FILTER (WHERE pa.timed_out)            AS timeouts,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE pa.is_correct = TRUE) / NULLIF(COUNT(*), 0),
        1
    )                                               AS pct_correct
FROM participant_answers pa
GROUP BY pa.question_id;

-- Acumulado por usuario y modo de juego (estadísticas del dashboard).
CREATE OR REPLACE VIEW v_user_mode_stats AS
SELECT
    mp.user_id,
    m.game_mode_id,
    COUNT(DISTINCT mp.match_id)                                AS matches_played,
    COUNT(pa.id) FILTER (WHERE pa.is_correct = TRUE)           AS correct,
    COUNT(pa.id) FILTER (WHERE pa.is_correct = FALSE)          AS incorrect,
    COUNT(pa.id) FILTER (WHERE pa.timed_out)                   AS timeouts,
    ROUND(AVG(pa.response_time_ms) FILTER (WHERE pa.response_time_ms IS NOT NULL)) AS avg_response_ms,
    MAX(mp.score)                                              AS best_score
FROM match_participants mp
JOIN matches m ON m.id = mp.match_id
LEFT JOIN participant_answers pa ON pa.participant_id = mp.id
GROUP BY mp.user_id, m.game_mode_id;

-- Ranking de ligas.
CREATE OR REPLACE VIEW v_league_leaderboard AS
SELECT
    u.id            AS user_id,
    u.nombre,
    u.apellido,
    u.avatar_id,
    plp.stars,
    l.full_name     AS league_name,
    l.mineral,
    l.tier,
    l.sort_order,
    RANK() OVER (ORDER BY plp.stars DESC) AS global_rank
FROM player_league_progress plp
JOIN users u  ON u.id = plp.user_id AND u.deleted_at IS NULL AND NOT u.is_guest
JOIN leagues l ON l.id = plp.current_league_id;

-- Ranking final por partida.
CREATE OR REPLACE VIEW v_match_ranking AS
SELECT
    mp.match_id,
    mp.user_id,
    mp.display_name,
    mp.score,
    mp.status,
    DENSE_RANK() OVER (PARTITION BY mp.match_id ORDER BY mp.score DESC) AS position
FROM match_participants mp;

-- Estadísticas agregadas de práctica (tipo Practice del front:
-- correctAnswers / incorrectAnswers / lastPlayedAt). Se DERIVAN de
-- practice_plays — no se duplican como columnas. practices.play_count
-- se mantiene como caché de ordenación (la verdad exacta está aquí).
CREATE OR REPLACE VIEW v_practice_stats AS
SELECT
    p.id                                                    AS practice_id,
    COUNT(pl.id)                                            AS play_count_exact,
    COALESCE(SUM(pl.correct_count), 0)                      AS correct_answers,
    COALESCE(SUM(pl.incorrect_count), 0)                    AS incorrect_answers,
    MAX(pl.finished_at)                                     AS last_played_at
FROM practices p
LEFT JOIN practice_plays pl ON pl.practice_id = p.id
GROUP BY p.id;

COMMIT;
