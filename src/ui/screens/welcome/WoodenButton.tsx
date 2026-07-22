'use client';

import { motion } from 'framer-motion';
import { Fredoka } from 'next/font/google';
import styles from './WoodenButton.module.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

interface WoodenButtonProps {
  title: string;
  subtitle?: string;
  onClick: () => void;
}

export function WoodenButton({ title, subtitle, onClick }: WoodenButtonProps) {
  return (
    <motion.button
      className={styles.button}
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -4, filter: 'brightness(1.12)' }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      <img
        src="/images/welcome/wooden-button.png"
        alt=""
        className={styles.bg}
        draggable={false}
      />
      <div className={`${styles.content} ${fredoka.className}`}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </motion.button>
  );
}
