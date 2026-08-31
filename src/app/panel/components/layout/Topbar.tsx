'use client';

import { useMemo, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '../../ui/button';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { SoundToggle } from '../shared/SoundToggle';
import { usePanelStore } from '../../store/usePanelStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { audioManager } from '../../lib/audio';
import { getInitials } from '../../utils';
import { useClickLock } from '../../hooks/useClickLock';

const NAV_ITEMS = [
  { label: 'Inicio', href: '/panel' },
  { label: 'Salas', href: '/panel/salas' },
  { label: 'Perfil', href: '/panel/perfil' },
  { label: 'Administrar docentes', href: '/panel/admin/docentes' },
];

export function Topbar() {
  const pathname = usePathname();
  const docente = usePanelStore((s) => s.docente);
  const toggleSidebar = usePanelStore((s) => s.toggleSidebar);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const clickLock = useClickLock();

  const current = useMemo(() => NAV_ITEMS.find((item) =>
    item.href === '/panel' ? pathname === '/panel' : pathname.startsWith(item.href)
  ), [pathname]);

  const handleToggle = useCallback(() => {
    audioManager.play('toggle');
    toggleSidebar();
  }, [toggleSidebar]);

  const docenteNombre = docente?.nombre;
  const docenteRol = docente?.rol === 'admin' ? 'Administrador' : 'Docente';
  const initials = useMemo(() => docenteNombre ? getInitials(docenteNombre) : '?', [docenteNombre]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-cyan-100/40 bg-white/70 px-4 backdrop-blur-xl sm:px-6 md:px-8 topbar-gradient-line">
      {isMobile && (
        <Button variant="ghost" size="icon" onClick={() => { if (!clickLock()) return; handleToggle(); }} aria-label="Abrir menú" className="shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
      )}

      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold tracking-tight text-foreground">{current?.label ?? 'EDUPLAY'}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <SoundToggle />

        <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-all duration-200 hover:shadow-md">
          <Avatar className="h-8 w-8 ring-2 ring-cyan-200">
            <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-cyan-500 text-xs font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-foreground">{docenteNombre ?? 'Docente'}</p>
            <p className="text-xs leading-tight text-gray-400">{docenteRol ?? 'Docente'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
