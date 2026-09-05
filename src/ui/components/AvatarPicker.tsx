'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Avatar {
  id_avatar: number;
  nombre: string;
  imagen: string;
}

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
  compact?: boolean;
}

function imageUrl(imagen: string): string {
  const name = imagen.replace(/\.png$/i, '') || 'avatar1';
  return `/images/avatares/${name}.png`;
}

export function AvatarPicker({ selected, onSelect, compact }: AvatarPickerProps) {
  const [avatares, setAvatares] = useState<Avatar[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/avatares')
      .then(res => res.json())
      .then((data: Avatar[]) => {
        if (active && Array.isArray(data)) setAvatares(data);
      })
      .catch(() => {
        if (active) {
          setAvatares([
            { id_avatar: 1, nombre: 'Güegüense', imagen: 'gueguense.png' },
            { id_avatar: 2, nombre: 'León', imagen: 'leon.png' },
            { id_avatar: 3, nombre: 'Máscara', imagen: 'mascara.png' },
            { id_avatar: 4, nombre: 'Mariposa', imagen: 'mariposa.png' },
            { id_avatar: 5, nombre: 'Nacatamal', imagen: 'nacatamal.png' },
            { id_avatar: 6, nombre: 'Guardabarranco', imagen: 'guardabarranco.png' },
            { id_avatar: 7, nombre: 'Sacuanjoche', imagen: 'sacuanjoche.png' },
            { id_avatar: 8, nombre: 'Madroño', imagen: 'madrono.png' },
            { id_avatar: 9, nombre: 'Ideay', imagen: 'ideay.png' },
          ]);
        }
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3">
      {avatares.map(avatar => {
        const isSelected = avatar.id_avatar === selected;
        return (
          <motion.button
            key={avatar.id_avatar}
            type="button"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={() => onSelect(avatar.id_avatar)}
            aria-label={`Seleccionar avatar ${avatar.nombre}`}
            className="relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all"
            style={{
              background: isSelected ? '#E8F7FE' : '#FFFFFF',
              border: isSelected ? '3px solid #00A0B5' : '2px solid #F0E6D6',
              boxShadow: isSelected
                ? '0 6px 0 rgba(0,160,181,0.18), 0 8px 20px rgba(0,160,181,0.2)'
                : '0 4px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }}
          >
            <div
              className="overflow-hidden rounded-full"
              style={{
                width: compact ? 52 : 60,
                height: compact ? 52 : 60,
                background: '#fff7ef',
              }}
            >
              <img
                src={imageUrl(avatar.imagen)}
                alt={avatar.nombre}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
            <span
              className="text-center text-[11px] font-extrabold leading-tight"
              style={{ color: isSelected ? '#008A9D' : '#8A7A6A' }}
            >
              {avatar.nombre}
            </span>

            {isSelected && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-edu-blue text-white shadow-glow-edu-blue"
              >
                <Check size={12} strokeWidth={3} />
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
