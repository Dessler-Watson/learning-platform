-- ============================================================================
-- EduPlay — Datos iniciales (catálogos y configuración base)
-- Archivo: db/seed.sql
--
-- Aplicar DESPUÉS de db/schema.sql:
--   psql -U <user> -d eduplay -f db/seed.sql
--
-- Contenido: roles, modos de juego, ligas (30 niveles), avatares y logros (150).
-- NO incluye usuarios, cursos ni preguntas: son datos creados por las personas
-- que usan la plataforma.
--
-- Idempotencia: usa ON CONFLICT DO NOTHING/UPDATE para poder re-ejecutarse.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ROLES
-- ----------------------------------------------------------------------------
INSERT INTO roles (code, name, description) VALUES
    ('student', 'Estudiante', 'Jugador que realiza prácticas y participa en salas'),
    ('teacher', 'Docente',   'Crea cursos, preguntas y salas de juego'),
    ('admin',   'Administrador', 'Gestiona cuentas docentes e instituciones')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. MODOS DE JUEGO
--    stars_per_correct = estrellas de liga por acierto en modo competitivo.
--    La práctica no usa este valor (no otorga estrellas de liga).
-- ----------------------------------------------------------------------------
INSERT INTO game_modes (code, name, description, logo_path, color, stars_per_correct, sort_order)
VALUES
    ('decisiones', 'Rumbo',               'Camino de las Decisiones: elige la puerta correcta.', '/images/Logos_juegos/rumbo.png',           '#4FC3F7', 10, 1),
    ('lava',       'Bajo Presión',        'La Lava del Conocimiento: responde antes de que suba la lava.', '/images/Logos_juegos/bajo_presion.png', '#EF4444', 15, 2),
    ('tierras',    'Tierras Hundidas',    'Plataformas que se hunden con cada error.',           '/images/Logos_juegos/tierras_hundidas.png', '#1B5E20', 20, 3),
    ('abismos',    'Entre Abismos',       'Cruza el abismo respondiendo correctamente.',         '/images/Logos_juegos/entre_abismos.png',  '#1976D2', 20, 4)
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. LIGAS — 10 minerales x 3 niveles (I/II/III), 30 niveles
--    Umbrales idénticos a src/lib/leagues.ts (fuente vigente del front).
-- ----------------------------------------------------------------------------
INSERT INTO leagues (code, mineral, tier, full_name, stars_required, sort_order, image_path, color) VALUES
    ('cuarzo-I',    'Cuarzo',    1, 'Cuarzo I',       0,     1,  '/images/ligas/Cuarzo I.png',       '#A0A0A0'),
    ('cuarzo-II',   'Cuarzo',    2, 'Cuarzo II',      100,   2,  '/images/ligas/Cuarzo II.png',      '#A0A0A0'),
    ('cuarzo-III',  'Cuarzo',    3, 'Cuarzo III',     250,   3,  '/images/ligas/Cuarzo III.png',     '#A0A0A0'),
    ('bronce-I',    'Bronce',    1, 'Bronce I',       450,   4,  '/images/ligas/Bronce I.png',       '#CD7F32'),
    ('bronce-II',   'Bronce',    2, 'Bronce II',      700,   5,  '/images/ligas/Bronce II.png',      '#CD7F32'),
    ('bronce-III',  'Bronce',    3, 'Bronce III',     1000,  6,  '/images/ligas/Bronce III.png',     '#CD7F32'),
    ('cobre-I',     'Cobre',     1, 'Cobre I',        1350,  7,  '/images/ligas/Cobre I.png',        '#B87333'),
    ('cobre-II',    'Cobre',     2, 'Cobre II',       1750,  8,  '/images/ligas/Cobre II.png',       '#B87333'),
    ('cobre-III',   'Cobre',     3, 'Cobre III',      2200,  9,  '/images/ligas/Cobre III.png',      '#B87333'),
    ('plata-I',     'Plata',     1, 'Plata I',        2700,  10, '/images/ligas/Plata I.png',        '#94A3B8'),
    ('plata-II',    'Plata',     2, 'Plata II',       3250,  11, '/images/ligas/Plata II.png',       '#94A3B8'),
    ('plata-III',   'Plata',     3, 'Plata III',      3850,  12, '/images/ligas/Plata III.png',      '#94A3B8'),
    ('oro-I',       'Oro',       1, 'Oro I',          4500,  13, '/images/ligas/Oro I.png',          '#F9A825'),
    ('oro-II',      'Oro',       2, 'Oro II',         5200,  14, '/images/ligas/Oro II.png',         '#F9A825'),
    ('oro-III',     'Oro',       3, 'Oro III',        6000,  15, '/images/ligas/Oro III.png',        '#F9A825'),
    ('rubi-I',      'Rubí',      1, 'Rubí I',         6850,  16, '/images/ligas/Rubí I.png',         '#E53935'),
    ('rubi-II',     'Rubí',      2, 'Rubí II',        7750,  17, '/images/ligas/Rubí II.png',        '#E53935'),
    ('rubi-III',    'Rubí',      3, 'Rubí III',       8700,  18, '/images/ligas/Rubí III.png',       '#E53935'),
    ('amatista-I',  'Amatista',  1, 'Amatista I',     9700,  19, '/images/ligas/Amatista I.png',     '#9C27B0'),
    ('amatista-II', 'Amatista',  2, 'Amatista II',    10750, 20, '/images/ligas/Amatista II.png',    '#9C27B0'),
    ('amatista-III','Amatista',  3, 'Amatista III',   11850, 21, '/images/ligas/Amatista III.png',   '#9C27B0'),
    ('diamante-I',  'Diamante',  1, 'Diamante I',     13000, 22, '/images/ligas/Diamante I.png',     '#00BCD4'),
    ('diamante-II', 'Diamante',  2, 'Diamante II',    14200, 23, '/images/ligas/Diamante II.png',    '#00BCD4'),
    ('diamante-III','Diamante',  3, 'Diamante III',   15450, 24, '/images/ligas/Diamante III.png',   '#00BCD4'),
    ('esmeralda-I', 'Esmeralda', 1, 'Esmeralda I',    16750, 25, '/images/ligas/Esmeralda I.png',    '#4CAF50'),
    ('esmeralda-II','Esmeralda', 2, 'Esmeralda II',   18100, 26, '/images/ligas/Esmeralda II.png',   '#4CAF50'),
    ('esmeralda-III','Esmeralda',3, 'Esmeralda III',  19500, 27, '/images/ligas/Esmeralda III.png',  '#4CAF50'),
    ('obsidiana-I', 'Obsidiana', 1, 'Obsidiana I',    20950, 28, '/images/ligas/Obsidiana I.png',    '#7B1FA2'),
    ('obsidiana-II','Obsidiana', 2, 'Obsidiana II',   22450, 29, '/images/ligas/Obsidiana II.png',   '#7B1FA2'),
    ('obsidiana-III','Obsidiana',3, 'Obsidiana III',  24000, 30, '/images/ligas/Obsidiana III.png',  '#7B1FA2')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. AVATARES (catálogo actual: data/avatares.json)
