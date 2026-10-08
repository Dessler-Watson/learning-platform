'use client';
import { useEffect, useState } from 'react';

/**
 * ETAPA 2 — Grupo 1: efectos de PRESENTACIÓN de Caos (solo cliente).
 *
 * Ambos componentes se montan UNA sola vez dentro de la raíz de cada juego
 * (GameCanvas / LavaCanvas / TierrasCanvas / AbismosCanvas) y reciben
 * `active` = el modificador está en matches.modifiers Y la partida no ha
 * terminado. Salas docentes y práctica: `active=false` → cero efectos,
 * cero timers, cero clases en el documento.
 */

/**
 * 'pantalla_al_reves': rota 180° TODA la interfaz del jugador.
 *
 * Añade una clase al <html> mientras dure la partida (la regla CSS vive en
 * globals.css y aplica transform al <body>). Al rotar el body, todo lo que
 * cuelga de él rota junto: canvas, HUD, ventanas de pregunta/respuesta,
 * feedback, overlays, controles táctiles, LandscapeGate, el menú de juego y
 * sus modales (todos position:fixed dentro del body). No rota la interfaz
 * docente (este componente solo existe dentro de las pantallas de juego) ni
 * afecta a otros jugadores (cada pestaña aplica su propio transform).
 * Al desmontar (fin de partida o salida) la clase se retira y la interfaz
 * vuelve a su orientación normal.
 */
export function ChaosScreenFlip({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.classList.add('chaos-screen-flip');
    return () => {
      root.classList.remove('chaos-screen-flip');
    };
  }, [active]);
  return null;
}

/** Periodo del destello de 'ceguera' (15 s) y duración visible (2 s). */
const BLIND_FLASH_INTERVAL_MS = 15000;
const BLIND_FLASH_DURATION_MS = 2000;

/**
 * 'ceguera': oscurece el entorno dejando visibles las ventanas de
 * pregunta/respuesta/feedback y el HUD (que viven en capas superiores a la
 * oscuridad). Cada 15 s abre un destello de 2 s en el que se ve el entorno
 * y vuelve la oscuridad; el ciclo se repite mientras dure la partida.
 *
 * UN solo intervalo por montaje (creado en el effect con `active` y limpiado
 * en su cleanup: al desmontar el juego no queda ningún timer vivo). El
 * overlay es pointerEvents:none: no bloquea los controles ni las ventanas.
 */
export function ChaosBlindness({ active, zIndex = 20 }: { active: boolean; zIndex?: number }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!active) return;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    const cycle = setInterval(() => {
      setFlash(true);
      flashTimer = setTimeout(() => setFlash(false), BLIND_FLASH_DURATION_MS);
    }, BLIND_FLASH_INTERVAL_MS);
    return () => {
      clearInterval(cycle);
      if (flashTimer !== undefined) clearTimeout(flashTimer);
      setFlash(false);
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      data-chaos-blind=""
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        background: '#000000',
        opacity: flash ? 0 : 1,
        transition: 'opacity 300ms linear',
      }}
    />
  );
}
