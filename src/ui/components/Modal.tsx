'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="relative bg-white rounded-2xl shadow-xl p-6 max-w-md w-11/12 z-10"
          >
            {title && (
              <h3 className="text-lg font-extrabold text-neutral-900 mb-4">{title}</h3>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface DialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({ open, title, message, confirmText = 'Aceptar', cancelText = 'Cancelar', onConfirm, onCancel }: DialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-neutral-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-200 font-bold text-neutral-600 hover:bg-neutral-50 transition-colors">
          {cancelText}
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors">
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
