'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

const EMBERS = Array.from({ length: 20 }, (_, i) => ({
  x: 5 + (i * 4.7) % 90,
  startY: 95 + (i % 5) * 5,
  size: 2 + (i % 4) * 1.5,
  delay: (i * 0.35) % 4,
  dur: 3 + (i % 5) * 0.8,
  drift: (i % 2 === 0 ? 1 : -1) * (10 + (i % 3) * 8),
}));

const BUBBLES = Array.from({ length: 8 }, (_, i) => ({
  x: 10 + (i * 11) % 80,
  y: 70 + (i % 3) * 8,
  size: 8 + (i % 4) * 6,
  delay: i * 0.7,
  dur: 2.5 + (i % 3) * 0.5,
}));

const LAVA_CHUNKS = Array.from({ length: 6 }, (_, i) => ({
  x: 5 + (i * 17) % 90,
  y: 80 + (i % 3) * 5,
  width: 30 + (i % 3) * 20,
  height: 15 + (i % 2) * 10,
  delay: i * 1.2,
  dur: 5 + (i % 3) * 2,
}));

interface LavaLoadingScreenProps {
  complete?: boolean;
  onComplete?: () => void;
}

export function LavaLoadingScreen({ complete, onComplete }: LavaLoadingScreenProps) {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setFading(true);
    setTimeout(() => onComplete?.(), 500);
  }, [onComplete]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          finish();
          return 100;
        }
        if (complete) {
          const next = prev + Math.max(8, (100 - prev) * 0.15);
          if (next >= 100) { finish(); return 100; }
          return next;
        }
        if (prev >= 90) return prev + Math.random() * 2 + 0.5;
        return prev + Math.random() * 3 + 1;
      });
    }, 100);
    return () => { clearInterval(dotInterval); clearInterval(progressInterval); };
  }, [complete, finish]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100, overflow: 'hidden',
      background: 'linear-gradient(180deg, #0a0a0c 0%, #1a0c08 20%, #2a1008 40%, #3a1508 60%, #4a1a0a 80%, #5a200c 100%)',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Volcanic mountain silhouette */}
      <div style={{
        position: 'absolute', bottom: '30%', left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '180px solid transparent', borderRight: '180px solid transparent',
        borderBottom: '200px solid #1a0808',
        opacity: 0.6,
      }} />
      <div style={{
        position: 'absolute', bottom: '30%', left: '35%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '120px solid transparent', borderRight: '120px solid transparent',
        borderBottom: '140px solid #150606',
        opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute', bottom: '30%', left: '65%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '100px solid transparent', borderRight: '100px solid transparent',
        borderBottom: '120px solid #180707',
        opacity: 0.45,
      }} />

      {/* Volcanic crater glow */}
      <div style={{
        position: 'absolute', bottom: 'calc(30% + 140px)', left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 30, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,80,0,0.7) 0%, rgba(255,40,0,0.3) 50%, transparent 100%)',
        animation: 'craterGlow 3s ease-in-out infinite',
      }} />

      {/* Lava flow at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: 'linear-gradient(180deg, rgba(255,60,0,0.3) 0%, rgba(255,100,0,0.5) 30%, rgba(255,120,0,0.6) 60%, rgba(255,80,0,0.7) 100%)',
        animation: 'lavaFlowPulse 4s ease-in-out infinite',
      }} />

      {/* Lava chunks */}
      {LAVA_CHUNKS.map((c, i) => (
        <div key={`lc${i}`} style={{
          position: 'absolute', left: `${c.x}%`, bottom: `${100 - c.y}%`,
          width: c.width, height: c.height,
          borderRadius: '40% 60% 50% 50% / 50% 50% 60% 40%',
          background: `radial-gradient(ellipse, rgba(255,100,0,0.6) 0%, rgba(200,40,0,0.4) 60%, transparent 100%)`,
          animation: `lavaChunkFloat ${c.dur}s ease-in-out ${c.delay}s infinite`,
        }} />
      ))}

      {/* Lava bubbles */}
      {BUBBLES.map((b, i) => (
        <div key={`b${i}`} style={{
          position: 'absolute', left: `${b.x}%`, bottom: `${100 - b.y}%`,
          width: b.size, height: b.size, borderRadius: '50%',
          border: '1.5px solid rgba(255,150,0,0.5)',
          background: 'radial-gradient(circle, rgba(255,120,0,0.3) 0%, transparent 70%)',
          animation: `bubbleRise ${b.dur}s ease-in-out ${b.delay}s infinite`,
        }} />
      ))}

      {/* Floating embers */}
      {EMBERS.map((e, i) => (
        <div key={`e${i}`} style={{
          position: 'absolute', left: `${e.x}%`, bottom: `${e.startY}%`,
          width: e.size, height: e.size, borderRadius: '50%',
          background: i % 3 === 0 ? '#FF6600' : i % 3 === 1 ? '#FF4400' : '#FF8800',
          boxShadow: `0 0 ${e.size * 3}px ${i % 3 === 0 ? '#FF6600' : '#FF4400'}`,
          animation: `emberRise_${i} ${e.dur}s ease-out ${e.delay}s infinite`,
        }} />
      ))}

      {/* Smoke wisps */}
      <div style={{
        position: 'absolute', bottom: '30%', left: '48%',
        width: 150, height: 200, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(80,40,20,0.2) 0%, transparent 70%)',
        filter: 'blur(15px)',
        animation: 'smokeDrift 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '32%', left: '55%',
        width: 120, height: 180, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(60,30,15,0.15) 0%, transparent 70%)',
        filter: 'blur(12px)',
        animation: 'smokeDrift 10s ease-in-out 2s infinite',
      }} />

      <style>{`
        @keyframes craterGlow {
          0%, 100% { opacity: 0.6; filter: blur(3px); }
          50% { opacity: 1; filter: blur(5px); }
        }
        @keyframes lavaFlowPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes lavaChunkFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateY(-5px) rotate(3deg); opacity: 0.7; }
        }
        @keyframes bubbleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 0.8; }
          100% { transform: translateY(-30px) scale(0.3); opacity: 0; }
        }
        ${EMBERS.map((e, i) => `@keyframes emberRise_${i} {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-300px) translateX(${e.drift}px) scale(0.2); opacity: 0; }
        }`).join('\n        ')}
        @keyframes smokeDrift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-10px, -20px) scale(1.1); opacity: 0.5; }
        }
        @keyframes iconPulse {
          0%, 100% { transform: translateY(0); filter: brightness(1); }
          50% { transform: translateY(-4px); filter: brightness(1.1); }
        }
      `}</style>

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'rgba(255,60,0,0.15)', backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,80,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, animation: 'iconPulse 2s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(255,60,0,0.2), 0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c-4 4-6 7-6 11a6 6 0 0 0 12 0c0-4-2-7-6-11z" fill="rgba(255,80,0,0.3)" />
            <path d="M12 22a4 4 0 0 1-4-4c0-2 2-4 4-8 2 4 4 6 4 8a4 4 0 0 1-4 4z" fill="rgba(255,40,0,0.2)" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 800,
          color: '#FF8800',
          textShadow: '0 0 20px rgba(255,80,0,0.5), 0 2px 8px rgba(0,0,0,0.5)',
          margin: 0, letterSpacing: -0.5,
        }}>
          La Lava del Conocimiento
        </h1>

        <p style={{
          fontSize: 14, color: 'rgba(255,150,80,0.8)',
          marginTop: 8, fontWeight: 500,
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}>
          {progress >= 100 ? '¡Listo!' : `Encendiendo la hoguera del saber${dots}`}
        </p>

        <div style={{
          width: 240, height: 6, borderRadius: 3,
          background: 'rgba(255,80,0,0.15)', marginTop: 32,
          overflow: 'hidden',
          border: '1px solid rgba(255,80,0,0.2)',
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #FF4400 0%, #FF6600 50%, #FF8800 100%)',
            boxShadow: '0 0 12px rgba(255,80,0,0.6), 0 0 4px rgba(255,60,0,0.8)',
            transition: 'width 0.12s ease-out',
          }} />
        </div>

        <p style={{
          fontSize: 11, color: 'rgba(255,150,80,0.6)',
          marginTop: 12, fontWeight: 500,
        }}>
          {Math.min(Math.round(progress), 100)}%
        </p>
      </div>
    </div>
  );
}
