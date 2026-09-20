'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { LEAGUES, type League } from '@/lib/leagues';
import { audioManager } from '@/shared/lib/audio';
import { gameAudio, initAudio } from '@/shared/lib/gameAudio';

interface ShowcaseEntry {
  league: League;
  intensity: number;
}

const INTENSITY_MAP: Record<string, number> = {
  cuarzo: 1, bronce: 2, cobre: 3, plata: 4, oro: 5,
  rubi: 6, amatista: 7, diamante: 8, esmeralda: 9, obsidiana: 10,
};

const SHOWCASE_DATA: ShowcaseEntry[] = LEAGUES.map((l) => ({
  league: l,
  intensity: INTENSITY_MAP[l.name] || 1,
}));

/* ── Starfield ── */
function StarField() {
  const stars = useMemo(() => Array.from({ length: 250 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.8 + 0.3, opacity: Math.random() * 0.8 + 0.15,
    delay: Math.random() * 6, duration: 2 + Math.random() * 5,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0">
      {stars.map((s) => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`,
            opacity: s.opacity, animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite` }} />
      ))}
    </div>
  );
}

/* ── Planet ── */
function CosmicPlanet({ color, intensity }: { color: string; intensity: number }) {
  const size = 260 + intensity * 15;
  return (
    <div className="pointer-events-none absolute" style={{ right: '-2%', top: '5%' }}>
      {/* Atmosphere glow */}
      <div className="absolute -inset-20 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}18 0%, ${color}06 40%, transparent 70%)`,
          filter: 'blur(25px)', animation: 'nebulaDrift2 20s ease-in-out infinite alternate' }} />
      {/* Planet body */}
      <div className="relative rounded-full"
        style={{ width: size, height: size,
          background: `radial-gradient(circle at 35% 35%, ${color}40 0%, ${color}18 25%, #0a0a20 60%, #050510 100%)`,
          boxShadow: `inset -${size * 0.15}px -${size * 0.05}px ${size * 0.3}px rgba(0,0,0,0.7),
            0 0 ${size * 0.4}px ${color}15, 0 0 ${size * 0.8}px ${color}08` }}>
        {/* Surface detail 1 */}
        <div className="absolute rounded-full" style={{
          left: '20%', top: '30%', width: '25%', height: '20%',
          background: `radial-gradient(ellipse, ${color}12 0%, transparent 70%)`,
          filter: 'blur(8px)', transform: 'rotate(-15deg)' }} />
        {/* Surface detail 2 */}
        <div className="absolute rounded-full" style={{
          left: '50%', top: '55%', width: '18%', height: '15%',
          background: `radial-gradient(ellipse, ${color}0a 0%, transparent 70%)`,
          filter: 'blur(6px)', transform: 'rotate(20deg)' }} />
        {/* Ring system */}
        {intensity >= 4 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: size * 1.6, height: size * 0.35,
              border: `2px solid ${color}20`, borderRadius: '50%',
              transform: 'translate(-50%, -50%) rotateX(75deg) rotateZ(-15deg)',
              animation: 'orbitSpin 40s linear infinite' }}>
            <div className="absolute inset-2 rounded-full"
              style={{ border: `1px solid ${color}12` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Nebula Layer — massive, colorful, pronounced ── */
function NebulaLayer({ color, intensity }: { color: string; intensity: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Main nebula — huge, centered-left */}
      <div className="absolute" style={{
        left: '-10%', top: '-5%', width: '75%', height: '80%',
        background: `radial-gradient(ellipse at 40% 45%, ${color}30 0%, ${color}15 25%, ${color}08 45%, transparent 65%)`,
        filter: `blur(${30 + intensity * 3}px)`,
        animation: 'nebulaDrift1 28s ease-in-out infinite alternate' }} />

      {/* Secondary nebula — right side, different hue */}
      <div className="absolute" style={{
        right: '-8%', top: '15%', width: '60%', height: '65%',
        background: `radial-gradient(ellipse at 60% 50%, ${color}22 0%, ${color}0c 35%, transparent 60%)`,
        filter: `blur(${35 + intensity * 2}px)`,
        animation: 'nebulaDrift2 32s ease-in-out 4s infinite alternate-reverse' }} />

      {/* Bottom nebula sweep */}
      <div className="absolute" style={{
        left: '10%', bottom: '-10%', width: '80%', height: '50%',
        background: `radial-gradient(ellipse at 50% 80%, ${color}18 0%, ${color}06 40%, transparent 65%)`,
        filter: 'blur(40px)',
        animation: 'nebulaDrift3 25s ease-in-out 2s infinite alternate' }} />

      {/* Purple nebula cloud */}
      <div className="absolute" style={{
        left: '5%', top: '10%', width: '45%', height: '45%',
        background: 'radial-gradient(ellipse, #6b21a820 0%, #6b21a808 40%, transparent 70%)',
        filter: 'blur(35px)', animation: 'nebulaDrift1 20s ease-in-out 1s infinite alternate' }} />

      {/* Pink nebula cloud */}
      <div className="absolute" style={{
        right: '15%', top: '35%', width: '35%', height: '35%',
        background: 'radial-gradient(ellipse, #db277715 0%, #db277706 45%, transparent 70%)',
        filter: 'blur(30px)', animation: 'nebulaDrift2 24s ease-in-out 6s infinite alternate-reverse' }} />

      {/* Cyan nebula accent */}
      <div className="absolute" style={{
        left: '35%', bottom: '15%', width: '30%', height: '30%',
        background: 'radial-gradient(ellipse, #0891b212 0%, #0891b205 45%, transparent 70%)',
        filter: 'blur(25px)', animation: 'nebulaDrift3 22s ease-in-out 3s infinite alternate' }} />

      {/* Cosmic dust band — diagonal streak */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(135deg, transparent 20%, ${color}0a 40%, ${color}06 55%, transparent 75%)`,
        animation: 'cosmicDrift 40s ease-in-out infinite alternate' }} />

      {/* Secondary dust band */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(225deg, transparent 25%, #6b21a808 45%, #db277706 60%, transparent 80%)',
        animation: 'cosmicDrift 50s ease-in-out 5s infinite alternate-reverse' }} />
    </div>
  );
}

/* ── Floating Asteroids ── */
function FloatingAsteroids({ color, intensity }: { color: string; intensity: number }) {
  const rocks = useMemo(() => {
    const count = Math.min(5 + intensity * 2, 22);
    return Array.from({ length: count }, (_, i) => {
      const isLarge = i < 4;
      return {
        id: i, x: 5 + Math.random() * 90, y: 8 + Math.random() * 82,
        size: isLarge ? 30 + Math.random() * 50 : 8 + Math.random() * 22,
        duration: 12 + Math.random() * 20, delay: Math.random() * 8,
        opacity: isLarge ? 0.25 + Math.random() * 0.2 : 0.12 + Math.random() * 0.2,
        rotation: Math.random() * 360,
        shape: `${30 + Math.random() * 40}% ${60 - Math.random() * 20}% ${40 + Math.random() * 30}% ${50 + Math.random() * 20}%`,
      };
    });
  }, [intensity]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {rocks.map((r) => (
        <div key={r.id} className="absolute"
          style={{ left: `${r.x}%`, top: `${r.y}%`, width: r.size, height: r.size,
            borderRadius: r.shape,
            background: `linear-gradient(${135 + r.rotation}deg, ${color}25 0%, ${color}0c 60%, #1a1a2e08 100%)`,
            boxShadow: r.size > 25 ? `0 0 ${r.size * 0.3}px ${color}10, inset 0 -${r.size * 0.1}px ${r.size * 0.2}px rgba(0,0,0,0.4)` : 'none',
            opacity: r.opacity,
            animation: `rockDrift ${r.duration}s ease-in-out ${r.delay}s infinite alternate`,
            transform: `rotate(${r.rotation}deg)` }} />
      ))}
    </div>
  );
}

