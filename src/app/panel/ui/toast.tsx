'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '../utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500" />,
    info: <Info className="h-4 w-4 text-[#00A0B5]" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50',
    error: 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50',
    info: 'border-[#00A0B5]/30 bg-gradient-to-r from-[#00A0B5]/5 to-[#98C54E]/5',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lg min-w-[250px] max-w-[350px]',
                bgColors[t.type]
              )}
            >
              {icons[t.type]}
              <span className="flex-1 text-sm font-medium text-foreground">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
