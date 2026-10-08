-- ============================================================================
-- EduPlay — 0003: MODO CAOS (ETAPA 1 — infraestructura)
--
-- 1. rooms.kind distingue salas docentes ('docente', default) de salas creadas
--    por estudiantes en Modo Caos ('caos'). El default conserva el flujo
--    docente intacto.
-- 2. chaos_rooms guarda la configuración de la sala Caos: dificultad pedida,
--    tema sorteado por la IA, estado de la generación de preguntas
--    (pending/ready/failed), cantidad de preguntas insertadas y el juego
--    sorteado server-side (game_code).
-- 3. matches.modifiers (JSONB, default '[]') es el registro de modificadores
--    de la partida — ETAPA 2 lo poblará; se crea ya para no migrar después.
--    matches.chaos_room_id enlaza la partida con su configuración Caos.
--
-- El curso sintético por sala Caos (nombre 'Caos <codigo>') se crea en
-- runtime (src/lib/db/chaos.ts): questions.course_id es NOT NULL por el
-- constraint chk_question_single_owner y participant_answers.question_id
-- referencia a questions, así que cada sala Caos necesita su propio curso.
--
-- Aplicar con:  psql -U postgres -d eduplay_db -f db/migrations/0003_chaos.sql
-- Idempotente: se puede re-ejecutar sin efectos.
-- ============================================================================

BEGIN;

-- 1) rooms.kind -------------------------------------------------------------
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'docente';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'rooms_kind_check'
    ) THEN
        ALTER TABLE rooms
            ADD CONSTRAINT rooms_kind_check CHECK (kind IN ('docente', 'caos'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rooms_kind ON rooms (kind) WHERE deleted_at IS NULL;

-- 2) chaos_rooms ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chaos_rooms (
    room_id            UUID PRIMARY KEY REFERENCES rooms (id) ON DELETE CASCADE,
    difficulty         TEXT NOT NULL DEFAULT 'media'
                         CHECK (difficulty IN ('facil', 'medio', 'dificil', 'experto', 'caos')),
    tema               TEXT,
    generation_status  TEXT NOT NULL DEFAULT 'pending'
                         CHECK (generation_status IN ('pending', 'running', 'ready', 'failed')),
    question_count     INTEGER NOT NULL DEFAULT 0 CHECK (question_count >= 0),
    game_code          TEXT NOT NULL
                         CHECK (game_code IN ('decisiones', 'lava', 'tierras', 'abismos')),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 'running' = reclamada por un worker de generación (evita doble INSERT si el
-- reintento por stale se solapa con la llamada original). Drop+add idempotente
-- para que corridas previas sin 'running' queden actualizadas.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chaos_rooms_generation_status_check'
    ) THEN
        ALTER TABLE chaos_rooms DROP CONSTRAINT chaos_rooms_generation_status_check;
    END IF;
END $$;

ALTER TABLE chaos_rooms
    ADD CONSTRAINT chaos_rooms_generation_status_check
    CHECK (generation_status IN ('pending', 'running', 'ready', 'failed'));

-- 3) matches: modificadores (ETAPA 2) + enlace Caos -------------------------
ALTER TABLE matches ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS chaos_room_id UUID
    REFERENCES chaos_rooms (room_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_chaos
    ON matches (chaos_room_id) WHERE chaos_room_id IS NOT NULL;

COMMIT;
