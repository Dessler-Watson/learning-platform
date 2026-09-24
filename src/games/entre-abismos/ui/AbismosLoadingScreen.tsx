'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

const STARS = Array.from({ length: 36 }, (_, i) => ({
  x: 3 + (i * 7.3) % 94,
  y: 3 + ((i * 11.7) % 55),
  size: 1.5 + (i % 3),
  delay: (i * 0.35) % 5,
  dur: 2 + (i % 4) * 0.7,
}));

const CRYSTALS = Array.from({ length: 10 }, (_, i) => ({
  x: 6 + (i * 9.1) % 88,
  y: 18 + (i % 4) * 12,
  size: 5 + (i % 3) * 3,
  delay: (i * 0.5) % 4,
  dur: 3 + (i % 3),
  color: i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#818cf8' : '#c084fc',
}));

const PLATFORMS = Array.from({ length: 6 }, (_, i) => ({
  x: 18 + i * 12,
  y: 72 - (i % 3) * 8,
  w: 36 + (i % 2) * 14,
  delay: i * 0.4,
  dur: 4 + (i % 3),
}));

interface AbismosLoadingScreenProps {
  complete?: boolean;
  onComplete?: () => void;
}

export function AbismosLoadingScreen({ complete, onComplete }: AbismosLoadingScreenProps) {
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
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          finish();
          return 100;
        }
        if (complete) {
          const next = prev + Math.max(8, (100 - prev) * 0.15);
          if (next >= 100) {
            finish();
            return 100;
          }
          return next;
        }
        if (prev >= 90) return prev + Math.random() * 2 + 0.5;
        return prev + Math.random() * 3.5 + 1;
      });
    }, 100);
    return () => {
      clearInterval(dotInterval);
      clearInterval(progressInterval);
    };
  }, [complete, finish]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, #060a14 0%, #0a1224 25%, #101a32 45%, #152040 65%, #1a2848 85%, #0e1528 100%)',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* Stars */}
      {STARS.map((s, i) => (
        <div
          key={`star-${i}`}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'rgba(200,220,255,0.9)',
            boxShadow: `0 0 ${s.size * 3}px rgba(160,190,255,0.6)`,
            animation: `abStar ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Distant mountain silhouettes */}
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: 0,
          right: 0,
          height: '38%',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(12,18,36,0.35) 40%, rgba(8,12,24,0.75) 100%)',
          clipPath:
            'polygon(0% 100%, 0% 70%, 8% 45%, 16% 62%, 24% 30%, 32% 55%, 42% 20%, 50% 48%, 58% 25%, 68% 50%, 76% 28%, 85% 55%, 92% 35%, 100% 60%, 100% 100%)',
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '22%',
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(5,8,16,0.9) 100%)',
          clipPath:
            'polygon(0% 100%, 0% 75%, 10% 50%, 20% 70%, 30% 40%, 40% 65%, 50% 35%, 60% 60%, 72% 42%, 82% 68%, 92% 48%, 100% 72%, 100% 100%)',
          opacity: 0.85,
        }}
      />

      {/* Abyss glow at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28%',
          background:
            'linear-gradient(180deg, transparent 0%, rgba(40,20,80,0.25) 40%, rgba(60,30,110,0.4) 100%)',
          animation: 'abAbyssPulse 5s ease-in-out infinite',
        }}
      />

      {/* Floating platforms */}
      {PLATFORMS.map((p, i) => (
        <div
          key={`plat-${i}`}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.w,
            height: 8,
            borderRadius: 3,
            background:
              'linear-gradient(180deg, rgba(120,145,100,0.55) 0%, rgba(70,90,55,0.65) 55%, rgba(45,35,30,0.7) 100%)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(180,200,160,0.25)',
            animation: `abPlatFloat ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -3,
              left: '20%',
              width: '60%',
              height: 3,
              borderRadius: 2,
              background: 'rgba(140,170,110,0.45)',
            }}
          />
        </div>
      ))}

      {/* Purple crystals on edges */}
      {CRYSTALS.map((c, i) => (
        <div
          key={`cry-${i}`}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.size,
            height: c.size * 1.8,
            background: `linear-gradient(180deg, ${c.color} 0%, transparent 100%)`,
            clipPath: 'polygon(50% 0%, 100% 35%, 75% 100%, 25% 100%, 0% 35%)',
            opacity: 0.55,
            filter: `drop-shadow(0 0 6px ${c.color})`,
            animation: `abCrystal ${c.dur}s ease-in-out ${c.delay}s infinite`,
          }}
        />
      ))}

      {/* Wind streaks right → left */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`wind-${i}`}
          style={{
            position: 'absolute',
            left: `${10 + (i * 13) % 85}%`,
            top: `${15 + (i * 9) % 60}%`,
            width: 40 + (i % 3) * 30,
            height: 1.5,
            borderRadius: 2,
            background:
              'linear-gradient(90deg, transparent, rgba(200,220,255,0.35), transparent)',
            animation: `abWind ${4 + (i % 3)}s linear ${i * 0.6}s infinite`,
          }}
        />
      ))}

      {/* Drifting mist */}
      <div
        style={{
          position: 'absolute',
          bottom: '24%',
          left: '10%',
          width: 280,
          height: 50,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(140,150,190,0.12) 0%, transparent 70%)',
          filter: 'blur(16px)',
          animation: 'abMist 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '28%',
          right: '8%',
          width: 220,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(120,130,180,0.1) 0%, transparent 70%)',
          filter: 'blur(14px)',
          animation: 'abMist 11s ease-in-out 2s infinite',
        }}
      />

      <style>{`
        @keyframes abStar {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes abAbyssPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes abPlatFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes abCrystal {
          0%, 100% { opacity: 0.35; transform: scaleY(1); }
          50% { opacity: 0.7; transform: scaleY(1.08); }
        }
        @keyframes abWind {
          0% { transform: translateX(40px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(-120px); opacity: 0; }
        }
        @keyframes abMist {
          0%, 100% { transform: translateX(0) scale(1); opacity: 0.4; }
          50% { transform: translateX(20px) scale(1.1); opacity: 0.7; }
        }
        @keyframes abIconPulse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'rgba(25, 118, 210, 0.35)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(25, 118, 210, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            animation: 'abIconPulse 2s ease-in-out infinite',
            boxShadow: '0 0 30px rgba(25,118,210,0.25), 0 8px 32px rgba(0,0,0,0.35)',
          }}
        >
          <img
            src="/images/Logos_juegos/entre_abismos.png"
            alt="Entre Abismos"
            width={78}
            height={78}
            style={{ width: 78, height: 78, objectFit: 'contain' }}
            draggable={false}
          />
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#e8e0ff',
            textShadow: '0 0 20px rgba(120,100,255,0.45), 0 2px 8px rgba(0,0,0,0.5)',
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Entre Abismos
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'rgba(180,170,230,0.8)',
            marginTop: 8,
            fontWeight: 500,
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          {progress >= 100 ? '¡Listo!' : `Cruzando el abismo${dots}`}
        </p>

        <div
          style={{
            width: 240,
            height: 6,
            borderRadius: 3,
            background: 'rgba(100,90,180,0.18)',
            marginTop: 32,
            overflow: 'hidden',
            border: '1px solid rgba(120,110,220,0.25)',
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: '100%',
              borderRadius: 3,
              background: 'linear-gradient(90deg, #6d5cff 0%, #a78bfa 50%, #c4b5fd 100%)',
              boxShadow: '0 0 12px rgba(140,120,255,0.55), 0 0 4px rgba(120,100,255,0.8)',
              transition: 'width 0.12s ease-out',
            }}
          />
        </div>

        <p
          style={{
            fontSize: 11,
            color: 'rgba(160,150,220,0.6)',
            marginTop: 12,
            fontWeight: 500,
          }}
        >
          {Math.min(Math.round(progress), 100)}%
        </p>
      </div>
    </div>
  );
}
