'use client';

import styles from './BubbleBackground.module.css';

const BUBBLES = [
  {
    className: styles.bubble1,
    color: '#F087A9',
    size: 200,
    top: '5%',
    left: '5%',
    opacity: 0.35,
  },
  {
    className: styles.bubble2,
    color: '#30BCE6',
    size: 260,
    top: '12%',
    right: '8%',
    opacity: 0.3,
  },
  {
    className: styles.bubble3,
    color: '#FDF293',
    size: 160,
    top: '55%',
    left: '3%',
    opacity: 0.38,
  },
  {
    className: styles.bubble4,
    color: '#E94930',
    size: 220,
    bottom: '18%',
    right: '5%',
    opacity: 0.32,
  },
  {
    className: styles.bubble5,
    color: '#FDDB33',
    size: 180,
    bottom: '12%',
    left: '15%',
    opacity: 0.36,
  },
];

export function BubbleBackground() {
  return (
    <div className={styles.bubbleContainer}>
      <div className={styles.bubbleLayer} />
      {BUBBLES.map((bubble, i) => (
        <div
          key={i}
          className={`${styles.bubble} ${bubble.className}`}
          style={{
            width: bubble.size,
            height: bubble.size,
            background: `radial-gradient(circle, ${bubble.color}90, ${bubble.color}40 70%)`,
            opacity: bubble.opacity,
            top: bubble.top,
            left: bubble.left,
            right: bubble.right,
            bottom: bubble.bottom,
            zIndex: 0,
          }}
        />
      ))}
    </div>
  );
}