-- ----------------------------------------------------------------------------
INSERT INTO avatars (name, image, sort_order) VALUES
    ('Güegüense',    'gueguense.png',    1),
    ('León',         'leon.png',         2),
    ('Máscara',      'mascara.png',      3),
    ('Mariposa',     'mariposa.png',     4),
    ('Nacatamal',    'nacatamal.png',    5),
    ('Guardabarranco','guardabarranco.png', 6),
    ('Sacuanjoche',  'sacuanjoche.png',  7),
    ('Madroño',      'madrono.png',      8),
    ('Ideay',        'ideay.png',        9),
    ('presion',      'presion.png',     10),
    ('abismo',       'abismo.png',      11),
    ('rumbo',        'rumbo.png',       12),
    ('pantano',      'pantano.png',     13)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. LOGROS (150 — generados desde src/shared/lib/achievements-data.ts)
-- ----------------------------------------------------------------------------
INSERT INTO achievements (code, name, description, game_mode_id, difficulty, icon, goal, stat_key)
SELECT v.code, v.name, v.description, gm.id, v.difficulty::achievement_difficulty, v.icon, v.goal, v.stat_key
FROM (VALUES
  ('ach_001', 'Primer Paso', 'Completa tu primera partida de Rumbo.', 'decisiones', 'easy', 'Route', 1, 'decisiones_games_completed'),
  ('ach_002', 'Respuesta Correcta', 'Responde correctamente 1 pregunta.', 'decisiones', 'easy', 'CheckCircle', 1, 'decisiones_correct_answers'),
  ('ach_003', 'Aprendiz', 'Responde correctamente 10 preguntas.', 'decisiones', 'easy', 'BookOpen', 10, 'decisiones_correct_answers'),
  ('ach_004', 'Racha de 3', 'Consigue una racha de 3 respuestas correctas seguidas.', 'decisiones', 'easy', 'Flame', 3, 'decisiones_best_streak'),
  ('ach_005', 'Puntuacion Minima', 'Alcanza 50 puntos en una partida.', 'decisiones', 'easy', 'Star', 50, 'decisiones_best_score'),
  ('ach_006', 'Experiencia', 'Acumula 50 XP en total.', 'decisiones', 'easy', 'Zap', 50, 'decisiones_total_xp'),
  ('ach_007', 'Explorador', 'Completa 5 partidas de Rumbo.', 'decisiones', 'medium', 'Compass', 5, 'decisiones_games_completed'),
  ('ach_008', 'Estudiante', 'Responde correctamente 50 preguntas.', 'decisiones', 'medium', 'GraduationCap', 50, 'decisiones_correct_answers'),
  ('ach_009', 'Racha de 5', 'Consigue una racha de 5 respuestas correctas seguidas.', 'decisiones', 'medium', 'Flame', 5, 'decisiones_best_streak'),
  ('ach_010', 'Buen Puntaje', 'Alcanza 200 puntos en una partida.', 'decisiones', 'medium', 'TrendingUp', 200, 'decisiones_best_score'),
  ('ach_011', 'Precision', 'Logra 80% o mas de precision en una partida.', 'decisiones', 'medium', 'Target', 80, 'decisiones_best_accuracy'),
  ('ach_012', 'Experimentado', 'Completa 10 partidas de Rumbo.', 'decisiones', 'medium', 'Award', 10, 'decisiones_games_completed'),
  ('ach_013', 'Conocedor', 'Responde correctamente 100 preguntas.', 'decisiones', 'medium', 'BookOpen', 100, 'decisiones_correct_answers'),
  ('ach_014', 'Racha de 8', 'Consigue una racha de 8 respuestas correctas seguidas.', 'decisiones', 'medium', 'Flame', 8, 'decisiones_best_streak'),
  ('ach_015', 'Experiencia Avanzada', 'Acumula 500 XP en total.', 'decisiones', 'medium', 'Zap', 500, 'decisiones_total_xp'),
  ('ach_016', 'Veterano', 'Completa 25 partidas de Rumbo.', 'decisiones', 'hard', 'Medal', 25, 'decisiones_games_completed'),
  ('ach_017', 'Sabio', 'Responde correctamente 200 preguntas.', 'decisiones', 'hard', 'Brain', 200, 'decisiones_correct_answers'),
  ('ach_018', 'Racha de 10', 'Consigue una racha de 10 respuestas correctas seguidas.', 'decisiones', 'hard', 'Flame', 10, 'decisiones_best_streak'),
  ('ach_019', 'Precision Perfecta', 'Logra 100% de precision en una partida.', 'decisiones', 'hard', 'Target', 100, 'decisiones_best_accuracy'),
  ('ach_020', 'Puntuacion Alta', 'Alcanza 500 puntos en una partida.', 'decisiones', 'hard', 'TrendingUp', 500, 'decisiones_best_score'),
  ('ach_021', 'Experiencia Maestra', 'Acumula 1500 XP en total.', 'decisiones', 'hard', 'Zap', 1500, 'decisiones_total_xp'),
  ('ach_022', 'Maestro', 'Responde correctamente 500 preguntas.', 'decisiones', 'legendary', 'Crown', 500, 'decisiones_correct_answers'),
  ('ach_023', 'Leyenda', 'Completa 50 partidas de Rumbo.', 'decisiones', 'legendary', 'Trophy', 50, 'decisiones_games_completed'),
  ('ach_024', 'Racha de 15', 'Consigue una racha de 15 respuestas correctas seguidas.', 'decisiones', 'legendary', 'Flame', 15, 'decisiones_best_streak'),
  ('ach_025', 'Ingenio Infinito', 'Alcanza 1000 puntos en una partida.', 'decisiones', 'legendary', 'Sparkles', 1000, 'decisiones_best_score'),
  ('ach_026', 'Primer Fuego', 'Completa tu primera partida de Bajo Presión.', 'lava', 'easy', 'Flame', 1, 'lava_games_completed'),
  ('ach_027', 'Respuesta en Llamas', 'Responde correctamente 1 pregunta en Bajo Presión.', 'lava', 'easy', 'CheckCircle', 1, 'lava_correct_answers'),
  ('ach_028', 'Aprendiz del Fuego', 'Responde correctamente 10 preguntas en Bajo Presión.', 'lava', 'easy', 'BookOpen', 10, 'lava_correct_answers'),
  ('ach_029', 'Superviviente', 'Sobrevive sin ser eliminado en tu primera partida.', 'lava', 'easy', 'Shield', 1, 'lava_games_survived'),
  ('ach_030', 'Puntuacion de Fuego', 'Alcanza 50 puntos en una partida de Bajo Presión.', 'lava', 'easy', 'Star', 50, 'lava_best_score'),
  ('ach_031', 'Resistencia', 'Alcanza 3 ticks (maximo) en una partida.', 'lava', 'easy', 'Heart', 3, 'lava_max_ticks_reached'),
  ('ach_032', 'Corredor de Lava', 'Completa 5 partidas de Bajo Presión.', 'lava', 'medium', 'Flame', 5, 'lava_games_completed'),
  ('ach_033', 'Conocedor del Fuego', 'Responde correctamente 50 preguntas en Bajo Presión.', 'lava', 'medium', 'BookOpen', 50, 'lava_correct_answers'),
  ('ach_034', 'Superviviente Veterano', 'Sobrevive sin ser eliminado en 5 partidas.', 'lava', 'medium', 'Shield', 5, 'lava_games_survived'),
  ('ach_035', 'Puntuacion Caliente', 'Alcanza 200 puntos en una partida de Bajo Presión.', 'lava', 'medium', 'TrendingUp', 200, 'lava_best_score'),
  ('ach_036', 'Precision en Fuego', 'Logra 80% o mas de precision en una partida de Bajo Presión.', 'lava', 'medium', 'Target', 80, 'lava_best_accuracy'),
  ('ach_037', 'Experimentado del Fuego', 'Completa 10 partidas de Bajo Presión.', 'lava', 'medium', 'Award', 10, 'lava_games_completed'),
  ('ach_038', 'Maestro del Fuego', 'Responde correctamente 100 preguntas en Bajo Presión.', 'lava', 'medium', 'Brain', 100, 'lava_correct_answers'),
  ('ach_039', 'Escapista', 'Sobrevive sin ser eliminado en 10 partidas.', 'lava', 'medium', 'Shield', 10, 'lava_games_survived'),
  ('ach_040', 'Experiencia de Fuego', 'Acumula 500 puntos de experiencia total en Bajo Presión.', 'lava', 'medium', 'Zap', 500, 'lava_total_score'),
  ('ach_041', 'Veterano del Fuego', 'Completa 25 partidas de Bajo Presión.', 'lava', 'hard', 'Medal', 25, 'lava_games_completed'),
  ('ach_042', 'Sabio del Fuego', 'Responde correctamente 200 preguntas en Bajo Presión.', 'lava', 'hard', 'Brain', 200, 'lava_correct_answers'),
  ('ach_043', 'Superviviente Elite', 'Sobrevive sin ser eliminado en 25 partidas.', 'lava', 'hard', 'Shield', 25, 'lava_games_survived'),
  ('ach_044', 'Precision en Llamas', 'Logra 100% de precision en una partida de Bajo Presión.', 'lava', 'hard', 'Target', 100, 'lava_best_accuracy'),
  ('ach_045', 'Puntuacion Infernal', 'Alcanza 500 puntos en una partida de Bajo Presión.', 'lava', 'hard', 'TrendingUp', 500, 'lava_best_score'),
  ('ach_046', 'Experiencia de Lava', 'Acumula 1500 puntos de experiencia total en Bajo Presión.', 'lava', 'hard', 'Zap', 1500, 'lava_total_score'),
  ('ach_047', 'Maestro del Fuego', 'Responde correctamente 500 preguntas en Bajo Presión.', 'lava', 'legendary', 'Crown', 500, 'lava_correct_answers'),
  ('ach_048', 'Leyenda de la Lava', 'Completa 50 partidas de Bajo Presión.', 'lava', 'legendary', 'Trophy', 50, 'lava_games_completed'),
  ('ach_049', 'Superviviente Legendario', 'Sobrevive sin ser eliminado en 50 partidas.', 'lava', 'legendary', 'Shield', 50, 'lava_games_survived'),
  ('ach_050', 'Inmune al Fuego', 'Alcanza 1000 puntos en una partida de Bajo Presión.', 'lava', 'legendary', 'Sparkles', 1000, 'lava_best_score'),
  ('ach_051', 'Primer Descenso', 'Completa tu primera partida de Tierras Hundidas.', 'tierras', 'easy', 'Waves', 1, 'tierras_games_played'),
  ('ach_052', 'Explorador Submarino', 'Completa 3 partidas.', 'tierras', 'easy', 'Compass', 3, 'tierras_games_played'),
  ('ach_053', 'Bajo la Superficie', 'Completa 5 partidas.', 'tierras', 'easy', 'Waves', 5, 'tierras_games_played'),
  ('ach_054', 'Aventurero Hundido', 'Completa 10 partidas.', 'tierras', 'medium', 'Compass', 10, 'tierras_games_played'),
  ('ach_055', 'Habitante de las Profundidades', 'Completa 25 partidas.', 'tierras', 'hard', 'Medal', 25, 'tierras_games_played'),
  ('ach_056', 'Veterano Subterraneo', 'Completa 50 partidas.', 'tierras', 'hard', 'Award', 50, 'tierras_games_played'),
  ('ach_057', 'Maestro de las Profundidades', 'Completa 75 partidas.', 'tierras', 'legendary', 'Crown', 75, 'tierras_games_played'),
  ('ach_058', 'Leyenda Sumergida', 'Completa 100 partidas.', 'tierras', 'legendary', 'Trophy', 100, 'tierras_games_played'),
  ('ach_059', 'Primer Descubrimiento', 'Responde correctamente 1 pregunta.', 'tierras', 'easy', 'CheckCircle', 1, 'tierras_correct_answers'),
  ('ach_060', 'Explorador Novato', 'Consigue 10 respuestas correctas.', 'tierras', 'easy', 'BookOpen', 10, 'tierras_correct_answers'),
  ('ach_061', 'Conocimiento Profundo', 'Consigue 25 respuestas correctas.', 'tierras', 'medium', 'Brain', 25, 'tierras_correct_answers'),
  ('ach_062', 'Mente Sumergida', 'Consigue 50 respuestas correctas.', 'tierras', 'medium', 'GraduationCap', 50, 'tierras_correct_answers'),
  ('ach_063', 'Experto de las Profundidades', 'Consigue 100 respuestas correctas.', 'tierras', 'hard', 'Brain', 100, 'tierras_correct_answers'),
  ('ach_064', 'Sabio Subterraneo', 'Consigue 250 respuestas correctas.', 'tierras', 'hard', 'Brain', 250, 'tierras_correct_answers'),
  ('ach_065', 'Conocimiento Abisal', 'Consigue 500 respuestas correctas.', 'tierras', 'legendary', 'Crown', 500, 'tierras_correct_answers'),
  ('ach_066', 'Sin Hundirse', 'Consigue una racha de 3 respuestas correctas.', 'tierras', 'easy', 'Flame', 3, 'tierras_best_streak'),
  ('ach_067', 'Paso Profundo', 'Consigue una racha de 5 respuestas correctas.', 'tierras', 'easy', 'Flame', 5, 'tierras_best_streak'),
  ('ach_068', 'Descenso Imparable', 'Consigue una racha de 10 respuestas correctas.', 'tierras', 'medium', 'Flame', 10, 'tierras_best_streak'),
  ('ach_069', 'Fuerza Abisal', 'Consigue una racha de 15 respuestas correctas.', 'tierras', 'hard', 'Flame', 15, 'tierras_best_streak'),
  ('ach_070', 'Voluntad de Acero', 'Consigue una racha de 20 respuestas correctas.', 'tierras', 'legendary', 'Flame', 20, 'tierras_best_streak'),
  ('ach_071', 'Inmersion Perfecta', 'Completa una partida sin respuestas incorrectas.', 'tierras', 'easy', 'Target', 1, 'tierras_perfect_games'),
  ('ach_072', 'Descenso Impecable', 'Consigue una partida perfecta 3 veces.', 'tierras', 'medium', 'Target', 3, 'tierras_perfect_games'),
  ('ach_073', 'Dominio Subterraneo', 'Consigue 5 partidas perfectas.', 'tierras', 'medium', 'Target', 5, 'tierras_perfect_games'),
  ('ach_074', 'Explorador Perfecto', 'Consigue 10 partidas perfectas.', 'tierras', 'hard', 'Target', 10, 'tierras_perfect_games'),
  ('ach_075', 'Maestria Sumergida', 'Consigue 20 partidas perfectas.', 'tierras', 'legendary', 'Target', 20, 'tierras_perfect_games'),
  ('ach_076', 'No Me Hundo', 'Completa una partida sin ser eliminado.', 'tierras', 'easy', 'Shield', 1, 'tierras_games_survived'),
  ('ach_077', 'Superviviente Subterraneo', 'Completa 5 partidas sin ser eliminado.', 'tierras', 'medium', 'Shield', 5, 'tierras_games_survived'),
  ('ach_078', 'Resistencia Abisal', 'Completa 10 partidas sin ser eliminado.', 'tierras', 'medium', 'Shield', 10, 'tierras_games_survived'),
  ('ach_079', 'Guardian de las Profundidades', 'Completa 25 partidas sin ser eliminado.', 'tierras', 'hard', 'Shield', 25, 'tierras_games_survived'),
  ('ach_080', 'Inmortal de las Tierras Hundidas', 'Completa 50 partidas sin ser eliminado.', 'tierras', 'legendary', 'Shield', 50, 'tierras_games_survived'),
  ('ach_081', 'Golpe Certero', 'Responde correctamente 5 preguntas seguidas.', 'tierras', 'easy', 'Target', 5, 'tierras_best_streak'),
  ('ach_082', 'Mente Profunda', 'Responde correctamente 10 preguntas seguidas.', 'tierras', 'medium', 'Target', 10, 'tierras_best_streak'),
  ('ach_083', 'Sin Perder el Rumbo', 'Responde correctamente 15 preguntas seguidas.', 'tierras', 'hard', 'Target', 15, 'tierras_best_streak'),
  ('ach_084', 'Precision Abisal', 'Responde correctamente 20 preguntas seguidas.', 'tierras', 'legendary', 'Target', 20, 'tierras_best_streak'),
  ('ach_085', 'Maestro Sumergido', 'Responde correctamente 30 preguntas seguidas.', 'tierras', 'legendary', 'Target', 30, 'tierras_best_streak'),
  ('ach_086', 'Primer Tesoro', 'Obtén 50 puntos en Tierras Hundidas.', 'tierras', 'easy', 'Star', 50, 'tierras_best_score'),
  ('ach_087', 'Tesoro Encontrado', 'Obtén 100 puntos.', 'tierras', 'easy', 'Star', 100, 'tierras_best_score'),
  ('ach_088', 'Riqueza Sumergida', 'Obtén 250 puntos.', 'tierras', 'medium', 'TrendingUp', 250, 'tierras_best_score'),
  ('ach_089', 'Tesoro de las Profundidades', 'Obtén 500 puntos.', 'tierras', 'hard', 'TrendingUp', 500, 'tierras_best_score'),
  ('ach_090', 'Tesoro Abisal', 'Obtén 1,000 puntos acumulados.', 'tierras', 'legendary', 'Sparkles', 1000, 'tierras_total_score'),
  ('ach_091', 'Sobrevivi al Descenso', 'Completa una partida después de cometer un error.', 'tierras', 'easy', 'Heart', 1, 'tierras_games_after_error'),
  ('ach_092', 'Regreso a la Superficie', 'Gana una partida después de haber perdido una partida anterior.', 'tierras', 'medium', 'Waves', 1, 'tierras_wins_after_loss'),
  ('ach_093', 'Exploracion Continua', 'Completa 3 partidas consecutivas.', 'tierras', 'medium', 'Compass', 3, 'tierras_best_win_streak'),
  ('ach_094', 'Expedicion Profunda', 'Completa 5 partidas consecutivas.', 'tierras', 'hard', 'Compass', 5, 'tierras_best_win_streak'),
  ('ach_095', 'Viaje Sin Fin', 'Completa 10 partidas consecutivas.', 'tierras', 'legendary', 'Compass', 10, 'tierras_best_win_streak'),
  ('ach_096', 'Conquistador Sumergido', 'Gana 10 partidas.', 'tierras', 'medium', 'Medal', 10, 'tierras_games_won'),
  ('ach_097', 'Señor de las Profundidades', 'Gana 25 partidas.', 'tierras', 'hard', 'Award', 25, 'tierras_games_won'),
  ('ach_098', 'Leyenda Sumergida II', 'Gana 50 partidas.', 'tierras', 'legendary', 'Trophy', 50, 'tierras_games_won'),
  ('ach_099', 'Rey del Abismo', 'Gana 100 partidas.', 'tierras', 'legendary', 'Crown', 100, 'tierras_games_won'),
  ('ach_100', 'Dueño de las Tierras Hundidas', 'Desbloquea todos los logros de Tierras Hundidas.', 'tierras', 'legendary', 'Trophy', 49, 'tierras_all_unlocked'),
  ('ach_101', 'Primer Salto', 'Completa tu primera partida de Entre Abismos.', 'abismos', 'easy', 'Mountain', 1, 'abismos_games_played'),
  ('ach_102', 'Entre las Nubes', 'Completa 3 partidas.', 'abismos', 'easy', 'Mountain', 3, 'abismos_games_played'),
  ('ach_103', 'Explorador del Abismo', 'Completa 5 partidas.', 'abismos', 'easy', 'Compass', 5, 'abismos_games_played'),
  ('ach_104', 'Viajero de las Alturas', 'Completa 10 partidas.', 'abismos', 'medium', 'Compass', 10, 'abismos_games_played'),
  ('ach_105', 'Habitante de los Abismos', 'Completa 25 partidas.', 'abismos', 'hard', 'Medal', 25, 'abismos_games_played'),
  ('ach_106', 'Dominator de las Alturas', 'Completa 50 partidas.', 'abismos', 'hard', 'Award', 50, 'abismos_games_played'),
  ('ach_107', 'Veterano del Vacio', 'Completa 75 partidas.', 'abismos', 'legendary', 'Crown', 75, 'abismos_games_played'),
  ('ach_108', 'Leyenda del Abismo', 'Completa 100 partidas.', 'abismos', 'legendary', 'Trophy', 100, 'abismos_games_played'),
  ('ach_109', 'Primer Paso', 'Responde correctamente 1 pregunta.', 'abismos', 'easy', 'CheckCircle', 1, 'abismos_correct_answers'),
  ('ach_110', 'Buen Comienzo', 'Consigue 10 respuestas correctas.', 'abismos', 'easy', 'BookOpen', 10, 'abismos_correct_answers'),
  ('ach_111', 'Mente Precisa', 'Consigue 25 respuestas correctas.', 'abismos', 'medium', 'Brain', 25, 'abismos_correct_answers'),
  ('ach_112', 'Salto de Conocimiento', 'Consigue 50 respuestas correctas.', 'abismos', 'medium', 'GraduationCap', 50, 'abismos_correct_answers'),
  ('ach_113', 'Experto de las Alturas', 'Consigue 100 respuestas correctas.', 'abismos', 'hard', 'Brain', 100, 'abismos_correct_answers'),
  ('ach_114', 'Maestro del Vacio', 'Consigue 250 respuestas correctas.', 'abismos', 'hard', 'Brain', 250, 'abismos_correct_answers'),
  ('ach_115', 'Sabio de los Abismos', 'Consigue 500 respuestas correctas.', 'abismos', 'legendary', 'Crown', 500, 'abismos_correct_answers'),
  ('ach_116', 'Sin Tropezar', 'Consigue una racha de 3 respuestas correctas.', 'abismos', 'easy', 'Flame', 3, 'abismos_best_streak'),
  ('ach_117', 'Paso Seguro', 'Consigue una racha de 5 respuestas correctas.', 'abismos', 'easy', 'Flame', 5, 'abismos_best_streak'),
  ('ach_118', 'Sobre el Vacio', 'Consigue una racha de 10 respuestas correctas.', 'abismos', 'medium', 'Flame', 10, 'abismos_best_streak'),
  ('ach_119', 'Equilibrio Perfecto', 'Consigue una racha de 15 respuestas correctas.', 'abismos', 'hard', 'Flame', 15, 'abismos_best_streak'),
  ('ach_120', 'Imparable en las Alturas', 'Consigue una racha de 20 respuestas correctas.', 'abismos', 'legendary', 'Flame', 20, 'abismos_best_streak'),
  ('ach_121', 'Salto Perfecto', 'Completa una partida sin respuestas incorrectas.', 'abismos', 'easy', 'Target', 1, 'abismos_perfect_games'),
  ('ach_122', 'Cruce Impecable', 'Consigue una partida perfecta 3 veces.', 'abismos', 'medium', 'Target', 3, 'abismos_perfect_games'),
  ('ach_123', 'Maestria Aerea', 'Consigue 5 partidas perfectas.', 'abismos', 'medium', 'Target', 5, 'abismos_perfect_games'),
  ('ach_124', 'Caminante del Cielo', 'Consigue 10 partidas perfectas.', 'abismos', 'hard', 'Target', 10, 'abismos_perfect_games'),
  ('ach_125', 'Dominio Absoluto', 'Consigue 20 partidas perfectas.', 'abismos', 'legendary', 'Target', 20, 'abismos_perfect_games'),
  ('ach_126', 'No Cai', 'Completa una partida sin caer al vacio.', 'abismos', 'easy', 'Shield', 1, 'abismos_games_survived'),
  ('ach_127', 'Pies Firmes', 'Completa 5 partidas sin caer.', 'abismos', 'medium', 'Shield', 5, 'abismos_games_survived'),
  ('ach_128', 'Equilibrista', 'Completa 10 partidas sin caer.', 'abismos', 'medium', 'Shield', 10, 'abismos_games_survived'),
  ('ach_129', 'Guardian del Abismo', 'Completa 25 partidas sin caer.', 'abismos', 'hard', 'Shield', 25, 'abismos_games_survived'),
  ('ach_130', 'Dueño del Vacio', 'Completa 50 partidas sin caer.', 'abismos', 'legendary', 'Shield', 50, 'abismos_games_survived'),
  ('ach_131', 'Respuesta Certera', 'Responde correctamente 5 preguntas seguidas.', 'abismos', 'easy', 'Target', 5, 'abismos_best_streak'),
  ('ach_132', 'Pulso Firme', 'Responde correctamente 10 preguntas seguidas.', 'abismos', 'medium', 'Target', 10, 'abismos_best_streak'),
  ('ach_133', 'Mente Inamovible', 'Responde correctamente 15 preguntas seguidas.', 'abismos', 'hard', 'Target', 15, 'abismos_best_streak'),
  ('ach_134', 'Precision Celestial', 'Responde correctamente 20 preguntas seguidas.', 'abismos', 'legendary', 'Target', 20, 'abismos_best_streak'),
  ('ach_135', 'Maestro del Equilibrio', 'Responde correctamente 30 preguntas seguidas.', 'abismos', 'legendary', 'Target', 30, 'abismos_best_streak'),
  ('ach_136', 'Primer Impulso', 'Obtén 50 puntos en Entre Abismos.', 'abismos', 'easy', 'Star', 50, 'abismos_best_score'),
  ('ach_137', 'Altura Ganada', 'Obtén 100 puntos.', 'abismos', 'easy', 'Star', 100, 'abismos_best_score'),
  ('ach_138', 'Sobre las Nubes', 'Obtén 250 puntos.', 'abismos', 'medium', 'TrendingUp', 250, 'abismos_best_score'),
  ('ach_139', 'Mas Alla del Cielo', 'Obtén 500 puntos.', 'abismos', 'hard', 'TrendingUp', 500, 'abismos_best_score'),
  ('ach_140', 'Conquistador del Abismo', 'Obtén 1,000 puntos acumulados.', 'abismos', 'legendary', 'Sparkles', 1000, 'abismos_total_score'),
  ('ach_141', 'Ultimo Salto', 'Completa una partida después de cometer un error.', 'abismos', 'easy', 'Heart', 1, 'abismos_games_after_error'),
  ('ach_142', 'Volver a Intentarlo', 'Gana una partida después de haber perdido una partida anterior.', 'abismos', 'medium', 'Mountain', 1, 'abismos_wins_after_loss'),
  ('ach_143', 'Sin Miedo a las Alturas', 'Completa 3 partidas consecutivas.', 'abismos', 'medium', 'Compass', 3, 'abismos_best_win_streak'),
  ('ach_144', 'Ruta Celestial', 'Completa 5 partidas consecutivas.', 'abismos', 'hard', 'Compass', 5, 'abismos_best_win_streak'),
  ('ach_145', 'Horizonte Infinito', 'Completa 10 partidas consecutivas.', 'abismos', 'legendary', 'Compass', 10, 'abismos_best_win_streak'),
  ('ach_146', 'Maestro de los Abismos', 'Gana 10 partidas.', 'abismos', 'medium', 'Medal', 10, 'abismos_games_won'),
  ('ach_147', 'Señor de las Alturas', 'Gana 25 partidas.', 'abismos', 'hard', 'Award', 25, 'abismos_games_won'),
  ('ach_148', 'Leyenda Celestial', 'Gana 50 partidas.', 'abismos', 'legendary', 'Trophy', 50, 'abismos_games_won'),
  ('ach_149', 'Mas Alla del Abismo', 'Gana 100 partidas.', 'abismos', 'legendary', 'Crown', 100, 'abismos_games_won'),
  ('ach_150', 'Rey de las Alturas', 'Desbloquea todos los logros de Entre Abismos.', 'abismos', 'legendary', 'Trophy', 49, 'abismos_all_unlocked')
) AS v(code, name, description, mode, difficulty, icon, goal, stat_key)
JOIN game_modes gm ON gm.code = v.mode
ON CONFLICT (code) DO NOTHING;


COMMIT;

