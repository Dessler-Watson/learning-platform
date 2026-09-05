'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { usePanelStore } from '../../store/usePanelStore';
import { audioManager } from '../../lib/audio';
import { cn } from '../../utils';
import { ToastProvider } from '../../ui/toast';
import { AnimatedBackground } from '../shared/AnimatedBackground';

export function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = usePanelStore((s) => s.isAuthenticated);
  const docente = usePanelStore((s) => s.docente);
  const sidebarOpen = usePanelStore((s) => s.sidebarOpen);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const publicPaths = ['/panel/login', '/panel/register'];
  const isPublicPage = publicPaths.some((p) => pathname === p);
  const isAdminRoute = pathname.startsWith('/panel/admin');
  const isAdmin = docente?.rol === 'admin';

  useEffect(() => {
    if (!isAuthenticated && !isPublicPage) {
      router.push('/panel/login');
    }
  }, [isAuthenticated, isPublicPage, router]);

  useEffect(() => {
    if (isAuthenticated && isAdminRoute && !isAdmin) {
      router.push('/panel');
    }
  }, [isAuthenticated, isAdminRoute, isAdmin, router]);

  useEffect(() => {
    if (hydrated && isAuthenticated && isPublicPage) {
      router.replace('/panel');
    }
  }, [hydrated, isAuthenticated, isPublicPage, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const t1 = setTimeout(() => {
      audioManager.playWelcome();
      audioManager.startAmbient();
    }, 800);

    return () => clearTimeout(t1);
  }, [isAuthenticated]);

  if (!hydrated) {
    if (isPublicPage) {
      return <>{children}</>;
    }
    return null;
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isAdminRoute && !isAdmin) {
    return null;
  }

  return (
    <ToastProvider>
      <div className="relative h-screen overflow-hidden">
        <AnimatedBackground variant="default" />
        <Sidebar />
        <div className={cn('relative z-10 flex h-full flex-col transition-all duration-300 md:pl-[74px] lg:pl-[74px]', sidebarOpen && 'lg:pl-60')}>
          <Topbar />
          <main className="main-scroll relative flex-1 overflow-y-auto" style={{ isolation: 'isolate' }}>
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
