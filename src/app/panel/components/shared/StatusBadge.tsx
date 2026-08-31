import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

interface StatusBadgeProps {
  label: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function StatusBadge({ label, className, icon: Icon, iconClassName }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize',
        className
      )}
    >
      {Icon && <Icon className={cn('h-3.5 w-3.5', iconClassName)} />}
      {label}
    </span>
  );
}
