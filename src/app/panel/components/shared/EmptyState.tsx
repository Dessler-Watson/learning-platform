'use client';

import { motion } from 'framer-motion';
import { CircleSlash2, LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  iconComponent?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = 'No hay resultados',
  description = 'Ajusta tu búsqueda o crea un nuevo elemento.',
  icon,
  iconComponent: IconComponent,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00A0B5]/10 to-[#EB5D70]/10 border border-[#00A0B5]/20">
        {icon ?? (IconComponent ? <IconComponent className="h-8 w-8 text-gray-300" /> : <CircleSlash2 className="h-8 w-8 text-gray-300" />)}
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-400 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
