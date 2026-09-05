'use client';

import { cn } from '../../utils';

interface AnimatedBackgroundProps {
  className?: string;
  variant?: 'default' | 'decisiones' | 'lava' | 'login';
}

type ShapeType = 'heart' | 'star' | 'sparkle' | 'circle' | 'spiral' | 'zap' | 'wave' | 'loop' | 'hex';

function ShapeSvg({ type, size, color }: { type: ShapeType; size: number; color: string }) {
  const s = size;
  const stroke = color;
  const fill = 'none';

  switch (type) {
    case 'heart':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M24 42l-2.1-1.9C10.8 30.6 4 24.3 4 16.5 4 10.1 9.1 5 15.5 5c3.7 0 7.3 1.7 9.5 4.5C27.2 6.7 30.8 5 34.5 5 40.9 5 46 10.1 46 16.5c0 7.8-6.8 14.1-17.9 23.6L24 42z" />
        </svg>
      );
    case 'star':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 4l4.5 13.5L42 19l-11 9.5L34.5 42 24 34 13.5 42l3.5-13.5L6 19l13.5-1.5L24 4z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={stroke} stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M24 4v12M24 32v12M4 24h12M32 24h12M10.3 10.3l8.5 8.5M29.2 29.2l8.5 8.5M10.3 37.7l8.5-8.5M29.2 18.8l8.5-8.5" />
        </svg>
      );
    case 'circle':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="24" cy="24" r="16" />
          <circle cx="24" cy="24" r="8" />
        </svg>
      );
    case 'spiral':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <path d="M24 24c0-8-6-10-10-6s-2 14 8 14c10 0 14-10 10-16s-14-6-18 2-2 18 10 20c12 2 18-10 14-18" />
        </svg>
      );
    case 'zap':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={stroke} stroke={stroke} strokeWidth="2" strokeLinejoin="round">
          <path d="M26 4L10 26h12l-4 18 18-22H24l6-18z" />
        </svg>
      );
    case 'wave':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 20c6-10 10-10 16 0s10 10 16 0" />
          <path d="M4 28c6-10 10-10 16 0s10 10 16 0" />
          <path d="M4 36c6-10 10-10 16 0s10 10 16 0" />
        </svg>
      );
    case 'loop':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 36c0-12 8-20 20-12" />
          <path d="M36 12c0 12-8 20-20 12" />
          <circle cx="36" cy="12" r="3.5" fill={stroke} />
          <circle cx="12" cy="36" r="3.5" fill={stroke} />
        </svg>
      );
    case 'hex':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" fill={fill} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M24 6l14.7 8.5v17L24 40 9.3 31.5v-17L24 6z" />
        </svg>
      );
    default:
      return null;
  }
}

function DoodleShape({
  type, size, color, opacity, animClass,
  top, left, right, bottom,
}: {
  type: ShapeType;
  size: number;
  color: string;
  opacity: number;
  animClass: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
}) {
  return (
    <div
      className={`panel-doodle ${animClass}`}
      style={{
        position: 'absolute',
        top: top ?? 'auto',
        left: left ?? 'auto',
        right: right ?? 'auto',
        bottom: bottom ?? 'auto',
        opacity,
      }}
    >
      <ShapeSvg type={type} size={size} color={color} />
    </div>
  );
}

