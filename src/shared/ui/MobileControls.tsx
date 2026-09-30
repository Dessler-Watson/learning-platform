'use client';
import { useCallback, useEffect, useRef } from 'react';
import {
  useTouchControlsPref,
  useAutoTouchControlsVisible,
} from '@/shared/hooks/useTouchControls';

const KEY_MAP: Record<string, string> = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
};

function dispatchKey(code: string, type: 'keydown' | 'keyup') {
  window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
}

function TouchButton({
  label,
  icon,
  action,
  style,
}: {
  label: string;
  icon: React.ReactNode;
  action: string;
  style?: React.CSSProperties;
}) {
  const activeRef = useRef(false);

  const onDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!activeRef.current) {
        activeRef.current = true;
        dispatchKey(KEY_MAP[action], 'keydown');
      }
    },
    [action]
  );

  const onUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (activeRef.current) {
        activeRef.current = false;
        dispatchKey(KEY_MAP[action], 'keyup');
      }
    },
    [action]
  );

  const onLeave = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (activeRef.current) {
        activeRef.current = false;
        dispatchKey(KEY_MAP[action], 'keyup');
      }
    },
    [action]
  );

  return (
    <button
      aria-label={label}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onLeave}
      onPointerCancel={onUp}
      style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        border: '2px solid rgba(255,255,255,0.25)',
        background: 'rgba(16,24,36,0.82)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      {icon}
    </button>
  );
}

function ArrowIcon({ rotation }: { rotation: number }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M12 4L12 20M12 4L6 10M12 4L18 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MobileControls() {
  const pref = useTouchControlsPref();
  const autoVisible = useAutoTouchControlsVisible();

  useEffect(() => {
    const releaseAll = () => {
      Object.values(KEY_MAP).forEach((code) => dispatchKey(code, 'keyup'));
    };
    window.addEventListener('blur', releaseAll);
    return () => {
      window.removeEventListener('blur', releaseAll);
      releaseAll();
    };
  }, []);

  const show = pref === 'on' || (pref === 'auto' && autoVisible);
  if (!show) return null;

  return (
    <div
      className="mobile-controls"
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        zIndex: 55,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      {/* D-Pad izquierdo */}
      <div style={{ pointerEvents: 'auto' }}>
        <div
          style={{
            position: 'relative',
            width: 144,
            height: 144,
          }}
        >
          {/* Arriba */}
          <div style={{ position: 'absolute', top: 0, left: 48 }}>
            <TouchButton label="Adelante" action="forward" icon={<ArrowIcon rotation={0} />} />
          </div>
          {/* Abajo */}
          <div style={{ position: 'absolute', bottom: 0, left: 48 }}>
            <TouchButton label="Atrás" action="backward" icon={<ArrowIcon rotation={180} />} />
          </div>
          {/* Izquierda */}
          <div style={{ position: 'absolute', top: 48, left: 0 }}>
            <TouchButton label="Izquierda" action="left" icon={<ArrowIcon rotation={270} />} />
          </div>
          {/* Derecha */}
          <div style={{ position: 'absolute', top: 48, right: 0 }}>
            <TouchButton label="Derecha" action="right" icon={<ArrowIcon rotation={90} />} />
          </div>
        </div>
      </div>

      {/* Botón de salto derecho */}
      <div style={{ pointerEvents: 'auto' }}>
        <TouchButton
          label="Saltar"
          action="jump"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4L12 20M12 4L6 10M12 4L18 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
          }}
        />
      </div>
    </div>
  );
}
