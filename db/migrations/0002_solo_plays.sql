-- ============================================================================
-- EduPlay — 0002: jugadas locales/práctica para logros
--
-- Los juegos sin sala (local y práctica) no dejan rastro en matches /
-- participant_answers, así que el evaluador de logros no podía verlos.
-- Esta tabla registra cada jugada terminada declarada por el cliente
-- (POST /api/logros { action: 'record_play' }); el servidor valida la sesión
-- (solo usuarios registrados), acota los valores y evalúa el progreso.
--
-- Aplicar con:  psql -U postgres -d eduplay_db -f db/migrations/0002_solo_plays.sql
-- Idempotente: se puede re-ejecutar sin efectos.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS solo_plays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    mode            TEXT NOT NULL CHECK (mode IN ('decisiones', 'lava', 'tierras', 'abismos')),
    score           INTEGER NOT NULL DEFAULT 0,
    xp              INTEGER NOT NULL DEFAULT 0,
    correct_count   INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    best_streak     INTEGER NOT NULL DEFAULT 0,
    ticks           INTEGER,
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    had_error       BOOLEAN NOT NULL DEFAULT FALSE,
    played_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solo_plays_user ON solo_plays (user_id, played_at DESC);

COMMIT;
