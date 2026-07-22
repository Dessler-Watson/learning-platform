'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ToastData { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; }

let addToastFn: ((t: Omit<ToastData, 'id'>) => void) | null = null;

export function toast(message: string, type: ToastData['type'] = 'info') {
  addToastFn?.({ message, type });
}

const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-accent-500', warning: 'bg-yellow-500' };

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
            className={`${colors[t.type]} text-white px-5 py-3 rounded-2xl shadow-lg font-bold text-sm flex items-center gap-2`}
          >
            {icons[t.type]} {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
