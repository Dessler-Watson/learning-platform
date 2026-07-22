export const motion = {
  duration: {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    xslow: 0.6,
  },
  ease: {
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],
    inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
    spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
    bounce: { type: 'spring' as const, stiffness: 400, damping: 15 },
  },
  // Presets para Framer Motion
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  },
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  },
  slideLeft: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
  },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
} as const;
