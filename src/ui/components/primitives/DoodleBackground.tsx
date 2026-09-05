'use client';

import styles from './DoodleBackground.module.css';

const DOODLES = [
  { id: 'star1', top: '6%', left: '7%', size: 56, opacity: 0.75, color: '#EB5D70', delayClass: styles.doodle1, type: 'star' as const },
  { id: 'spiral1', top: '14%', right: '10%', size: 72, opacity: 0.65, color: '#00A0B5', delayClass: styles.doodle2, type: 'spiral' as const },
  { id: 'circle1', top: '60%', left: '4%', size: 48, opacity: 0.75, color: '#FFB400', delayClass: styles.doodle3, type: 'circle' as const },
  { id: 'zap1', bottom: '18%', right: '6%', size: 64, opacity: 0.70, color: '#FFA000', delayClass: styles.doodle4, type: 'zap' as const },
  { id: 'star2', bottom: '10%', left: '16%', size: 44, opacity: 0.68, color: '#98C54E', delayClass: styles.doodle5, type: 'star' as const },
  { id: 'wave1', top: '42%', right: '4%', size: 80, opacity: 0.60, color: '#EB5D70', delayClass: styles.doodle6, type: 'wave' as const },
  { id: 'hex1', top: '78%', right: '18%', size: 52, opacity: 0.65, color: '#00A0B5', delayClass: styles.doodle7, type: 'hex' as const },
  { id: 'sparkle1', top: '30%', left: '12%', size: 38, opacity: 0.80, color: '#FFA000', delayClass: styles.doodle8, type: 'sparkle' as const },
  { id: 'heart1', bottom: '32%', left: '8%', size: 42, opacity: 0.70, color: '#EB5D70', delayClass: styles.doodle9, type: 'heart' as const },
  { id: 'loop1', top: '8%', right: '30%', size: 50, opacity: 0.65, color: '#98C54E', delayClass: styles.doodle10, type: 'loop' as const },
];

function DoodleSvg({ type, size, color }: { type: string; size: number; color: string }) {
  const s = size;
  const stroke = color;
  const fill = 'none';

  switch (type) {
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 4l4.5 13.5L42 19l-11 9.5L34.5 42 24 34 13.5 42l3.5-13.5L6 19l13.5-1.5L24 4z" />
        </svg>
      );
    case 'spiral':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <path d="M24 24c0-8-6-10-10-6s-2 14 8 14c10 0 14-10 10-16s-14-6-18 2-2 18 10 20c12 2 18-10 14-18" />
        </svg>
      );
    case 'circle':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <circle cx="24" cy="24" r="16" />
          <circle cx="24" cy="24" r="8" />
        </svg>
      );
    case 'zap':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={stroke} stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M26 4L10 26h12l-4 18 18-22H24l6-18z" />
        </svg>
      );
    case 'wave':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <path d="M4 24c6-10 10-10 16 0s10 10 16 0" />
          <path d="M4 34c6-10 10-10 16 0s10 10 16 0" />
        </svg>
      );
    case 'hex':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round">
          <path d="M24 6l14.7 8.5v17L24 40 9.3 31.5v-17L24 6z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={stroke} stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M24 4v12M24 32v12M4 24h12M32 24h12M10.3 10.3l8.5 8.5M29.2 29.2l8.5 8.5M10.3 37.7l8.5-8.5M29.2 18.8l8.5-8.5" />
        </svg>
      );
    case 'heart':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinejoin="round">
          <path d="M24 42l-2.1-1.9C10.8 30.6 4 24.3 4 16.5 4 10.1 9.1 5 15.5 5c3.7 0 7.3 1.7 9.5 4.5C27.2 6.7 30.8 5 34.5 5 40.9 5 46 10.1 46 16.5c0 7.8-6.8 14.1-17.9 23.6L24 42z" />
        </svg>
      );
    case 'loop':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="3" strokeLinecap="round">
          <path d="M12 36c0-12 8-20 20-12" />
          <path d="M36 12c0 12-8 20-20 12" />
          <circle cx="36" cy="12" r="4" fill={stroke} />
          <circle cx="12" cy="36" r="4" fill={stroke} />
        </svg>
      );
    default:
      return null;
  }
}

export function DoodleBackground() {
  return (
    <div className={styles.doodleContainer} aria-hidden="true">
      <div className={styles.doodleLayer} />
      {DOODLES.map((d) => (
        <div
          key={d.id}
          className={`${styles.doodle} ${d.delayClass}`}
          style={{
            top: d.top,
            left: d.left,
            right: d.right,
            bottom: d.bottom,
            opacity: d.opacity,
          }}
        >
          <DoodleSvg type={d.type} size={d.size} color={d.color} />
        </div>
      ))}
    </div>
  );
}
