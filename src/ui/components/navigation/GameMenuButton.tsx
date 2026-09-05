'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home, X } from 'lucide-react';

export function GameMenuButton() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.25)' }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        className="fixed right-3.5 top-3.5 z-[100] flex h-11 w-11 items-center justify-center rounded-xl border-none bg-white/10 text-white backdrop-blur-md"
        style={{ fontSize: 20 }}
      >
        <Menu size={22} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setConfirm(false); }}
              className="fixed inset-0 z-[99] bg-black/40"
            />
            <motion.div
              initial={{ x: 280 }}
              animate={{ x: 0 }}
              exit={{ x: 280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed bottom-0 right-0 top-0 z-[100] flex w-64 flex-col gap-3 border-l border-white/5 bg-surface-900/95 p-5 pt-16 backdrop-blur-xl"
            >
              <button
                onClick={() => setConfirm(true)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3.5 text-left text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                <Home size={18} /> Volver al menu
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-[88%] max-w-sm rounded-[22px] border border-white/5 bg-surface-900/95 p-6 text-center"
            >
              <p className="mb-5 text-base font-bold text-white">Deseas salir de la partida?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirm(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-transparent py-3 text-sm font-semibold text-surface-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => { window.location.href = '/inicio'; }}
                  className="flex-1 rounded-xl bg-edu-pink py-3 text-sm font-bold text-white"
                >
                  Salir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