/* ── Ember / Fire Particles ── */
function EmberParticles({ color, intensity }: { color: string; intensity: number }) {
  const count = Math.min(12 + intensity * 5, 55);
  const embers = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i, x: 20 + Math.random() * 60, startY: 70 + Math.random() * 30,
    size: 1 + Math.random() * 3, delay: Math.random() * 8,
    duration: 3 + Math.random() * 5, drift: -30 + Math.random() * 60,
    isBright: i < count * 0.3,
  })), [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {embers.map((e) => {
        const driftDir = e.drift > 0 ? 'emberRiseRight' : 'emberRiseLeft';
        const emberStyle: React.CSSProperties = {
          width: e.size, height: e.size, left: `${e.x}%`, top: `${e.startY}%`,
          background: e.isBright ? '#ffffff' : color,
          boxShadow: e.isBright ? `0 0 ${e.size * 3}px ${color}aa, 0 0 ${e.size * 6}px ${color}40` : `0 0 ${e.size * 2}px ${color}60`,
          opacity: 0, animation: `${driftDir} ${e.duration}s ease-out ${e.delay}s infinite`,
        };
        return (
          <div key={e.id} className="absolute rounded-full" style={emberStyle} />
        );
      })}
    </div>
  );
}

/* ── Orbit Rings (glowing) ── */
function GlowOrbitRings({ color, intensity }: { color: string; intensity: number }) {
  const rings = useMemo(() => {
    const count = Math.min(2 + Math.floor(intensity / 2), 5);
    return Array.from({ length: count }, (_, i) => ({
      id: i, size: 220 + i * 35 + intensity * 8,
      tilt: 68 + i * 4, speed: 20 - intensity * 0.6 - i * 2,
      opacity: 0.25 + intensity * 0.04 - i * 0.04,
      thickness: i === 0 ? 2.5 : 1.5,
    }));
  }, [intensity]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      {rings.map((r) => (
        <div key={r.id} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: r.size, height: r.size,
            border: `${r.thickness}px solid ${color}`,
            opacity: r.opacity,
            boxShadow: `0 0 ${8 + intensity}px ${color}40, inset 0 0 ${4 + intensity}px ${color}20`,
            transform: `translate(-50%, -50%) rotateX(${r.tilt}deg)`,
            animation: `orbitSpin ${Math.abs(r.speed)}s linear infinite ${r.id % 2 === 0 ? '' : 'reverse'}` }} />
      ))}
    </div>
  );
}

