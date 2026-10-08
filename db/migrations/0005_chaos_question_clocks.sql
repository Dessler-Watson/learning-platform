-- MODO CAOS ETAPA 2 (Grupo 2): modificador 'contrarreloj'.
--
-- Reloj de pregunta autoritativo: una fila por participante y posición de
-- pregunta con la hora EN QUE EL SERVIDOR registró el inicio de esa pregunta
-- (POST /api/partida { action: 'question_started' }). El servidor nunca
-- acepta la hora del cliente: primer reclamo en llegar gana (ON CONFLICT DO
-- NOTHING) y el reclamo se recorta (LEAST) contra el ancla correspondiente.
--
-- question_position = -1 es el ancla de arranque (boot): se inserta en el
-- GET /api/partida y limita el reclamo tardío de la primera pregunta.
--
-- Idempotente (IF NOT EXISTS) y en la misma línea que 0003/0004.

BEGIN;

CREATE TABLE IF NOT EXISTS participant_question_clocks (
    participant_id    UUID NOT NULL REFERENCES match_participants (id) ON DELETE CASCADE,
    question_position SMALLINT NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (participant_id, question_position)
);

COMMIT;
