import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffH < 24) return `Hace ${diffH}h`;
  if (diffD < 7) return `Hace ${diffD}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const ESTADO_SALA_COLOR: Record<string, string> = {
  esperando: 'bg-amber-50 text-amber-600 border border-amber-200',
  en_curso: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  finalizada: 'bg-gray-50 text-gray-400 border border-gray-200',
};

export const ESTADO_SALA_LABEL: Record<string, string> = {
  esperando: 'Esperando',
  en_curso: 'En curso',
  finalizada: 'Finalizada',
};