/* ── Glow Aura (intense) ── */
function BadgeGlow({ color, intensity }: { color: string; intensity: number }) {
  const size = 300 + intensity * 20;
  const glowStrength = 30 + intensity * 8;
  return (
    <>
      {/* Outer soft glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 1.2, height: size * 1.2,
          background: `radial-gradient(circle, ${color}12 0%, ${color}06 35%, transparent 65%)`,
          filter: `blur(${glowStrength}px)`, animation: 'glowPulse 4s ease-in-out infinite' }} />
      {/* Inner bright core */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: size * 0.6, height: size * 0.6,
          background: `radial-gradient(circle, ${color}35 0%, ${color}10 50%, transparent 80%)`,
          filter: `blur(${glowStrength * 0.5}px)`, animation: 'glowPulse 3s ease-in-out 0.5s infinite' }} />
      {/* Bright center flash */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 80, height: 80,
          background: `radial-gradient(circle, ${color}50 0%, ${color}20 40%, transparent 70%)`,
          filter: 'blur(10px)', animation: 'glowPulse 2.5s ease-in-out 1s infinite' }} />
    </>
  );
}

/* ── Light Beams from pedestal ── */
function LightBeams({ color, intensity }: { color: string; intensity: number }) {
  if (intensity < 3) return null;
  const beamCount = Math.min(2 + Math.floor(intensity / 3), 5);
  return (
    <div className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2">
      {Array.from({ length: beamCount }, (_, i) => {
        const angle = -25 + (i * 50 / (beamCount - 1 || 1));
        const height = 200 + intensity * 15 + i * 20;
        return (
          <div key={i} className="absolute"
            style={{
              width: 3 + i * 0.5, height,
              left: 0, bottom: 0,
              background: `linear-gradient(to top, ${color}40, ${color}08, transparent)`,
              transformOrigin: 'bottom center',
              transform: `rotate(${angle}deg)`,
              filter: `blur(${3 + i}px)`,
              animation: `beamPulse ${3 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.6 - i * 0.08 }} />
        );
      })}
    </div>
  );
}

/* ── Glowing Pedestal Platform ── */
function GlowingPedestal({ color, intensity }: { color: string; intensity: number }) {
  const w = 240 + intensity * 12;
  return (
    <div className="pointer-events-none relative mt-[-20px]" style={{ height: 60 }}>
      {/* Main glowing line */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{
        width: w, height: 3, top: 0, borderRadius: '50%',
        background: `linear-gradient(90deg, transparent 2%, ${color}50 20%, ${color} 50%, ${color}50 80%, transparent 98%)`,
        boxShadow: `0 0 ${12 + intensity * 3}px ${color}90, 0 0 ${25 + intensity * 5}px ${color}50, 0 0 ${45 + intensity * 7}px ${color}25`,
        animation: 'pedestalPulse 3s ease-in-out infinite' }} />
      {/* Secondary thinner line below */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{
        width: w * 0.65, height: 1.5, top: 8,
        background: `linear-gradient(90deg, transparent, ${color}35, ${color}50, ${color}35, transparent)`,
        filter: 'blur(1px)', animation: 'pedestalPulse 2.5s ease-in-out 0.5s infinite' }} />
      {/* Glow underneath — soft radial */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{
        width: w * 1.4, height: 45, top: 5, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}15 0%, ${color}06 45%, transparent 75%)`,
        filter: 'blur(10px)' }} />
      {/* Bottom soft reflection */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{
        width: w * 0.8, height: 20, top: 20, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}08 0%, transparent 70%)`,
        filter: 'blur(8px)', animation: 'pedestalPulse 4s ease-in-out 1s infinite' }} />
    </div>
  );
}

/* ── League Info Display ── */
function LeagueInfo({ league, intensity }: { league: League; intensity: number }) {
  const currentIndex = LEAGUES.findIndex((l) => l.id === league.id);
  const nextLeague = LEAGUES[currentIndex + 1];
  const minStars = league.starsRequired;
  const maxStars = nextLeague ? nextLeague.starsRequired - 1 : '∞';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }} className="mt-3 text-center">
      <h2 className="text-4xl font-black tracking-wide"
        style={{ color: league.color,
          textShadow: `0 0 30px ${league.color}60, 0 0 60px ${league.color}30, 0 2px 8px rgba(0,0,0,0.5)` }}>
        {league.fullName}
      </h2>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
        style={{ border: `1.5px solid ${league.color}50`, background: `${league.color}10` }}>
        <Star size={14} fill={league.color} stroke={league.color} />
        <span className="text-sm font-bold text-white/80">
          {minStars} - {maxStars} pts
        </span>
      </div>
    </motion.div>
  );
}

/* ── Bottom Navigation ── */
function BottomNav({ currentIndex, onSelect }: { currentIndex: number; onSelect: (idx: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.children[currentIndex] as HTMLElement;
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 overflow-visible">
      {/* Soft gradient that blends seamlessly into the cosmic background */}
      <div className="relative w-full pb-5 pt-8 overflow-visible"
        style={{ background: 'linear-gradient(to top, rgba(5,5,16,0.92) 0%, rgba(8,8,24,0.4) 35%, transparent 70%)' }}>
        <div ref={scrollRef}
          className="flex items-end justify-center gap-3 px-14 pb-1"
          style={{ overflowX: 'auto', overflowY: 'visible' }}>
          {SHOWCASE_DATA.map((entry, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button key={entry.league.id}
                onClick={() => { audioManager.play('click'); onSelect(idx); }}
                className="flex flex-shrink-0 flex-col items-center gap-1 transition-all duration-300"
                style={{ scrollSnapAlign: 'center',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  marginBottom: isActive ? 6 : 0 }}>
                <div className="relative flex items-center justify-center rounded-full"
                  style={{
                    width: isActive ? 52 : 42, height: isActive ? 52 : 42,
                    background: `radial-gradient(circle, ${entry.league.color}25 0%, #0d0d1a 70%)`,
                    border: isActive ? `2.5px solid ${entry.league.color}` : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: isActive ? `0 0 20px ${entry.league.color}60, 0 0 40px ${entry.league.color}25, inset 0 0 10px ${entry.league.color}15` : 'none',
                    transition: 'all 0.3s ease' }}>
                  <img src={entry.league.image} alt={entry.league.fullName} draggable={false}
                    className="object-contain"
                    style={{ width: isActive ? 36 : 28, height: isActive ? 36 : 28 }} />
                </div>
                <span className="text-[9px] font-black leading-none whitespace-nowrap"
                  style={{
                    color: isActive ? entry.league.color : 'rgba(255,255,255,0.4)',
                    textShadow: isActive ? `0 0 10px ${entry.league.color}50` : 'none' }}>
                  {entry.league.name}
                </span>
                {isActive && (
                  <span className="text-[8px] font-bold leading-none"
                    style={{ color: `${entry.league.color}90` }}>
                    {entry.league.tier}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export function LeagueShowcaseScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const entry = SHOWCASE_DATA[currentIndex];
  const { league, intensity } = entry;

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_DATA.length);
    audioManager.play('click');
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SHOWCASE_DATA.length) % SHOWCASE_DATA.length);
    audioManager.play('click');
  }, []);

  useEffect(() => {
    const init = () => { initAudio(); window.removeEventListener('keydown', init); window.removeEventListener('click', init); };
    window.addEventListener('keydown', init);
    window.addEventListener('click', init);
    gameAudio.startLeagueMusic();
    return () => {
      gameAudio.stopMusic();
      window.removeEventListener('keydown', init);
      window.removeEventListener('click', init);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  const badgeSize = 200;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0, scale: 0.8 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, scale: 0.8 }),
  };

  return (
    <main className="relative min-h-screen select-none"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* ═══ COSMIC BACKGROUND ═══ */}
      <div className="fixed inset-0 overflow-visible"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, #1a1040 0%, #0d0b20 35%, #080818 55%, #050510 100%)' }}>
        <StarField />
        <NebulaLayer color={league.color} intensity={intensity} />
        <CosmicPlanet color={league.color} intensity={intensity} />
        <FloatingAsteroids color={league.color} intensity={intensity} />
      </div>

      {/* ═══ HEADER ═══ */}
      <div className="relative z-20 px-5 pt-5 pb-2">
        <div className="mx-auto max-w-md flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={() => { audioManager.play('back'); window.location.href = '/ligas'; }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm border border-white/10">
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-white">
              Diseños de <span style={{ color: league.color }}>Ligas</span>
            </h1>
            <p className="text-[10px] font-bold text-white/40">
              Explora todos los diseños y descubre cuál te espera
            </p>
          </div>
        </div>
      </div>

      {/* ═══ MAIN SHOWCASE ═══ */}
      <div className="relative z-10 flex flex-col items-center" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Navigation Arrows */}
        <motion.button whileHover={{ scale: 1.15, x: -2 }} whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          className="absolute left-2 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 text-white transition-colors md:left-6"
          style={{ borderColor: `${league.color}40`, background: `${league.color}08`,
            boxShadow: `0 0 25px ${league.color}20, inset 0 0 15px ${league.color}08`,
            backdropFilter: 'blur(12px)' }}>
          <ChevronLeft size={26} />
        </motion.button>
        <motion.button whileHover={{ scale: 1.15, x: 2 }} whileTap={{ scale: 0.9 }}
          onClick={goNext}
          className="absolute right-2 top-1/2 z-30 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border-2 text-white transition-colors md:right-6"
          style={{ borderColor: `${league.color}40`, background: `${league.color}08`,
            boxShadow: `0 0 25px ${league.color}20, inset 0 0 15px ${league.color}08`,
            backdropFilter: 'blur(12px)' }}>
          <ChevronRight size={26} />
        </motion.button>

        {/* Center Content */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={league.id} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.8 }}
              className="flex flex-col items-center">
              {/* Badge Container */}
              <div className="relative flex items-center justify-center overflow-visible" style={{ width: 380, height: 380 }}>
                <BadgeGlow color={league.color} intensity={intensity} />
                <GlowOrbitRings color={league.color} intensity={intensity} />
                <EmberParticles color={league.color} intensity={intensity} />
                <LightBeams color={league.color} intensity={intensity} />

                {/* Badge with floating animation */}
                <motion.div animate={{
                    y: [0, -12, 0, 8, 0], rotateY: [0, 4, 0, -4, 0],
                    scale: [1, 1.02, 1, 0.98, 1] }}
                  transition={{ duration: 5 + (10 - intensity) * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10" style={{ perspective: 800 }}>
                  <div className="flex items-center justify-center rounded-full"
                    style={{ width: badgeSize + 60, height: badgeSize + 60,
                      background: `radial-gradient(circle, ${league.color}20 0%, ${league.color}08 40%, transparent 70%)` }}>
                    <img src={league.image} alt={league.fullName} draggable={false}
                      className="relative z-10 object-contain"
                      style={{ width: badgeSize, height: badgeSize,
                        filter: `drop-shadow(0 0 ${15 + intensity * 5}px ${league.color}80) drop-shadow(0 0 ${8 + intensity * 3}px ${league.color}aa) drop-shadow(0 0 ${4 + intensity}px ${league.color}cc)` }} />
                  </div>
                </motion.div>
              </div>

              <GlowingPedestal color={league.color} intensity={intensity} />
              <LeagueInfo league={league} intensity={intensity} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomNav currentIndex={currentIndex} onSelect={setCurrentIndex} />

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }
        @keyframes emberRiseRight {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.5); }
          10% { opacity: 1; }
          80% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-180px) translateX(30px) scale(0.8); }
        }
        @keyframes emberRiseLeft {
          0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.5); }
          10% { opacity: 1; }
          80% { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-180px) translateX(-30px) scale(0.8); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes orbitSpin {
          from { transform: translate(-50%, -50%) rotateX(68deg) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) rotateX(68deg) rotateZ(360deg); }
        }
        @keyframes pedestalPulse {
          0%, 100% { opacity: 0.7; transform: translateX(-50%) scaleX(1); }
          50% { opacity: 1; transform: translateX(-50%) scaleX(1.12); }
        }
        @keyframes rockDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(18px, -14px) rotate(10deg); }
        }
        @keyframes nebulaDrift1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, -35px) scale(1.2); }
        }
        @keyframes nebulaDrift2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-45px, 30px) scale(1.15); }
        }
        @keyframes nebulaDrift3 {
          0% { transform: translate(0, 0) scale(0.95); }
          100% { transform: translate(30px, -25px) scale(1.1); }
        }
        @keyframes cosmicDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-30px, 25px) rotate(4deg); }
        }
        @keyframes beamPulse {
          0%, 100% { opacity: 0.4; transform: rotate(var(--beam-angle, 0deg)) scaleY(1); }
          50% { opacity: 0.8; transform: rotate(var(--beam-angle, 0deg)) scaleY(1.1); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
