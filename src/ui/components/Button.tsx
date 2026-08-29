'use client';

import { motion } from 'framer-motion';
import { ReactNode, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'reward' | 'achievement' | 'danger' | 'success' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode;
  fullWidth?: boolean; disabled?: boolean; onClick?: () => void;
  className?: string; children: ReactNode; type?: 'button' | 'submit';
}

const variantStyles: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  reward: 'text-surface-800',
  achievement: 'text-surface-800',
  success: 'text-white',
  danger: 'text-white',
  ghost: 'text-surface-700 hover:bg-surface-100',
  outline: 'text-surface-700',
};

const variantBg: Record<Variant, CSSProperties> = {
  primary: { background: 'linear-gradient(135deg, #F087A9, #D96B91)' },
  secondary: { background: 'linear-gradient(135deg, #30BCE6, #1A9FCC)' },
  reward: { background: 'linear-gradient(135deg, #FDDB33, #E5C52E)' },
  achievement: { background: 'linear-gradient(135deg, #FDF293, #FDDB33)' },
  success: { background: 'linear-gradient(135deg, #4CAF50, #388E3C)' },
  danger: { background: 'linear-gradient(135deg, #E94930, #C93A24)' },
  ghost: { background: 'rgba(48, 188, 230, 0.08)' },
  outline: { background: 'transparent', border: '2px solid #E4EAF4' },
};

const variantShadow: Record<Variant, string> = {
  primary: '0 4px 16px rgba(240, 135, 169, 0.35)',
  secondary: '0 4px 16px rgba(48, 188, 230, 0.35)',
  reward: '0 4px 16px rgba(253, 219, 51, 0.4)',
  achievement: '0 4px 16px rgba(253, 242, 147, 0.5)',
  success: '0 4px 16px rgba(76, 175, 80, 0.35)',
  danger: '0 4px 16px rgba(233, 73, 48, 0.35)',
  ghost: 'none',
  outline: 'none',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
  md: 'px-5 py-2.5 text-base gap-2 rounded-2xl',
  lg: 'px-6 py-3.5 text-lg gap-2.5 rounded-2xl',
  xl: 'px-8 py-4 text-xl gap-3 rounded-3xl',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, disabled, onClick, className = '', children, type = 'button' }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.04, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      style={{ ...variantBg[variant], boxShadow: variantShadow[variant] }}
      className={`inline-flex items-center justify-center font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </motion.button>
  );
}

export function IconButton({ variant = 'ghost', size = 'md', className = '', onClick, disabled, children }: Omit<ButtonProps, 'fullWidth' | 'icon' | 'loading'> & { children: ReactNode }) {
  const dim = { sm: 36, md: 44, lg: 52, xl: 60 }[size];
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      style={{ width: dim, height: dim, ...variantBg[variant] }}
      className={`inline-flex items-center justify-center font-bold transition-colors disabled:opacity-40 ${variantStyles[variant]} rounded-2xl ${className}`}
    />
  );
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
    />
  );
}
