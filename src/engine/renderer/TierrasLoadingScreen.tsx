'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

const BUBBLES = Array.from({ length: 15 }, (_, i) => ({
  x: 5 + (i * 6.5) % 90,
  startY: 90 + (i % 4) * 5,
  size: 4 + (i % 5) * 3,
  delay: (i * 0.4) % 5,
  dur: 3 + (i % 4) * 0.8,
  drift: (i % 2 === 0 ? 1 : -1) * (5 + (i % 3) * 4),
}));

const TREES = Array.from({ length: 5 }, (_, i) => ({
  x: 8 + (i * 20) % 84,
  height: 80 + (i % 3) * 30,
  width: 40 + (i % 2) * 20,
  delay: i * 0.3,
}));

const MIST = Array.from({ length: 4 }, (_, i) => ({
  x: 10 + (i * 25) % 80,
  y: 55 + (i % 2) * 15,
  width: 200 + (i % 3) * 80,
  delay: i * 1.5,
  dur: 8 + (i % 3) * 3,
}));

interface TierrasLoadingScreenProps {
  complete?: boolean;
  onComplete?: () => void;
}

export function TierrasLoadingScreen({ complete, onComplete }: TierrasLoadingScreenProps) {
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
      background: 'linear-gradient(180deg, #050a05 0%, #0a1a0a 20%, #0d200d 40%, #102810 60%, #143014 80%, #183818 100%)',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Dark water at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: 'linear-gradient(180deg, rgba(0,40,20,0.4) 0%, rgba(0,60,30,0.6) 40%, rgba(0,80,40,0.7) 70%, rgba(0,50,25,0.8) 100%)',
        animation: 'waterPulse 5s ease-in-out infinite',
      }} />

      {/* Tree silhouettes */}
      {TREES.map((t, i) => (
        <div key={`tree${i}`} style={{
          position: 'absolute', left: `${t.x}%`, bottom: '35%',
          transform: 'translateX(-50%)',
        }}>
          {/* Trunk */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 8, height: t.height * 0.6,
            background: '#0a1a0a',
            borderRadius: '2px 2px 0 0',
          }} />
          {/* Canopy */}
          <div style={{
            position: 'absolute', bottom: t.height * 0.4, left: '50%', transform: 'translateX(-50%)',
            width: t.width, height: t.height * 0.6,
            background: '#0a1a0a',
            borderRadius: '50% 50% 10% 10%',
          }} />
          {/* Roots */}
          <div style={{
            position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
            width: t.width * 0.8, height: 12,
            background: '#0a1a0a',
            borderRadius: '0 0 50% 50%',
          }} />
        </div>
      ))}

      {/* Rising bubbles */}
      {BUBBLES.map((b, i) => (
        <div key={`b${i}`} style={{
          position: 'absolute', left: `${b.x}%`, bottom: `${b.startY}%`,
          width: b.size, height: b.size, borderRadius: '50%',
          border: '1px solid rgba(100,200,100,0.3)',
          background: 'radial-gradient(circle, rgba(80,180,80,0.2) 0%, transparent 70%)',
          animation: `swampBubbleRise ${b.dur}s ease-in-out ${b.delay}s infinite`,
        }} />
      ))}

      {/* Mist layers */}
      {MIST.map((m, i) => (
        <div key={`m${i}`} style={{
          position: 'absolute', left: `${m.x}%`, top: `${m.y}%`,
          width: m.width, height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(20,50,20,0.15) 0%, transparent 70%)',
          filter: 'blur(20px)',
          animation: `mistDrift ${m.dur}s ease-in-out ${m.delay}s infinite`,
        }} />
      ))}

      {/* Water surface shimmer */}
      <div style={{
        position: 'absolute', bottom: '34%', left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, transparent, rgba(80,160,80,0.2), transparent, rgba(80,160,80,0.15), transparent)',
        animation: 'shimmer 6s linear infinite',
      }} />

      <style>{`
        @keyframes waterPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes swampBubbleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-20px) scale(1.1); opacity: 0.7; }
          100% { transform: translateY(-40px) scale(0.3); opacity: 0; }
        }
        @keyframes mistDrift {
          0%, 100% { transform: translateX(0) scale(1); opacity: 0.3; }
          50% { transform: translateX(-15px) scale(1.15); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
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
          background: 'rgba(27, 94, 32, 0.4)', backdropFilter: 'blur(10px)',
          border: '2px solid rgba(27, 94, 32, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, animation: 'iconPulse 2s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(27,94,32,0.2), 0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <img src="/images/Logos_juegos/tierras_hundidas.png" alt="Tierras Hundidas"           width={78} height={78} style={{ width: 78, height: 78, objectFit: 'contain' }} draggable={false} />
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 800,
          color: '#44AA44',
          textShadow: '0 0 20px rgba(0,120,0,0.5), 0 2px 8px rgba(0,0,0,0.5)',
          margin: 0, letterSpacing: -0.5,
        }}>
          Tierras Hundidas
        </h1>

        <p style={{
          fontSize: 14, color: 'rgba(100,200,100,0.8)',
          marginTop: 8, fontWeight: 500,
          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}>
          {progress >= 100 ? '¡Listo!' : `Adentrándose en el pantano${dots}`}
        </p>

        <div style={{
          width: 240, height: 6, borderRadius: 3,
          background: 'rgba(0,80,0,0.15)', marginTop: 32,
          overflow: 'hidden',
          border: '1px solid rgba(0,100,0,0.2)',
        }}>
          <div style={{
            width: `${Math.min(progress, 100)}%`, height: '100%',
            borderRadius: 3,
            background: 'linear-gradient(90deg, #228822 0%, #44AA44 50%, #66CC66 100%)',
            boxShadow: '0 0 12px rgba(0,120,0,0.6), 0 0 4px rgba(0,100,0,0.8)',
            transition: 'width 0.12s ease-out',
          }} />
        </div>

        <p style={{
          fontSize: 11, color: 'rgba(100,200,100,0.6)',
          marginTop: 12, fontWeight: 500,
        }}>
          {Math.min(Math.round(progress), 100)}%
        </p>
      </div>
    </div>
  );
}
