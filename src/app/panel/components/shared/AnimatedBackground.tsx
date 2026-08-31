'use client';

import { cn } from '../../utils';

interface AnimatedBackgroundProps {
  className?: string;
  variant?: 'default' | 'decisiones' | 'lava' | 'login';
}

export function AnimatedBackground({ className, variant = 'default' }: AnimatedBackgroundProps) {
  if (variant === 'lava') {
    return (
      <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
        {/* Top-left: warm orange circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_22s_ease-in-out_infinite]"
          style={{
            top: '-5%',
            left: '-4%',
            width: '300px',
            height: '300px',
            background: 'rgba(255, 180, 130, 0.35)',
          }}
        />
        {/* Bottom-left: soft red circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_28s_ease-in-out_infinite_reverse]"
          style={{
            bottom: '10%',
            left: '3%',
            width: '260px',
            height: '260px',
            background: 'rgba(255, 140, 100, 0.3)',
          }}
        />
        {/* Bottom-left second: lighter orange */}
        <div
          className="absolute rounded-full animate-[blob-drift_24s_ease-in-out_infinite_2s]"
          style={{
            bottom: '22%',
            left: '-1%',
            width: '200px',
            height: '200px',
            background: 'rgba(255, 200, 160, 0.32)',
          }}
        />
        {/* Right side upper: warm peach circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_30s_ease-in-out_infinite_5s]"
          style={{
            top: '2%',
            right: '-5%',
            width: '320px',
            height: '320px',
            background: 'rgba(255, 170, 120, 0.32)',
          }}
        />
        {/* Right side lower: pinkish-orange circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_26s_ease-in-out_infinite_3s]"
          style={{
            bottom: '8%',
            right: '5%',
            width: '250px',
            height: '250px',
            background: 'rgba(255, 160, 130, 0.28)',
          }}
        />
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
        {/* Top-left: large pink circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_20s_ease-in-out_infinite]"
          style={{
            top: '-5%',
            left: '-4%',
            width: '320px',
            height: '320px',
            background: 'rgba(244, 182, 196, 0.35)',
          }}
        />
        {/* Bottom-left: two overlapping yellow circles */}
        <div
          className="absolute rounded-full animate-[blob-drift_26s_ease-in-out_infinite_reverse]"
          style={{
            bottom: '8%',
            left: '2%',
            width: '240px',
            height: '240px',
            background: 'rgba(252, 229, 160, 0.4)',
          }}
        />
        <div
          className="absolute rounded-full animate-[blob-drift_22s_ease-in-out_infinite_4s]"
          style={{
            bottom: '20%',
            left: '-2%',
            width: '200px',
            height: '200px',
            background: 'rgba(252, 229, 160, 0.35)',
          }}
        />
        {/* Right side upper: large blue circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_28s_ease-in-out_infinite_2s]"
          style={{
            top: '5%',
            right: '-6%',
            width: '340px',
            height: '340px',
            background: 'rgba(180, 230, 245, 0.4)',
          }}
        />
        {/* Right side lower: pink circle */}
        <div
          className="absolute rounded-full animate-[blob-drift_24s_ease-in-out_infinite]"
          style={{
            bottom: '12%',
            right: '2%',
            width: '240px',
            height: '240px',
            background: 'rgba(244, 182, 196, 0.3)',
          }}
        />
        {/* Center-bottom: smaller pink circle behind form */}
        <div
          className="absolute rounded-full animate-[blob-drift_30s_ease-in-out_infinite_3s]"
          style={{
            bottom: '15%',
            left: '35%',
            width: '200px',
            height: '200px',
            background: 'rgba(248, 200, 210, 0.28)',
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
      {/* Top-left: large pink circle */}
      <div
        className="absolute rounded-full animate-[blob-drift_22s_ease-in-out_infinite]"
        style={{
          top: '-5%',
          left: '-4%',
          width: '300px',
          height: '300px',
          background: 'rgba(244, 182, 196, 0.35)',
        }}
      />
      {/* Bottom-left: yellow circle */}
      <div
        className="absolute rounded-full animate-[blob-drift_28s_ease-in-out_infinite_reverse]"
        style={{
          bottom: '10%',
          left: '3%',
          width: '260px',
          height: '260px',
          background: 'rgba(252, 229, 160, 0.38)',
        }}
      />
      {/* Bottom-left second: smaller yellow */}
      <div
        className="absolute rounded-full animate-[blob-drift_24s_ease-in-out_infinite_2s]"
        style={{
          bottom: '22%',
          left: '-1%',
          width: '200px',
          height: '200px',
          background: 'rgba(252, 229, 160, 0.32)',
        }}
      />
      {/* Right side upper: large blue circle */}
      <div
        className="absolute rounded-full animate-[blob-drift_30s_ease-in-out_infinite_5s]"
        style={{
          top: '2%',
          right: '-5%',
          width: '320px',
          height: '320px',
          background: 'rgba(180, 230, 245, 0.38)',
        }}
      />
      {/* Right side lower: pink circle */}
      <div
        className="absolute rounded-full animate-[blob-drift_26s_ease-in-out_infinite_3s]"
        style={{
          bottom: '8%',
          right: '5%',
          width: '250px',
          height: '250px',
          background: 'rgba(244, 182, 196, 0.32)',
        }}
      />
    </div>
  );
}
