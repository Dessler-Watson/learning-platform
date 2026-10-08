'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, X, HelpCircle, Gamepad2, Maximize, Minimize } from 'lucide-react';
import { HowToPlayModal } from './HowToPlayModal';
import { ChaosGlobalTimer } from '@/shared/ui/ChaosGlobalTimer';
import { ChaosSurvivalHud } from '@/shared/ui/ChaosSurvivalHud';
import { ModeLogo, MODE_THEME } from '@/shared/lib/game-modes';
import { audioManager } from '@/shared/lib/audio';
import { useFullscreen } from '@/shared/hooks/useFullscreen';
import {
  useTouchControlsPref,
  cycleTouchControlsPref,
} from '@/shared/hooks/useTouchControls';

type PlayMode = 'lava' | 'decisiones' | 'tierras' | 'abismos';

function detectMode(): PlayMode {
  if (typeof window === 'undefined') return 'lava';
  const path = window.location.pathname;
  if (path.includes('lava-conocimiento')) return 'lava';
  if (path.includes('camino-decisiones')) return 'decisiones';
  if (path.includes('tierras-hundidas')) return 'tierras';
  if (path.includes('entre-abismos')) return 'abismos';
  if (path.includes('practica')) {
    try {
      const raw = sessionStorage.getItem('eduplay_practice');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.mode === 'lava' || parsed.mode === 'decisiones' || parsed.mode === 'tierras' || parsed.mode === 'abismos') {
          return parsed.mode;
        }
      }
    } catch {}
    return 'decisiones';
  }
  return 'lava';
}

const TOUCH_PREF_LABEL: Record<string, string> = {
  auto: 'Auto',
  on: 'Activados',
  off: 'Desactivados',
};

