'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

const CLOUDS = [
  { x: 10, y: 20, size: 90, delay: 0, dur: 18, opacity: 0.6 },
  { x: 30, y: 35, size: 120, delay: 3, dur: 22, opacity: 0.5 },
  { x: 55, y: 15, size: 80, delay: 1.5, dur: 16, opacity: 0.55 },
  { x: 75, y: 40, size: 110, delay: 5, dur: 20, opacity: 0.45 },
  { x: 85, y: 25, size: 70, delay: 2.5, dur: 19, opacity: 0.5 },
  { x: 15, y: 55, size: 60, delay: 7, dur: 21, opacity: 0.35 },
  { x: 60, y: 60, size: 100, delay: 4, dur: 17, opacity: 0.4 },
];

const SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  x: 5 + (i * 8.3) % 90,
  y: 5 + ((i * 13.7) % 80),
  size: 2 + (i % 3) * 1.5,
  delay: i * 0.6,
  dur: 2 + (i % 3) * 0.8,
}));

interface DecisionRoadLoadingScreenProps {
  complete?: boolean;
  onComplete?: () => void;
}

export function DecisionRoadLoadingScreen({ complete, onComplete }: DecisionRoadLoadingScreenProps) {
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
    }, 500);
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
        return prev + Math.random() * 4 + 1;
      });
    }, 100);
    return () => { clearInterval(dotInterval); clearInterval(progressInterval); };
  }, [complete, finish]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100, overflow: 'hidden',
      background: 'linear-gradient(180deg, #1a6fa8 0%, #4db8e8 30%, #7EC8E3 50%, #a8e0f0 70%, #d4f0ff 100%)',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Sun glow */}
      <div style={{
        position: 'absolute', top: '5%', right: '15%',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,240,150,0.9) 0%, rgba(255,220,80,0.4) 40%, transparent 70%)',
        filter: 'blur(2px)',
        animation: 'sunPulse 4s ease-in-out infinite',
      }} />

      {/* Clouds */}
      {CLOUDS.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${c.x}%`, top: `${c.y}%`,
          width: c.size, height: c.size * 0.5,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,255,255,${c.opacity}) 0%, rgba(255,255,255,${c.opacity * 0.3}) 60%, transparent 100%)`,
          filter: 'blur(4px)',
          animation: `cloudFloat ${c.dur}s ease-in-out ${c.delay}s infinite`,
        }} />
      ))}

      {/* Floating island silhouette */}
      <div style={{
        position: 'absolute', bottom: '18%', left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 80, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        background: 'linear-gradient(180deg, #3d9e5f 0%, #2d7a48 60%, #5a3a28 80%, #3a2518 100%)',
        opacity: 0.7,
        animation: 'islandFloat 6s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute', top: -20, left: 40,
          width: 0, height: 0,
          borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
          borderBottom: '30px solid rgba(34,90,50,0.8)',
        }} />
        <div style={{
          position: 'absolute', top: -15, left: 100,
          width: 0, height: 0,
          borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
          borderBottom: '25px solid rgba(40,100,55,0.7)',
        }} />
        <div style={{
          position: 'absolute', top: -12, left: 140,
          width: 0, height: 0,
          borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
          borderBottom: '22px solid rgba(35,85,45,0.75)',
        }} />
        <div style={{
          position: 'absolute', top: 5, left: 20, width: 60, height: 8,
          borderRadius: '50%', background: 'rgba(80,160,80,0.4)',
        }} />
      </div>

      {/* Sparkles */}
      {SPARKLES.map((s, i) => (
        <div key={`s${i}`} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.6)`,
          animation: `sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}

      {/* Path line */}
      <div style={{
        position: 'absolute', bottom: '12%', left: '30%', right: '30%',
        height: 3, borderRadius: 2,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        animation: 'pathPulse 3s ease-in-out infinite',
      }} />

      {/* Center content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 10,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: 'rgba(79, 195, 247, 0.35)', backdropFilter: 'blur(10px)',
          border: '2px solid rgba(79, 195, 247, 0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, animation: 'iconPulse 2s ease-in-out infinite',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <img src="/images/Logos_juegos/rumbo.png" alt="Rumbo"           width={78} height={78} style={{ width: 78, height: 78, objectFit: 'contain' }} draggable={false} />
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#fff',
          textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          margin: 0, letterSpacing: -0.5,
        }}>
          Rumbo
        </h1>

        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.8)',
          marginTop: 8, fontWeight: 500,
          textShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          {progress >= 100 ? '¡Listo!' : `Preparando tu aventura${dots}`}
        </p>

        <div style={{
          width: 240, height: 6, borderRadius: 3,
          background: 'rgba(255,255,255,0.25)', marginTop: 32,
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: '100%',
            borderRadius: 3, background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.9) 100%)',
            boxShadow: '0 0 8px rgba(255,255,255,0.5)',
            transition: 'width 0.15s ease-out',
          }} />
        </div>

        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.6)',
          marginTop: 12, fontWeight: 500,
        }}>
          {Math.min(Math.round(progress), 100)}%
        </p>
      </div>

      <style>{`
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }
        @keyframes islandFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pathPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes iconPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
