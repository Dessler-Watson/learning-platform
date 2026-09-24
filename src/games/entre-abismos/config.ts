export const ABISMOS_CONFIG = {
  questionsPerGame: 15,
  correctPoints: 20,
  maxPlatforms: 5,

  platformWidth: 5.2,
  platformDepth: 5.2,
  platformHeight: 0.6,
  platformSpacing: 5,
  platformGap: 4.0,

  startPlatformWidth: 6.5,
  startPlatformDepth: 6.5,
  finishPlatformWidth: 6.5,
  finishPlatformDepth: 6.5,

  mountainWidth: 14,
  mountainHeight: 12,
  mountainDepth: 10,

  cloudLevel: -10,
  cloudDensity: 200,
  fallThreshold: -3,

  feedbackDuration: 1.5,
  cameraDistance: 6,
  cameraHeight: 5,

  bridgeY: 2,
} as const;