export function GameMenuButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [howToPlay, setHowToPlay] = useState(false);
  const [mode, setMode] = useState<PlayMode>('lava');
  const touchPref = useTouchControlsPref();
  const {
    active: fsActive,
    enter: fsEnter,
    exit: fsExit,
    supported: fsSupported,
  } = useFullscreen();

  // Tirador ("crowbar") para desplazar el menu cuando no cabe en pantallas
  // horizontales cortas: barra arrastrable con el dedo/raton.
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; scroll: number } | null>(null);
  const [handle, setHandle] = useState({ visible: false, top: 0, height: 48 });

  useEffect(() => {
    if (!open) {
      dragRef.current = null;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 4) {
        setHandle({ visible: false, top: 0, height: 48 });
        return;
      }
      const trackH = el.clientHeight;
      const height = Math.max(32, Math.round((el.clientHeight / el.scrollHeight) * trackH));
      const top = Math.round((el.scrollTop / maxScroll) * (trackH - height));
      setHandle({ visible: true, top, height });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const onHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    // setPointerCapture puede fallar (p.ej. tras emulacion de toque); el
    // arrastre sigue funcionando mientras el cursor se mantenga sobre la barra.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    dragRef.current = { y: e.clientY, scroll: el.scrollTop };
  };
  const onHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollRef.current;
    if (!d || !el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const maxTop = Math.max(1, el.clientHeight - handle.height);
    const next = d.scroll + ((e.clientY - d.y) / maxTop) * maxScroll;
    el.scrollTop = Math.min(maxScroll, Math.max(0, next));
  };
  const onHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleOpenMenu = () => {
    setMode(detectMode());
    setOpen(true);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.25)' }}
        whileTap={{ scale: 0.94 }}
        onClick={() => { audioManager.play('modalOpen'); handleOpenMenu(); }}
        className="fixed right-3.5 top-3.5 z-[100] flex h-11 w-11 items-center justify-center rounded-xl border-none bg-white/10 text-white backdrop-blur-md"
        style={{ fontSize: 20 }}
      >
        <Menu size={22} />
      </motion.button>

      {/* 'tiempo_compartido' (Grupo 2): presupuesto global junto al menú;
          invisible (null) cuando la partida no tiene el modificador. */}
      <div className="fixed right-16 top-4 z-[100]">
        <ChaosGlobalTimer />
      </div>

      {/* Grupo 3 (supervivencia): vidas/racha/errores/banner de crítica.
          Invisible cuando la partida no tiene estos modificadores. */}
      <ChaosSurvivalHud />

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { audioManager.play('modalClose'); setOpen(false); setConfirm(false); }}
              className="fixed inset-0 z-[99] bg-black/40"
            />
            <motion.div
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed bottom-0 right-0 top-0 z-[100] flex w-64 flex-col overflow-hidden border-l border-white/5 bg-surface-900/95 p-5 pt-16 backdrop-blur-xl"
            >
              <div
                ref={scrollRef}
                className="flex h-full flex-col gap-3 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' }}
              >
                <div className="mb-2 flex shrink-0 flex-col items-center gap-2 border-b border-white/10 pb-3">
                  <ModeLogo mode={mode} size={72} shape="square" imgScale={1} />
                  <span className="text-sm font-black text-white">
                    {MODE_THEME[mode].label}
                  </span>
                </div>

                <button
                  onClick={() => { audioManager.play('modalOpen'); setOpen(false); setHowToPlay(true); }}
                  className="flex w-full shrink-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <HelpCircle size={18} /> Como se juega
                </button>

                <button
                  onClick={() => { audioManager.play('toggle'); cycleTouchControlsPref(); }}
                  aria-label="Controles tactiles"
                  className="flex w-full shrink-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <Gamepad2 size={18} />
                  <span>Controles táctiles</span>
                  <span className="ml-auto text-xs font-black uppercase tracking-wide text-edu-pink">
                    {TOUCH_PREF_LABEL[touchPref]}
                  </span>
                </button>

                {fsSupported && (
                  <button
                    onClick={() => {
                      audioManager.play('toggle');
                      const wasActive = fsActive;
                      setOpen(false);
                      if (wasActive) void fsExit();
                      else void fsEnter();
                    }}
                    aria-label="Pantalla completa"
                    className="flex w-full shrink-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-white/10"
                  >
                    {fsActive ? <Minimize size={18} /> : <Maximize size={18} />}
                    <span>{fsActive ? 'Salir de pantalla completa' : 'Pantalla completa'}</span>
                  </button>
                )}

                <button
                  onClick={() => { audioManager.play('modalOpen'); setConfirm(true); }}
                  className="flex w-full shrink-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <Home size={18} /> Volver al menu
                </button>
              </div>

              {handle.visible && (
                <div className="pointer-events-none absolute bottom-5 right-1.5 top-16 w-2 rounded-full bg-white/10">
                  <div
                    className="pointer-events-auto absolute right-0 w-2 cursor-grab rounded-full active:cursor-grabbing"
                    style={{
                      top: handle.top,
                      height: handle.height,
                      touchAction: 'none',
                      background: 'linear-gradient(90deg, #8b959d 0%, #e2e8ee 45%, #9aa4ad 100%)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                    onPointerDown={onHandleDown}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                    onPointerCancel={onHandleUp}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[88%] max-w-sm rounded-[22px] border border-white/5 bg-surface-900/95 p-6 text-center"
            >
              <p className="mb-5 text-base font-bold text-white">Deseas salir de la partida?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { audioManager.play('modalClose'); setConfirm(false); }}
                  className="flex-1 rounded-xl border border-white/10 bg-transparent py-3 text-sm font-semibold text-surface-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    audioManager.play('confirm');
                    const isPractice = !!sessionStorage.getItem('eduplay_practice');
                    window.location.href = isPractice ? '/practica/resultados' : '/inicio';
                  }}
                  className="flex-1 rounded-xl bg-edu-pink py-3 text-sm font-bold text-white"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <HowToPlayModal open={howToPlay} onClose={() => setHowToPlay(false)} mode={mode} />
    </>
  );
}
