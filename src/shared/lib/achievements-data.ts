import type { AchievementDefinition } from '@/shared/types/achievement';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============================================
  // CAMINO DE LAS DECISIONES - 25 achievements
  // ============================================

  // Easy (6)
  { id: 'ach_001', name: 'Primer Paso', description: 'Completa tu primera partida de Camino de las Decisiones.', mode: 'decisiones', icon: 'Route', difficulty: 'easy', goal: 1, statKey: 'decisiones_games_completed' },
  { id: 'ach_002', name: 'Respuesta Correcta', description: 'Responde correctamente 1 pregunta.', mode: 'decisiones', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'decisiones_correct_answers' },
  { id: 'ach_003', name: 'Aprendiz', description: 'Responde correctamente 10 preguntas.', mode: 'decisiones', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'decisiones_correct_answers' },
  { id: 'ach_004', name: 'Racha de 3', description: 'Consigue una racha de 3 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'easy', goal: 3, statKey: 'decisiones_best_streak' },
  { id: 'ach_005', name: 'Puntuacion Minima', description: 'Alcanza 50 puntos en una partida.', mode: 'decisiones', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'decisiones_best_score' },
  { id: 'ach_006', name: 'Experiencia', description: 'Acumula 50 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'easy', goal: 50, statKey: 'decisiones_total_xp' },

  // Medium (9)
  { id: 'ach_007', name: 'Explorador', description: 'Completa 5 partidas de Camino de las Decisiones.', mode: 'decisiones', icon: 'Compass', difficulty: 'medium', goal: 5, statKey: 'decisiones_games_completed' },
  { id: 'ach_008', name: 'Estudiante', description: 'Responde correctamente 50 preguntas.', mode: 'decisiones', icon: 'GraduationCap', difficulty: 'medium', goal: 50, statKey: 'decisiones_correct_answers' },
  { id: 'ach_009', name: 'Racha de 5', description: 'Consigue una racha de 5 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'medium', goal: 5, statKey: 'decisiones_best_streak' },
  { id: 'ach_010', name: 'Buen Puntaje', description: 'Alcanza 200 puntos en una partida.', mode: 'decisiones', icon: 'TrendingUp', difficulty: 'medium', goal: 200, statKey: 'decisiones_best_score' },
  { id: 'ach_011', name: 'Precision', description: 'Logra 80% o mas de precision en una partida.', mode: 'decisiones', icon: 'Target', difficulty: 'medium', goal: 80, statKey: 'decisiones_best_accuracy' },
  { id: 'ach_012', name: 'Experimentado', description: 'Completa 10 partidas de Camino de las Decisiones.', mode: 'decisiones', icon: 'Award', difficulty: 'medium', goal: 10, statKey: 'decisiones_games_completed' },
  { id: 'ach_013', name: 'Conocedor', description: 'Responde correctamente 100 preguntas.', mode: 'decisiones', icon: 'BookOpen', difficulty: 'medium', goal: 100, statKey: 'decisiones_correct_answers' },
  { id: 'ach_014', name: 'Racha de 8', description: 'Consigue una racha de 8 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'medium', goal: 8, statKey: 'decisiones_best_streak' },
  { id: 'ach_015', name: 'Experiencia Avanzada', description: 'Acumula 500 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'medium', goal: 500, statKey: 'decisiones_total_xp' },

  // Hard (6)
  { id: 'ach_016', name: 'Veterano', description: 'Completa 25 partidas de Camino de las Decisiones.', mode: 'decisiones', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'decisiones_games_completed' },
  { id: 'ach_017', name: 'Sabio', description: 'Responde correctamente 200 preguntas.', mode: 'decisiones', icon: 'Brain', difficulty: 'hard', goal: 200, statKey: 'decisiones_correct_answers' },
  { id: 'ach_018', name: 'Racha de 10', description: 'Consigue una racha de 10 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'hard', goal: 10, statKey: 'decisiones_best_streak' },
  { id: 'ach_019', name: 'Precision Perfecta', description: 'Logra 100% de precision en una partida.', mode: 'decisiones', icon: 'Target', difficulty: 'hard', goal: 100, statKey: 'decisiones_best_accuracy' },
  { id: 'ach_020', name: 'Puntuacion Alta', description: 'Alcanza 500 puntos en una partida.', mode: 'decisiones', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'decisiones_best_score' },
  { id: 'ach_021', name: 'Experiencia Maestra', description: 'Acumula 1500 XP en total.', mode: 'decisiones', icon: 'Zap', difficulty: 'hard', goal: 1500, statKey: 'decisiones_total_xp' },

  // Legendary (4)
  { id: 'ach_022', name: 'Maestro', description: 'Responde correctamente 500 preguntas.', mode: 'decisiones', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'decisiones_correct_answers' },
  { id: 'ach_023', name: 'Leyenda', description: 'Completa 50 partidas de Camino de las Decisiones.', mode: 'decisiones', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'decisiones_games_completed' },
  { id: 'ach_024', name: 'Racha de 15', description: 'Consigue una racha de 15 respuestas correctas seguidas.', mode: 'decisiones', icon: 'Flame', difficulty: 'legendary', goal: 15, statKey: 'decisiones_best_streak' },
  { id: 'ach_025', name: 'Ingenio Infinito', description: 'Alcanza 1000 puntos en una partida.', mode: 'decisiones', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'decisiones_best_score' },

  // ============================================
  // LA LAVA DEL CONOCIMIENTO - 25 achievements
  // ============================================

  // Easy (6)
  { id: 'ach_026', name: 'Primer Fuego', description: 'Completa tu primera partida de La Lava del Conocimiento.', mode: 'lava', icon: 'Flame', difficulty: 'easy', goal: 1, statKey: 'lava_games_completed' },
  { id: 'ach_027', name: 'Respuesta en Llamas', description: 'Responde correctamente 1 pregunta en La Lava.', mode: 'lava', icon: 'CheckCircle', difficulty: 'easy', goal: 1, statKey: 'lava_correct_answers' },
  { id: 'ach_028', name: 'Aprendiz del Fuego', description: 'Responde correctamente 10 preguntas en La Lava.', mode: 'lava', icon: 'BookOpen', difficulty: 'easy', goal: 10, statKey: 'lava_correct_answers' },
  { id: 'ach_029', name: 'Superviviente', description: 'Sobrevive sin ser eliminado en tu primera partida.', mode: 'lava', icon: 'Shield', difficulty: 'easy', goal: 1, statKey: 'lava_games_survived' },
  { id: 'ach_030', name: 'Puntuacion de Fuego', description: 'Alcanza 50 puntos en una partida de La Lava.', mode: 'lava', icon: 'Star', difficulty: 'easy', goal: 50, statKey: 'lava_best_score' },
  { id: 'ach_031', name: 'Resistencia', description: 'Alcanza 3 ticks (maximo) en una partida.', mode: 'lava', icon: 'Heart', difficulty: 'easy', goal: 3, statKey: 'lava_max_ticks_reached' },

  // Medium (9)
  { id: 'ach_032', name: 'Corredor de Lava', description: 'Completa 5 partidas de La Lava del Conocimiento.', mode: 'lava', icon: 'Flame', difficulty: 'medium', goal: 5, statKey: 'lava_games_completed' },
  { id: 'ach_033', name: 'Conocedor del Fuego', description: 'Responde correctamente 50 preguntas en La Lava.', mode: 'lava', icon: 'BookOpen', difficulty: 'medium', goal: 50, statKey: 'lava_correct_answers' },
  { id: 'ach_034', name: 'Superviviente Veterano', description: 'Sobrevive sin ser eliminado en 5 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'medium', goal: 5, statKey: 'lava_games_survived' },
  { id: 'ach_035', name: 'Puntuacion Caliente', description: 'Alcanza 200 puntos en una partida de La Lava.', mode: 'lava', icon: 'TrendingUp', difficulty: 'medium', goal: 200, statKey: 'lava_best_score' },
  { id: 'ach_036', name: 'Precision en Fuego', description: 'Logra 80% o mas de precision en una partida de La Lava.', mode: 'lava', icon: 'Target', difficulty: 'medium', goal: 80, statKey: 'lava_best_accuracy' },
  { id: 'ach_037', name: 'Experimentado del Fuego', description: 'Completa 10 partidas de La Lava del Conocimiento.', mode: 'lava', icon: 'Award', difficulty: 'medium', goal: 10, statKey: 'lava_games_completed' },
  { id: 'ach_038', name: 'Maestro del Fuego', description: 'Responde correctamente 100 preguntas en La Lava.', mode: 'lava', icon: 'Brain', difficulty: 'medium', goal: 100, statKey: 'lava_correct_answers' },
  { id: 'ach_039', name: 'Escapista', description: 'Sobrevive sin ser eliminado en 10 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'medium', goal: 10, statKey: 'lava_games_survived' },
  { id: 'ach_040', name: 'Experiencia de Fuego', description: 'Acumula 500 puntos de experiencia total en La Lava.', mode: 'lava', icon: 'Zap', difficulty: 'medium', goal: 500, statKey: 'lava_total_score' },

  // Hard (6)
  { id: 'ach_041', name: 'Veterano del Fuego', description: 'Completa 25 partidas de La Lava del Conocimiento.', mode: 'lava', icon: 'Medal', difficulty: 'hard', goal: 25, statKey: 'lava_games_completed' },
  { id: 'ach_042', name: 'Sabio del Fuego', description: 'Responde correctamente 200 preguntas en La Lava.', mode: 'lava', icon: 'Brain', difficulty: 'hard', goal: 200, statKey: 'lava_correct_answers' },
  { id: 'ach_043', name: 'Superviviente Elite', description: 'Sobrevive sin ser eliminado en 25 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'hard', goal: 25, statKey: 'lava_games_survived' },
  { id: 'ach_044', name: 'Precision en Llamas', description: 'Logra 100% de precision en una partida de La Lava.', mode: 'lava', icon: 'Target', difficulty: 'hard', goal: 100, statKey: 'lava_best_accuracy' },
  { id: 'ach_045', name: 'Puntuacion Infernal', description: 'Alcanza 500 puntos en una partida de La Lava.', mode: 'lava', icon: 'TrendingUp', difficulty: 'hard', goal: 500, statKey: 'lava_best_score' },
  { id: 'ach_046', name: 'Experiencia de Lava', description: 'Acumula 1500 puntos de experiencia total en La Lava.', mode: 'lava', icon: 'Zap', difficulty: 'hard', goal: 1500, statKey: 'lava_total_score' },

  // Legendary (4)
  { id: 'ach_047', name: 'Maestro del Fuego', description: 'Responde correctamente 500 preguntas en La Lava.', mode: 'lava', icon: 'Crown', difficulty: 'legendary', goal: 500, statKey: 'lava_correct_answers' },
  { id: 'ach_048', name: 'Leyenda de la Lava', description: 'Completa 50 partidas de La Lava del Conocimiento.', mode: 'lava', icon: 'Trophy', difficulty: 'legendary', goal: 50, statKey: 'lava_games_completed' },
  { id: 'ach_049', name: 'Superviviente Legendario', description: 'Sobrevive sin ser eliminado en 50 partidas.', mode: 'lava', icon: 'Shield', difficulty: 'legendary', goal: 50, statKey: 'lava_games_survived' },
  { id: 'ach_050', name: 'Inmune al Fuego', description: 'Alcanza 1000 puntos en una partida de La Lava.', mode: 'lava', icon: 'Sparkles', difficulty: 'legendary', goal: 1000, statKey: 'lava_best_score' },
];
