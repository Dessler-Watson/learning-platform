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
  primary: { background: 'linear-gradient(135deg, #EB5D70, #EB5D70)' },
  secondary: { background: 'linear-gradient(135deg, #00A0B5, #008A9D)' },
  reward: { background: 'linear-gradient(135deg, #FFEF5A, #E5D94A)' },
  achievement: { background: 'linear-gradient(135deg, #FFF5A8, #FFEF5A)' },
  success: { background: 'linear-gradient(135deg, #98C54E, #6B9832)' },
  danger: { background: 'linear-gradient(135deg, #EB5D70, #C94A5A)' },
  ghost: { background: 'rgba(0, 160, 181, 0.08)' },
  outline: { background: 'transparent', border: '2px solid #F0E6D6' },
};

const variantShadow: Record<Variant, string> = {
  primary: '0 4px 16px rgba(244, 120, 176, 0.35)',
  secondary: '0 4px 16px rgba(0, 160, 181, 0.35)',
  reward: '0 4px 16px rgba(255, 239, 90, 0.4)',
  achievement: '0 4px 16px rgba(255, 245, 168, 0.5)',
  success: '0 4px 16px rgba(152, 197, 78, 0.35)',
  danger: '0 4px 16px rgba(235, 93, 112, 0.35)',
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
