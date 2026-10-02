export const TIERRAS_CONFIG = {
  questionsPerGame: 15,
  correctPoints: 20,
  platformSpacing: 6.1,
  platformWidth: 3.5,
  platformDepth: 3.5,
  platformHeight: 0.6,
  startPlatformWidth: 7,
  startPlatformDepth: 7,
  finishPlatformWidth: 8,
  finishPlatformDepth: 8,
  waterLevel: -0.3,
  fallThreshold: -0.5,
  feedbackDuration: 0.8,
  platformSinkingDuration: 2.0,
  cameraDistance: 6,
  cameraHeight: 4,
  gapBetweenPlatforms: 4,
  // Hueco de agua entre la última plataforma de respuesta y la meta:
  // antes era 6.45 (salto casi imposible), ahora es un salto corto pero real.
  finishGap: 4.5,
};

// Z de la plataforma de meta contando desde la última plataforma de respuesta.
export function tierrasFinishZ(questionCount: number): number {
  const lastQuestionZ = -questionCount * TIERRAS_CONFIG.platformSpacing;
  return (
    lastQuestionZ -
    (TIERRAS_CONFIG.platformDepth / 2 + TIERRAS_CONFIG.finishPlatformDepth / 2 + TIERRAS_CONFIG.finishGap)
  );
}
