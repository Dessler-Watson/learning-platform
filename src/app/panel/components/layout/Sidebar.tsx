'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  UserRound,
  LogOut,
  DoorOpen,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../utils';
import { usePanelStore } from '../../store/usePanelStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { audioManager } from '../../lib/audio';
import { useClickLock } from '../../hooks/useClickLock';

const navItems = [
  { label: 'Inicio', href: '/panel', icon: House, color: 'text-[#00A0B5]' },
  { label: 'Salas', href: '/panel/salas', icon: DoorOpen, color: 'text-emerald-500' },
  { label: 'Perfil', href: '/panel/perfil', icon: UserRound, color: 'text-[#EB5D70]' },
];

const adminNavItems = [
  { label: 'Administrar docentes', href: '/panel/admin/docentes', icon: ShieldCheck, color: 'text-[#FFA000]' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = usePanelStore((s) => s.sidebarOpen);
  const setSidebarOpen = usePanelStore((s) => s.setSidebarOpen);
  const logout = usePanelStore((s) => s.logout);
  const docente = usePanelStore((s) => s.docente);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const clickLock = useClickLock();

  const isAdmin = docente?.rol === 'admin';

  useEffect(() => {
    if (!isMobile && !isTablet) {
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet, setSidebarOpen]);

  const isActive = useCallback((href: string) =>
    href === '/panel' ? pathname === '/panel' : pathname.startsWith(href),
    [pathname]
  );

  const handleLogout = useCallback(() => {
    audioManager.onLogout();
    logout();
    router.push('/panel/login');
    router.refresh();
  }, [logout, router]);

  const handleNavClick = useCallback((href: string) => {
    audioManager.play('navigate');
    router.push(href);
    if (isMobile) setSidebarOpen(false);
  }, [router, isMobile, setSidebarOpen]);

  const showLabels = useMemo(() => isTablet ? false : sidebarOpen, [isTablet, sidebarOpen]);

  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push(...adminNavItems);
  }

  const content = useMemo(() => (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="relative z-10 flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-gray-100/60 px-5">
        <img src="/images/logo.png" alt="Logo" className="h-9 w-auto object-contain" draggable={false} />
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {allNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => { if (!clickLock()) return; handleNavClick(item.href); }}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                active
                  ? 'bg-white/80 text-[#00A0B5] shadow-md shadow-[#00A0B5]/10 border border-[#00A0B5]/20'
                  : 'text-gray-500 hover:bg-white/50 hover:text-foreground hover:shadow-sm'
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#00A0B5] to-[#98C54E]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                active
                  ? 'bg-[#00A0B5]/10'
                  : 'bg-transparent group-hover:bg-gray-100/60'
              )}>
                <item.icon className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors duration-200',
                  active ? 'text-[#00A0B5]' : item.color === 'text-[#FFA000]' ? 'text-[#FFA000]/70 group-hover:text-[#FFA000]' : 'text-gray-400 group-hover:text-foreground'
                )} />
              </div>
              <AnimatePresence mode="wait">
                {showLabels && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-gray-100/60 p-3 space-y-1">
        <button
          onClick={() => { if (!clickLock()) return; audioManager.play('delete'); handleLogout(); }}
          className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 text-rose-500 hover:bg-rose-50/60"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 group-hover:bg-rose-50/60">
            <LogOut className="h-[18px] w-[18px] shrink-0 transition-colors duration-200" />
          </div>
          <AnimatePresence mode="wait">
            {showLabels && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex-1 text-left"
              >
                Cerrar sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      </div>
    </div>
  ), [isActive, handleNavClick, handleLogout, showLabels, clickLock, isAdmin]);

  if (isMobile) {
    return (
      <>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-100/50 bg-white/85 shadow-2xl backdrop-blur-xl"
            >
              {content}
            </motion.aside>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (isTablet) {
    return (
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[74px] border-r border-gray-100/50 bg-white/80 backdrop-blur-xl transition-all duration-300 md:block"
      >
        {content}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden border-r border-gray-100/50 bg-white/80 backdrop-blur-xl transition-all duration-300 lg:block',
        sidebarOpen ? 'w-60' : 'w-[74px]'
      )}
    >
      {content}
    </aside>
  );
}
