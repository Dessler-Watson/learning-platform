import type { AchievementDefinition } from '@/shared/types/achievement';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============================================
  // RUMBO - 25 achievements
  // ============================================

  // Easy (6)
  { id: 'ach_001', name: 'Primer Paso', description: 'Completa tu primera partida de Rumbo.', mode: 'decisiones', icon: 'Route', difficulty: 'easy', goal: 1, statKey: 'decisiones_games_completed' },
  { id: 'ach_002', name: 'Respuesta Correcta', description: 'Responde correctamente 1 pregunta.', mode: 'decisiones', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'decisiones_correct_answers' },
  { id: 'ach_003', name: 'Aprendiz', description: 'Responde correctamente 10 preguntas.', mode: 'decisiones', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'decisiones_correct_answers' },
  { id: 'ach_004', name: 'Racha de 3', description: 'Consigue una racha de 3 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'easy', goal: 3, statKey: 'decisiones_best_streak' },
  { id: 'ach_005', name: 'Puntuacion Minima', description: 'Alcanza 50 puntos en una partida.', mode: 'decisiones', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'decisiones_best_score' },
  { id: 'ach_006', name: 'Experiencia', description: 'Acumula 50 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'easy', goal: 50, statKey: 'decisiones_total_xp' },

  // Medium (9)
  { id: 'ach_007', name: 'Explorador', description: 'Completa 5 partidas de Rumbo.', mode: 'decisiones', icon: 'Compass', difficulty: 'medium', goal: 5, statKey: 'decisiones_games_completed' },
  { id: 'ach_008', name: 'Estudiante', description: 'Responde correctamente 50 preguntas.', mode: 'decisiones', icon: 'GraduationCap', difficulty: 'medium', goal: 50, statKey: 'decisiones_correct_answers' },
  { id: 'ach_009', name: 'Racha de 5', description: 'Consigue una racha de 5 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'medium', goal: 5, statKey: 'decisiones_best_streak' },
  { id: 'ach_010', name: 'Buen Puntaje', description: 'Alcanza 200 puntos en una partida.', mode: 'decisiones', icon: 'TrendingUp', difficulty: 'medium', goal: 200, statKey: 'decisiones_best_score' },
  { id: 'ach_011', name: 'Precision', description: 'Logra 80% o mas de precision en una partida.', mode: 'decisiones', icon: 'Target', difficulty: 'medium', goal: 80, statKey: 'decisiones_best_accuracy' },
  { id: 'ach_012', name: 'Experimentado', description: 'Completa 10 partidas de Rumbo.', mode: 'decisiones', icon: 'Award', difficulty: 'medium', goal: 10, statKey: 'decisiones_games_completed' },
  { id: 'ach_013', name: 'Conocedor', description: 'Responde correctamente 100 preguntas.', mode: 'decisiones', icon: 'BookOpen', difficulty: 'medium', goal: 100, statKey: 'decisiones_correct_answers' },
  { id: 'ach_014', name: 'Racha de 8', description: 'Consigue una racha de 8 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'medium', goal: 8, statKey: 'decisiones_best_streak' },
  { id: 'ach_015', name: 'Experiencia Avanzada', description: 'Acumula 500 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'medium', goal: 500, statKey: 'decisiones_total_xp' },

  // Hard (6)
  { id: 'ach_016', name: 'Veterano', description: 'Completa 25 partidas de Rumbo.', mode: 'decisiones', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'decisiones_games_completed' },
  { id: 'ach_017', name: 'Sabio', description: 'Responde correctamente 200 preguntas.', mode: 'decisiones', icon: 'Brain', difficulty: 'hard', goal: 200, statKey: 'decisiones_correct_answers' },
  { id: 'ach_018', name: 'Racha de 10', description: 'Consigue una racha de 10 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'hard', goal: 10, statKey: 'decisiones_best_streak' },
  { id: 'ach_019', name: 'Precision Perfecta', description: 'Logra 100% de precision en una partida.', mode: 'decisiones', icon: 'Target', difficulty: 'hard', goal: 100, statKey: 'decisiones_best_accuracy' },
  { id: 'ach_020', name: 'Puntuacion Alta', description: 'Alcanza 500 puntos en una partida.', mode: 'decisiones', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'decisiones_best_score' },
  { id: 'ach_021', name: 'Experiencia Maestra', description: 'Acumula 1500 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'hard', goal: 1500, statKey: 'decisiones_total_xp' },

  // Legendary (4)
  { id: 'ach_022', name: 'Maestro', description: 'Responde correctamente 500 preguntas.', mode: 'decisiones', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'decisiones_correct_answers' },
  { id: 'ach_023', name: 'Leyenda', description: 'Completa 50 partidas de Rumbo.', mode: 'decisiones', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'decisiones_games_completed' },
  { id: 'ach_024', name: 'Racha de 15', description: 'Consigue una racha de 15 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'legendary', goal: 15, statKey: 'decisiones_best_streak' },
  { id: 'ach_025', name: 'Ingenio Infinito', description: 'Alcanza 1000 puntos en una partida.', mode: 'decisiones', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'decisiones_best_score' },

  // ============================================
  // BAJO PRESIÓN - 25 achievements
  // ============================================

  // Easy (6)
  { id: 'ach_026', name: 'Primer Fuego', description: 'Completa tu primera partida de Bajo Presión.', mode: 'lava', icon: 'Flame', difficulty: 'easy', goal: 1, statKey: 'lava_games_completed' },
  { id: 'ach_027', name: 'Respuesta en Llamas', description: 'Responde correctamente 1 pregunta en Bajo Presión.', mode: 'lava', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'lava_correct_answers' },
  { id: 'ach_028', name: 'Aprendiz del Fuego', description: 'Responde correctamente 10 preguntas en Bajo Presión.', mode: 'lava', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'lava_correct_answers' },
  { id: 'ach_029', name: 'Superviviente', description: 'Sobrevive sin ser eliminado en tu primera partida.', mode: 'lava', icon: 'Shield', difficulty: 'easy', goal: 1, statKey: 'lava_games_survived' },
  { id: 'ach_030', name: 'Puntuacion de Fuego', description: 'Alcanza 50 puntos en una partida de Bajo Presión.', mode: 'lava', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'lava_best_score' },
  { id: 'ach_031', name: 'Resistencia', description: 'Alcanza 3 ticks (maximo) en una partida.', mode: 'lava', icon: 'Heart', difficulty: 'easy', goal: 3, statKey: 'lava_max_ticks_reached' },

  // Medium (9)
  { id: 'ach_032', name: 'Corredor de Lava', description: 'Completa 5 partidas de Bajo Presión.', mode: 'lava', icon: 'Flame', difficulty: 'medium', goal: 5, statKey: 'lava_games_completed' },
  { id: 'ach_033', name: 'Conocedor del Fuego', description: 'Responde correctamente 50 preguntas en Bajo Presión.', mode: 'lava', icon: 'BookOpen', difficulty: 'medium', goal: 50, statKey: 'lava_correct_answers' },
  { id: 'ach_034', name: 'Superviviente Veterano', description: 'Sobrevive sin ser eliminado en 5 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'medium', goal: 5, statKey: 'lava_games_survived' },
  { id: 'ach_035', name: 'Puntuacion Caliente', description: 'Alcanza 200 puntos en una partida de Bajo Presión.', mode: 'lava', icon: 'TrendingUp', difficulty: 'medium', goal: 200, statKey: 'lava_best_score' },
  { id: 'ach_036', name: 'Precision en Fuego', description: 'Logra 80% o mas de precision en una partida de Bajo Presión.', mode: 'lava', icon: 'Target', difficulty: 'medium', goal: 80, statKey: 'lava_best_accuracy' },
  { id: 'ach_037', name: 'Experimentado del Fuego', description: 'Completa 10 partidas de Bajo Presión.', mode: 'lava', icon: 'Award', difficulty: 'medium', goal: 10, statKey: 'lava_games_completed' },
  { id: 'ach_038', name: 'Maestro del Fuego', description: 'Responde correctamente 100 preguntas en Bajo Presión.', mode: 'lava', icon: 'Brain', difficulty: 'medium', goal: 100, statKey: 'lava_correct_answers' },
  { id: 'ach_039', name: 'Escapista', description: 'Sobrevive sin ser eliminado en 10 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'medium', goal: 10, statKey: 'lava_games_survived' },
  { id: 'ach_040', name: 'Experiencia de Fuego', description: 'Acumula 500 puntos de experiencia total en Bajo Presión.', mode: 'lava', icon: 'Zap', difficulty: 'medium', goal: 500, statKey: 'lava_total_score' },

  // Hard (6)
  { id: 'ach_041', name: 'Veterano del Fuego', description: 'Completa 25 partidas de Bajo Presión.', mode: 'lava', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'lava_games_completed' },
  { id: 'ach_042', name: 'Sabio del Fuego', description: 'Responde correctamente 200 preguntas en Bajo Presión.', mode: 'lava', icon: 'Brain', difficulty: 'hard', goal: 200, statKey: 'lava_correct_answers' },
  { id: 'ach_043', name: 'Superviviente Elite', description: 'Sobrevive sin ser eliminado en 25 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'hard', goal: 25, statKey: 'lava_games_survived' },
  { id: 'ach_044', name: 'Precision en Llamas', description: 'Logra 100% de precision en una partida de Bajo Presión.', mode: 'lava', icon: 'Target', difficulty: 'hard', goal: 100, statKey: 'lava_best_accuracy' },
  { id: 'ach_045', name: 'Puntuacion Infernal', description: 'Alcanza 500 puntos en una partida de Bajo Presión.', mode: 'lava', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'lava_best_score' },
  { id: 'ach_046', name: 'Experiencia de Lava', description: 'Acumula 1500 puntos de experiencia total en Bajo Presión.', mode: 'lava', icon: 'Zap', difficulty: 'hard', goal: 1500, statKey: 'lava_total_score' },

  // Legendary (4)
  { id: 'ach_047', name: 'Maestro del Fuego', description: 'Responde correctamente 500 preguntas en Bajo Presión.', mode: 'lava', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'lava_correct_answers' },
  { id: 'ach_048', name: 'Leyenda de la Lava', description: 'Completa 50 partidas de Bajo Presión.', mode: 'lava', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'lava_games_completed' },
  { id: 'ach_049', name: 'Superviviente Legendario', description: 'Sobrevive sin ser eliminado en 50 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'legendary', goal: 50, statKey: 'lava_games_survived' },
  { id: 'ach_050', name: 'Inmune al Fuego', description: 'Alcanza 1000 puntos en una partida de Bajo Presión.', mode: 'lava', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'lava_best_score' },

  // ============================================
  // TIERRAS HUNDIDAS - 50 achievements (ach_051-ach_100)
  // ============================================

  // Progresión (8)
  { id: 'ach_051', name: 'Primer Descenso', description: 'Completa tu primera partida de Tierras Hundidas.', mode: 'tierras', icon: 'Waves', difficulty: 'easy', goal: 1, statKey: 'tierras_games_played' },
  { id: 'ach_052', name: 'Explorador Submarino', description: 'Completa 3 partidas.', mode: 'tierras', icon: 'Compass', difficulty: 'easy', goal: 3, statKey: 'tierras_games_played' },
  { id: 'ach_053', name: 'Bajo la Superficie', description: 'Completa 5 partidas.', mode: 'tierras', icon: 'Waves', difficulty: 'easy', goal: 5, statKey: 'tierras_games_played' },
  { id: 'ach_054', name: 'Aventurero Hundido', description: 'Completa 10 partidas.', mode: 'tierras', icon: 'Compass', difficulty: 'medium', goal: 10, statKey: 'tierras_games_played' },
  { id: 'ach_055', name: 'Habitante de las Profundidades', description: 'Completa 25 partidas.', mode: 'tierras', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'tierras_games_played' },
  { id: 'ach_056', name: 'Veterano Subterraneo', description: 'Completa 50 partidas.', mode: 'tierras', icon: 'Award', difficulty: 'hard', goal: 50, statKey: 'tierras_games_played' },
  { id: 'ach_057', name: 'Maestro de las Profundidades', description: 'Completa 75 partidas.', mode: 'tierras', icon: 'Crown', difficulty: 'legendary', goal: 75, statKey: 'tierras_games_played' },
  { id: 'ach_058', name: 'Leyenda Sumergida', description: 'Completa 100 partidas.', mode: 'tierras', icon: 'Trophy', difficulty: 'legendary', goal: 100, statKey: 'tierras_games_played' },

  // Respuestas correctas (7)
  { id: 'ach_059', name: 'Primer Descubrimiento', description: 'Responde correctamente 1 pregunta.', mode: 'tierras', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'tierras_correct_answers' },
  { id: 'ach_060', name: 'Explorador Novato', description: 'Consigue 10 respuestas correctas.', mode: 'tierras', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'tierras_correct_answers' },
  { id: 'ach_061', name: 'Conocimiento Profundo', description: 'Consigue 25 respuestas correctas.', mode: 'tierras', icon: 'Brain', difficulty: 'medium', goal: 25, statKey: 'tierras_correct_answers' },
  { id: 'ach_062', name: 'Mente Sumergida', description: 'Consigue 50 respuestas correctas.', mode: 'tierras', icon: 'GraduationCap', difficulty: 'medium', goal: 50, statKey: 'tierras_correct_answers' },
  { id: 'ach_063', name: 'Experto de las Profundidades', description: 'Consigue 100 respuestas correctas.', mode: 'tierras', icon: 'Brain', difficulty: 'hard', goal: 100, statKey: 'tierras_correct_answers' },
  { id: 'ach_064', name: 'Sabio Subterraneo', description: 'Consigue 250 respuestas correctas.', mode: 'tierras', icon: 'Brain', difficulty: 'hard', goal: 250, statKey: 'tierras_correct_answers' },
  { id: 'ach_065', name: 'Conocimiento Abisal', description: 'Consigue 500 respuestas correctas.', mode: 'tierras', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'tierras_correct_answers' },

  // Rachas (5)
  { id: 'ach_066', name: 'Sin Hundirse', description: 'Consigue una racha de 3 respuestas correctas.', mode: 'tierras', icon: 'Flame', difficulty: 'easy', goal: 3, statKey: 'tierras_best_streak' },
  { id: 'ach_067', name: 'Paso Profundo', description: 'Consigue una racha de 5 respuestas correctas.', mode: 'tierras', icon: 'Flame', difficulty: 'easy', goal: 5, statKey: 'tierras_best_streak' },
  { id: 'ach_068', name: 'Descenso Imparable', description: 'Consigue una racha de 10 respuestas correctas.', mode: 'tierras', icon: 'Flame', difficulty: 'medium', goal: 10, statKey: 'tierras_best_streak' },
  { id: 'ach_069', name: 'Fuerza Abisal', description: 'Consigue una racha de 15 respuestas correctas.', mode: 'tierras', icon: 'Flame', difficulty: 'hard', goal: 15, statKey: 'tierras_best_streak' },
  { id: 'ach_070', name: 'Voluntad de Acero', description: 'Consigue una racha de 20 respuestas correctas.', mode: 'tierras', icon: 'Flame', difficulty: 'legendary', goal: 20, statKey: 'tierras_best_streak' },

  // Partidas perfectas (5)
  { id: 'ach_071', name: 'Inmersion Perfecta', description: 'Completa una partida sin respuestas incorrectas.', mode: 'tierras', icon: 'Target', difficulty: 'easy', goal: 1, statKey: 'tierras_perfect_games' },
  { id: 'ach_072', name: 'Descenso Impecable', description: 'Consigue una partida perfecta 3 veces.', mode: 'tierras', icon: 'Target', difficulty: 'medium', goal: 3, statKey: 'tierras_perfect_games' },
  { id: 'ach_073', name: 'Dominio Subterraneo', description: 'Consigue 5 partidas perfectas.', mode: 'tierras', icon: 'Target', difficulty: 'medium', goal: 5, statKey: 'tierras_perfect_games' },
  { id: 'ach_074', name: 'Explorador Perfecto', description: 'Consigue 10 partidas perfectas.', mode: 'tierras', icon: 'Target', difficulty: 'hard', goal: 10, statKey: 'tierras_perfect_games' },
  { id: 'ach_075', name: 'Maestria Sumergida', description: 'Consigue 20 partidas perfectas.', mode: 'tierras', icon: 'Target', difficulty: 'legendary', goal: 20, statKey: 'tierras_perfect_games' },

  // Supervivencia (5)
  { id: 'ach_076', name: 'No Me Hundo', description: 'Completa una partida sin ser eliminado.', mode: 'tierras', icon: 'Shield', difficulty: 'easy', goal: 1, statKey: 'tierras_games_survived' },
  { id: 'ach_077', name: 'Superviviente Subterraneo', description: 'Completa 5 partidas sin ser eliminado.', mode: 'tierras', icon: 'Shield', difficulty: 'medium', goal: 5, statKey: 'tierras_games_survived' },
  { id: 'ach_078', name: 'Resistencia Abisal', description: 'Completa 10 partidas sin ser eliminado.', mode: 'tierras', icon: 'Shield', difficulty: 'medium', goal: 10, statKey: 'tierras_games_survived' },
  { id: 'ach_079', name: 'Guardian de las Profundidades', description: 'Completa 25 partidas sin ser eliminado.', mode: 'tierras', icon: 'Shield', difficulty: 'hard', goal: 25, statKey: 'tierras_games_survived' },
  { id: 'ach_080', name: 'Inmortal de las Tierras Hundidas', description: 'Completa 50 partidas sin ser eliminado.', mode: 'tierras', icon: 'Shield', difficulty: 'legendary', goal: 50, statKey: 'tierras_games_survived' },

  // Precisión (5)
  { id: 'ach_081', name: 'Golpe Certero', description: 'Responde correctamente 5 preguntas seguidas.', mode: 'tierras', icon: 'Target', difficulty: 'easy', goal: 5, statKey: 'tierras_best_streak' },
  { id: 'ach_082', name: 'Mente Profunda', description: 'Responde correctamente 10 preguntas seguidas.', mode: 'tierras', icon: 'Target', difficulty: 'medium', goal: 10, statKey: 'tierras_best_streak' },
  { id: 'ach_083', name: 'Sin Perder el Rumbo', description: 'Responde correctamente 15 preguntas seguidas.', mode: 'tierras', icon: 'Target', difficulty: 'hard', goal: 15, statKey: 'tierras_best_streak' },
  { id: 'ach_084', name: 'Precision Abisal', description: 'Responde correctamente 20 preguntas seguidas.', mode: 'tierras', icon: 'Target', difficulty: 'legendary', goal: 20, statKey: 'tierras_best_streak' },
  { id: 'ach_085', name: 'Maestro Sumergido', description: 'Responde correctamente 30 preguntas seguidas.', mode: 'tierras', icon: 'Target', difficulty: 'legendary', goal: 30, statKey: 'tierras_best_streak' },

  // Puntuación (5)
  { id: 'ach_086', name: 'Primer Tesoro', description: 'Obtén 50 puntos en Tierras Hundidas.', mode: 'tierras', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'tierras_best_score' },
  { id: 'ach_087', name: 'Tesoro Encontrado', description: 'Obtén 100 puntos.', mode: 'tierras', icon: 'Star', difficulty: 'easy', goal: 100, statKey: 'tierras_best_score' },
  { id: 'ach_088', name: 'Riqueza Sumergida', description: 'Obtén 250 puntos.', mode: 'tierras', icon: 'TrendingUp', difficulty: 'medium', goal: 250, statKey: 'tierras_best_score' },
  { id: 'ach_089', name: 'Tesoro de las Profundidades', description: 'Obtén 500 puntos.', mode: 'tierras', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'tierras_best_score' },
  { id: 'ach_090', name: 'Tesoro Abisal', description: 'Obtén 1,000 puntos acumulados.', mode: 'tierras', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'tierras_total_score' },

  // Desafíos especiales (10)
  { id: 'ach_091', name: 'Sobrevivi al Descenso', description: 'Completa una partida después de cometer un error.', mode: 'tierras', icon: 'Heart', difficulty: 'easy', goal: 1, statKey: 'tierras_games_after_error' },
  { id: 'ach_092', name: 'Regreso a la Superficie', description: 'Gana una partida después de haber perdido una partida anterior.', mode: 'tierras', icon: 'Waves', difficulty: 'medium', goal: 1, statKey: 'tierras_wins_after_loss' },
  { id: 'ach_093', name: 'Exploracion Continua', description: 'Completa 3 partidas consecutivas.', mode: 'tierras', icon: 'Compass', difficulty: 'medium', goal: 3, statKey: 'tierras_best_win_streak' },
  { id: 'ach_094', name: 'Expedicion Profunda', description: 'Completa 5 partidas consecutivas.', mode: 'tierras', icon: 'Compass', difficulty: 'hard', goal: 5, statKey: 'tierras_best_win_streak' },
  { id: 'ach_095', name: 'Viaje Sin Fin', description: 'Completa 10 partidas consecutivas.', mode: 'tierras', icon: 'Compass', difficulty: 'legendary', goal: 10, statKey: 'tierras_best_win_streak' },
  { id: 'ach_096', name: 'Conquistador Sumergido', description: 'Gana 10 partidas.', mode: 'tierras', icon: 'Medal', difficulty: 'medium', goal: 10, statKey: 'tierras_games_won' },
  { id: 'ach_097', name: 'Señor de las Profundidades', description: 'Gana 25 partidas.', mode: 'tierras', icon: 'Award', difficulty: 'hard', goal: 25, statKey: 'tierras_games_won' },
  { id: 'ach_098', name: 'Leyenda Sumergida II', description: 'Gana 50 partidas.', mode: 'tierras', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'tierras_games_won' },
  { id: 'ach_099', name: 'Rey del Abismo', description: 'Gana 100 partidas.', mode: 'tierras', icon: 'Crown', difficulty: 'legendary', goal: 100, statKey: 'tierras_games_won' },
  { id: 'ach_100', name: 'Dueño de las Tierras Hundidas', description: 'Desbloquea todos los logros de Tierras Hundidas.', mode: 'tierras', icon: 'Trophy', difficulty: 'legendary', goal: 49, statKey: 'tierras_all_unlocked' },

  // ============================================
  // ENTRE ABISMOS - 50 achievements (ach_101-ach_150)
  // ============================================

  // Progresión (8)
  { id: 'ach_101', name: 'Primer Salto', description: 'Completa tu primera partida de Entre Abismos.', mode: 'abismos', icon: 'Mountain', difficulty: 'easy', goal: 1, statKey: 'abismos_games_played' },
  { id: 'ach_102', name: 'Entre las Nubes', description: 'Completa 3 partidas.', mode: 'abismos', icon: 'Mountain', difficulty: 'easy', goal: 3, statKey: 'abismos_games_played' },
  { id: 'ach_103', name: 'Explorador del Abismo', description: 'Completa 5 partidas.', mode: 'abismos', icon: 'Compass', difficulty: 'easy', goal: 5, statKey: 'abismos_games_played' },
  { id: 'ach_104', name: 'Viajero de las Alturas', description: 'Completa 10 partidas.', mode: 'abismos', icon: 'Compass', difficulty: 'medium', goal: 10, statKey: 'abismos_games_played' },
  { id: 'ach_105', name: 'Habitante de los Abismos', description: 'Completa 25 partidas.', mode: 'abismos', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'abismos_games_played' },
  { id: 'ach_106', name: 'Dominator de las Alturas', description: 'Completa 50 partidas.', mode: 'abismos', icon: 'Award', difficulty: 'hard', goal: 50, statKey: 'abismos_games_played' },
  { id: 'ach_107', name: 'Veterano del Vacio', description: 'Completa 75 partidas.', mode: 'abismos', icon: 'Crown', difficulty: 'legendary', goal: 75, statKey: 'abismos_games_played' },
  { id: 'ach_108', name: 'Leyenda del Abismo', description: 'Completa 100 partidas.', mode: 'abismos', icon: 'Trophy', difficulty: 'legendary', goal: 100, statKey: 'abismos_games_played' },

  // Respuestas correctas (7)
  { id: 'ach_109', name: 'Primer Paso', description: 'Responde correctamente 1 pregunta.', mode: 'abismos', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'abismos_correct_answers' },
  { id: 'ach_110', name: 'Buen Comienzo', description: 'Consigue 10 respuestas correctas.', mode: 'abismos', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'abismos_correct_answers' },
  { id: 'ach_111', name: 'Mente Precisa', description: 'Consigue 25 respuestas correctas.', mode: 'abismos', icon: 'Brain', difficulty: 'medium', goal: 25, statKey: 'abismos_correct_answers' },
  { id: 'ach_112', name: 'Salto de Conocimiento', description: 'Consigue 50 respuestas correctas.', mode: 'abismos', icon: 'GraduationCap', difficulty: 'medium', goal: 50, statKey: 'abismos_correct_answers' },
  { id: 'ach_113', name: 'Experto de las Alturas', description: 'Consigue 100 respuestas correctas.', mode: 'abismos', icon: 'Brain', difficulty: 'hard', goal: 100, statKey: 'abismos_correct_answers' },
  { id: 'ach_114', name: 'Maestro del Vacio', description: 'Consigue 250 respuestas correctas.', mode: 'abismos', icon: 'Brain', difficulty: 'hard', goal: 250, statKey: 'abismos_correct_answers' },
  { id: 'ach_115', name: 'Sabio de los Abismos', description: 'Consigue 500 respuestas correctas.', mode: 'abismos', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'abismos_correct_answers' },

  // Rachas (5)
  { id: 'ach_116', name: 'Sin Tropezar', description: 'Consigue una racha de 3 respuestas correctas.', mode: 'abismos', icon: 'Flame', difficulty: 'easy', goal: 3, statKey: 'abismos_best_streak' },
  { id: 'ach_117', name: 'Paso Seguro', description: 'Consigue una racha de 5 respuestas correctas.', mode: 'abismos', icon: 'Flame', difficulty: 'easy', goal: 5, statKey: 'abismos_best_streak' },
  { id: 'ach_118', name: 'Sobre el Vacio', description: 'Consigue una racha de 10 respuestas correctas.', mode: 'abismos', icon: 'Flame', difficulty: 'medium', goal: 10, statKey: 'abismos_best_streak' },
  { id: 'ach_119', name: 'Equilibrio Perfecto', description: 'Consigue una racha de 15 respuestas correctas.', mode: 'abismos', icon: 'Flame', difficulty: 'hard', goal: 15, statKey: 'abismos_best_streak' },
  { id: 'ach_120', name: 'Imparable en las Alturas', description: 'Consigue una racha de 20 respuestas correctas.', mode: 'abismos', icon: 'Flame', difficulty: 'legendary', goal: 20, statKey: 'abismos_best_streak' },

  // Partidas perfectas (5)
  { id: 'ach_121', name: 'Salto Perfecto', description: 'Completa una partida sin respuestas incorrectas.', mode: 'abismos', icon: 'Target', difficulty: 'easy', goal: 1, statKey: 'abismos_perfect_games' },
  { id: 'ach_122', name: 'Cruce Impecable', description: 'Consigue una partida perfecta 3 veces.', mode: 'abismos', icon: 'Target', difficulty: 'medium', goal: 3, statKey: 'abismos_perfect_games' },
  { id: 'ach_123', name: 'Maestria Aerea', description: 'Consigue 5 partidas perfectas.', mode: 'abismos', icon: 'Target', difficulty: 'medium', goal: 5, statKey: 'abismos_perfect_games' },
  { id: 'ach_124', name: 'Caminante del Cielo', description: 'Consigue 10 partidas perfectas.', mode: 'abismos', icon: 'Target', difficulty: 'hard', goal: 10, statKey: 'abismos_perfect_games' },
  { id: 'ach_125', name: 'Dominio Absoluto', description: 'Consigue 20 partidas perfectas.', mode: 'abismos', icon: 'Target', difficulty: 'legendary', goal: 20, statKey: 'abismos_perfect_games' },

  // Supervivencia (5)
  { id: 'ach_126', name: 'No Cai', description: 'Completa una partida sin caer al vacio.', mode: 'abismos', icon: 'Shield', difficulty: 'easy', goal: 1, statKey: 'abismos_games_survived' },
  { id: 'ach_127', name: 'Pies Firmes', description: 'Completa 5 partidas sin caer.', mode: 'abismos', icon: 'Shield', difficulty: 'medium', goal: 5, statKey: 'abismos_games_survived' },
  { id: 'ach_128', name: 'Equilibrista', description: 'Completa 10 partidas sin caer.', mode: 'abismos', icon: 'Shield', difficulty: 'medium', goal: 10, statKey: 'abismos_games_survived' },
  { id: 'ach_129', name: 'Guardian del Abismo', description: 'Completa 25 partidas sin caer.', mode: 'abismos', icon: 'Shield', difficulty: 'hard', goal: 25, statKey: 'abismos_games_survived' },
  { id: 'ach_130', name: 'Dueño del Vacio', description: 'Completa 50 partidas sin caer.', mode: 'abismos', icon: 'Shield', difficulty: 'legendary', goal: 50, statKey: 'abismos_games_survived' },

  // Precisión (5)
  { id: 'ach_131', name: 'Respuesta Certera', description: 'Responde correctamente 5 preguntas seguidas.', mode: 'abismos', icon: 'Target', difficulty: 'easy', goal: 5, statKey: 'abismos_best_streak' },
  { id: 'ach_132', name: 'Pulso Firme', description: 'Responde correctamente 10 preguntas seguidas.', mode: 'abismos', icon: 'Target', difficulty: 'medium', goal: 10, statKey: 'abismos_best_streak' },
  { id: 'ach_133', name: 'Mente Inamovible', description: 'Responde correctamente 15 preguntas seguidas.', mode: 'abismos', icon: 'Target', difficulty: 'hard', goal: 15, statKey: 'abismos_best_streak' },
  { id: 'ach_134', name: 'Precision Celestial', description: 'Responde correctamente 20 preguntas seguidas.', mode: 'abismos', icon: 'Target', difficulty: 'legendary', goal: 20, statKey: 'abismos_best_streak' },
  { id: 'ach_135', name: 'Maestro del Equilibrio', description: 'Responde correctamente 30 preguntas seguidas.', mode: 'abismos', icon: 'Target', difficulty: 'legendary', goal: 30, statKey: 'abismos_best_streak' },

  // Puntuación (5)
  { id: 'ach_136', name: 'Primer Impulso', description: 'Obtén 50 puntos en Entre Abismos.', mode: 'abismos', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'abismos_best_score' },
  { id: 'ach_137', name: 'Altura Ganada', description: 'Obtén 100 puntos.', mode: 'abismos', icon: 'Star', difficulty: 'easy', goal: 100, statKey: 'abismos_best_score' },
  { id: 'ach_138', name: 'Sobre las Nubes', description: 'Obtén 250 puntos.', mode: 'abismos', icon: 'TrendingUp', difficulty: 'medium', goal: 250, statKey: 'abismos_best_score' },
  { id: 'ach_139', name: 'Mas Alla del Cielo', description: 'Obtén 500 puntos.', mode: 'abismos', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'abismos_best_score' },
  { id: 'ach_140', name: 'Conquistador del Abismo', description: 'Obtén 1,000 puntos acumulados.', mode: 'abismos', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'abismos_total_score' },

  // Desafíos especiales (10)
  { id: 'ach_141', name: 'Ultimo Salto', description: 'Completa una partida después de cometer un error.', mode: 'abismos', icon: 'Heart', difficulty: 'easy', goal: 1, statKey: 'abismos_games_after_error' },
  { id: 'ach_142', name: 'Volver a Intentarlo', description: 'Gana una partida después de haber perdido una partida anterior.', mode: 'abismos', icon: 'Mountain', difficulty: 'medium', goal: 1, statKey: 'abismos_wins_after_loss' },
  { id: 'ach_143', name: 'Sin Miedo a las Alturas', description: 'Completa 3 partidas consecutivas.', mode: 'abismos', icon: 'Compass', difficulty: 'medium', goal: 3, statKey: 'abismos_best_win_streak' },
  { id: 'ach_144', name: 'Ruta Celestial', description: 'Completa 5 partidas consecutivas.', mode: 'abismos', icon: 'Compass', difficulty: 'hard', goal: 5, statKey: 'abismos_best_win_streak' },
  { id: 'ach_145', name: 'Horizonte Infinito', description: 'Completa 10 partidas consecutivas.', mode: 'abismos', icon: 'Compass', difficulty: 'legendary', goal: 10, statKey: 'abismos_best_win_streak' },
  { id: 'ach_146', name: 'Maestro de los Abismos', description: 'Gana 10 partidas.', mode: 'abismos', icon: 'Medal', difficulty: 'medium', goal: 10, statKey: 'abismos_games_won' },
  { id: 'ach_147', name: 'Señor de las Alturas', description: 'Gana 25 partidas.', mode: 'abismos', icon: 'Award', difficulty: 'hard', goal: 25, statKey: 'abismos_games_won' },
  { id: 'ach_148', name: 'Leyenda Celestial', description: 'Gana 50 partidas.', mode: 'abismos', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'abismos_games_won' },
  { id: 'ach_149', name: 'Mas Alla del Abismo', description: 'Gana 100 partidas.', mode: 'abismos', icon: 'Crown', difficulty: 'legendary', goal: 100, statKey: 'abismos_games_won' },
  { id: 'ach_150', name: 'Rey de las Alturas', description: 'Desbloquea todos los logros de Entre Abismos.', mode: 'abismos', icon: 'Trophy', difficulty: 'legendary', goal: 49, statKey: 'abismos_all_unlocked' },
];
