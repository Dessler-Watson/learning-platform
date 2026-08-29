'use client';

import styles from './BubbleBackground.module.css';

const BUBBLES = [
  {
    className: styles.bubble1,
    color: '#F087A9',
    size: 180,
    top: '5%',
    left: '5%',
    opacity: 0.55,
  },
  {
    className: styles.bubble2,
    color: '#30BCE6',
    size: 220,
    top: '10%',
    right: '5%',
    opacity: 0.5,
  },
  {
    className: styles.bubble3,
    color: '#FDF293',
    size: 140,
    top: '45%',
    left: '3%',
    opacity: 0.6,
  },
  {
    className: styles.bubble4,
    color: '#E94930',
    size: 200,
    bottom: '15%',
    right: '5%',
    opacity: 0.52,
  },
  {
    className: styles.bubble5,
    color: '#FDDB33',
    size: 160,
    bottom: '10%',
    left: '10%',
    opacity: 0.58,
  },
  {
    className: styles.bubble6,
    color: '#30BCE6',
    size: 120,
    top: '30%',
    right: '12%',
    opacity: 0.65,
  },
  {
    className: styles.bubble7,
    color: '#F087A9',
    size: 150,
    top: '65%',
    left: '45%',
    opacity: 0.55,
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