export function AnimatedBackground({ className, variant = 'default' }: AnimatedBackgroundProps) {
  if (variant === 'lava') {
    return (
      <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
        <DoodleShape type="heart" size={46} color="#FF8C64" opacity={0.5} animClass="panel-doodle-a" top="7%" left="4%" />
        <DoodleShape type="star" size={38} color="#FFB488" opacity={0.55} animClass="panel-doodle-b" top="14%" right="7%" />
        <DoodleShape type="sparkle" size={30} color="#FFA000" opacity={0.5} animClass="panel-doodle-c" top="38%" left="9%" />
        <DoodleShape type="circle" size={42} color="#FF9464" opacity={0.45} animClass="panel-doodle-d" top="3%" right="24%" />
        <DoodleShape type="spiral" size={48} color="#FF6840" opacity={0.4} animClass="panel-doodle-e" bottom="18%" left="6%" />
        <DoodleShape type="zap" size={34} color="#FFB400" opacity={0.5} animClass="panel-doodle-f" bottom="9%" right="9%" />
        <DoodleShape type="wave" size={52} color="#FF8C64" opacity={0.38} animClass="panel-doodle-g" top="52%" right="3%" />
        <DoodleShape type="hex" size={36} color="#FF7043" opacity={0.42} animClass="panel-doodle-h" bottom="32%" right="20%" />
        <DoodleShape type="loop" size={40} color="#FFAB76" opacity={0.4} animClass="panel-doodle-i" top="68%" left="14%" />
        <DoodleShape type="heart" size={28} color="#FF6840" opacity={0.38} animClass="panel-doodle-j" bottom="5%" left="30%" />
        <DoodleShape type="star" size={26} color="#FFB488" opacity={0.42} animClass="panel-doodle-a" top="44%" left="2%" />
        <DoodleShape type="sparkle" size={24} color="#FFA000" opacity={0.42} animClass="panel-doodle-c" bottom="14%" right="30%" />
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
        <DoodleShape type="heart" size={52} color="#F4B6C4" opacity={0.5} animClass="panel-doodle-a" top="6%" left="6%" />
        <DoodleShape type="star" size={44} color="#FCD5A0" opacity={0.55} animClass="panel-doodle-b" top="12%" right="10%" />
        <DoodleShape type="sparkle" size={34} color="#FFB400" opacity={0.5} animClass="panel-doodle-c" top="30%" left="8%" />
        <DoodleShape type="circle" size={48} color="#B4E6F5" opacity={0.45} animClass="panel-doodle-d" top="4%" right="28%" />
        <DoodleShape type="spiral" size={54} color="#00A0B5" opacity={0.4} animClass="panel-doodle-e" bottom="22%" left="5%" />
        <DoodleShape type="zap" size={38} color="#FFB400" opacity={0.5} animClass="panel-doodle-f" bottom="8%" right="8%" />
        <DoodleShape type="wave" size={60} color="#F4B6C4" opacity={0.38} animClass="panel-doodle-g" top="50%" right="3%" />
        <DoodleShape type="hex" size={40} color="#00A0B5" opacity={0.42} animClass="panel-doodle-h" bottom="30%" right="18%" />
        <DoodleShape type="loop" size={46} color="#98C54E" opacity={0.4} animClass="panel-doodle-i" top="65%" left="12%" />
        <DoodleShape type="heart" size={32} color="#EB5D70" opacity={0.38} animClass="panel-doodle-j" bottom="3%" left="35%" />
        <DoodleShape type="star" size={30} color="#FCD5A0" opacity={0.42} animClass="panel-doodle-a" top="42%" left="2%" />
        <DoodleShape type="sparkle" size={28} color="#FFA000" opacity={0.42} animClass="panel-doodle-c" bottom="12%" right="32%" />
      </div>
    );
  }

  return (
    <div className={cn('pointer-events-none fixed inset-0 overflow-hidden z-[-1]', className)}>
      <DoodleShape type="heart" size={48} color="#F4B6C4" opacity={0.55} animClass="panel-doodle-a" top="8%" left="5%" />
      <DoodleShape type="star" size={40} color="#FCD5A0" opacity={0.6} animClass="panel-doodle-b" top="15%" right="8%" />
      <DoodleShape type="sparkle" size={32} color="#FFB400" opacity={0.5} animClass="panel-doodle-c" top="35%" left="10%" />
      <DoodleShape type="circle" size={44} color="#B4E6F5" opacity={0.5} animClass="panel-doodle-d" top="5%" right="25%" />
      <DoodleShape type="spiral" size={50} color="#00A0B5" opacity={0.4} animClass="panel-doodle-e" bottom="20%" left="7%" />
      <DoodleShape type="zap" size={36} color="#FFB400" opacity={0.5} animClass="panel-doodle-f" bottom="10%" right="10%" />
      <DoodleShape type="wave" size={56} color="#F4B6C4" opacity={0.4} animClass="panel-doodle-g" top="55%" right="4%" />
      <DoodleShape type="hex" size={38} color="#00A0B5" opacity={0.45} animClass="panel-doodle-h" bottom="35%" right="20%" />
      <DoodleShape type="loop" size={42} color="#98C54E" opacity={0.45} animClass="panel-doodle-i" top="70%" left="15%" />
      <DoodleShape type="heart" size={30} color="#EB5D70" opacity={0.4} animClass="panel-doodle-j" bottom="5%" left="30%" />
      <DoodleShape type="star" size={28} color="#FCD5A0" opacity={0.45} animClass="panel-doodle-a" top="45%" left="3%" />
      <DoodleShape type="sparkle" size={26} color="#FFA000" opacity={0.45} animClass="panel-doodle-c" bottom="15%" right="30%" />
    </div>
  );
}
