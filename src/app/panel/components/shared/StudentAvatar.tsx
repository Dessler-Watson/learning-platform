'use client';

import { avatarUrl } from '@/lib/avatares';
import { getLeagueByStars } from '@/lib/leagues';

interface StudentAvatarProps {
  nombre: string;
  avatar_id?: number;
  estrellas?: number;
  size?: 'sm' | 'md' | 'lg';
  eliminado?: boolean;
  esLava?: boolean;
  children?: React.ReactNode;
}

const SIZES = {
  sm: { container: 'h-8 w-8', img: 'h-8 w-8', badge: 'h-5 w-5', text: 'text-xs' },
  md: { container: 'h-10 w-10', img: 'h-10 w-10', badge: 'h-6 w-6', text: 'text-sm' },
  lg: { container: 'h-14 w-14', img: 'h-14 w-14', badge: 'h-8 w-8', text: 'text-lg' },
};

export function StudentAvatar({ nombre, avatar_id, estrellas = 0, size = 'md', eliminado = false, esLava = false }: StudentAvatarProps) {
  const s = SIZES[size];
  const initial = nombre.charAt(0);
  const league = getLeagueByStars(estrellas);

  if (eliminado) {
    return (
      <div className={`${s.container} relative shrink-0`}>
        <div className={`flex ${s.container} items-center justify-center rounded-full bg-red-100 text-red-500 font-bold ${s.text}`}>
          <svg className="h-1/2 w-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.container} relative shrink-0`}>
      {avatar_id ? (
        <img
          src={avatarUrl(avatar_id)}
          alt={nombre}
          draggable={false}
          className={`${s.img} rounded-full object-cover`}
          style={{ background: '#fff7ef' }}
        />
      ) : (
        <div className={`flex ${s.container} items-center justify-center rounded-full font-bold text-white shadow-sm ${
          esLava ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-[#00A0B5] to-[#98C54E]'
        } ${s.text}`}>
          {initial}
        </div>
      )}
      {estrellas > 0 && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${s.badge} overflow-hidden rounded-full border-2 border-white bg-black flex items-center justify-center`}>
          <img
            src={league.image}
            alt={league.fullName}
            draggable={false}
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
