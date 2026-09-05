'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastData { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; }

let addToastFn: ((t: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastData['type'] = 'info') {
  addToastFn?.({ message, type });
}

const icons: Record<ToastData['type'], React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
};

const colors: Record<ToastData['type'], string> = {
  success: '#98C54E',
  error: '#EB5D70',
  info: '#00A0B5',
  warning: '#FFA000',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3000);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg"
            style={{ background: colors[t.type] }}
          >
            {icons[t.type]} {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
