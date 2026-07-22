'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode;
  fullWidth?: boolean; disabled?: boolean; onClick?: () => void;
  className?: string; children: ReactNode; type?: 'button' | 'submit';
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-md shadow-secondary-500/25',
  accent: 'bg-accent-400 hover:bg-accent-500 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  error: 'bg-red-500 hover:bg-red-600 text-white',
  ghost: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
  outline: 'border-2 border-white/20 hover:border-white/40 text-white',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-base gap-2 rounded-xl',
  lg: 'px-6 py-3.5 text-lg gap-2.5 rounded-2xl',
  xl: 'px-8 py-4 text-xl gap-3 rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, fullWidth, disabled, onClick, className = '', children, type = 'button' }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      className={`inline-flex items-center justify-center font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
      style={{ width: dim, height: dim }}
      className={`inline-flex items-center justify-center font-bold transition-colors disabled:opacity-40 ${variants[variant]} rounded-xl ${className}`}
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
