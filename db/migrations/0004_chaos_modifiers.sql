-- ============================================================================
-- EduPlay — 0004: MODO CAOS (ETAPA 2 — Paso 1: modificadores, plumbing)
--
-- chaos_rooms.modifiers (JSONB, default '[]') guarda la combinación de
-- modificadores sorteada UNA sola vez al crear la sala Caos
-- (src/lib/db/chaos.ts → createChaosRoom). Al iniciar la partida,
-- attachChaosToMatch la copia a matches.modifiers (fuente de verdad que
-- viaja por GET /api/partida). En este paso los modificadores son SOLO
-- datos: ningún efecto de gameplay está implementado.
--
-- Compatibilidad: las filas existentes quedan con '[]' (sin modificadores),
-- que es exactamente el comportamiento anterior. No se tocan otras tablas.
--
-- Aplicar con:  psql -U postgres -d eduplay_db -f db/migrations/0004_chaos_modifiers.sql
-- Idempotente: se puede re-ejecutar sin efectos.
-- ============================================================================

BEGIN;

ALTER TABLE chaos_rooms ADD COLUMN IF NOT EXISTS modifiers JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
