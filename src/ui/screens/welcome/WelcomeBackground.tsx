'use client';

import styles from './WelcomeBackground.module.css';

export function WelcomeBackground() {
  return (
    <picture className={styles.background}>
      <source srcSet="/images/welcome/welcome-bg.webp" type="image/webp" />
      <img
        src="/images/welcome/welcome-bg.jpg"
        alt="Paisaje de bienvenida con cielo azul, colinas verdes, árboles y casitas"
        loading="eager"
        decoding="async"
      />
    </picture>
  );
}
