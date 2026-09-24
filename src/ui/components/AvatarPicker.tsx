'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera } from 'lucide-react';
import { processAvatarFile } from '@/lib/custom-avatar';

export interface Avatar {
  id_avatar: number;
  nombre: string;
  imagen: string;
}

interface AvatarPickerProps {
  selected: number;
  onSelect: (id: number) => void;
  compact?: boolean;
  customPhoto?: string | null;
  customSelected?: boolean;
  onCustomSelect?: () => void;
  onUpload?: (dataUrl: string) => void;
}

function imageUrl(imagen: string): string {
  const name = imagen.replace(/\.png$/i, '') || 'avatar1';
  return `/images/avatares/${name}.png`;
}

export function AvatarPicker({
  selected,
  onSelect,
  compact,
  customPhoto,
  customSelected,
  onCustomSelect,
  onUpload,
}: AvatarPickerProps) {
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            { id_avatar: 10, nombre: 'presion', imagen: 'presion.png' },
            { id_avatar: 11, nombre: 'abismo', imagen: 'abismo.png' },
            { id_avatar: 12, nombre: 'rumbo', imagen: 'rumbo.png' },
            { id_avatar: 13, nombre: 'pantano', imagen: 'pantano.png' },
          ]);
        }
      });
    return () => { active = false; };
  }, []);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const dataUrl = await processAvatarFile(file);
      onUpload?.(dataUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tileSize = compact ? 52 : 60;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {onUpload && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Subir foto desde tu dispositivo"
            className="relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all disabled:opacity-60"
            style={{
              background: '#FFFFFF',
              border: '2px dashed #00A0B555',
              boxShadow: '0 4px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }}
          >
            <div
              className="flex items-center justify-center rounded-full text-[#00A0B5]"
              style={{
                width: tileSize,
                height: tileSize,
                background: '#E8F7FE',
              }}
            >
              <Camera size={compact ? 20 : 24} />
            </div>
            <span className="text-center text-[11px] font-extrabold leading-tight text-[#008A9D]">
              {uploading ? 'Procesando...' : 'Subir foto'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </motion.button>
        )}

        {customPhoto && onCustomSelect && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.95, y: 2 }}
            onClick={onCustomSelect}
            aria-label="Seleccionar mi foto personalizada"
            className="relative flex flex-col items-center gap-2 rounded-2xl p-3 transition-all"
            style={{
              background: customSelected ? '#E8F7FE' : '#FFFFFF',
              border: customSelected ? '3px solid #00A0B5' : '2px solid #F0E6D6',
              boxShadow: customSelected
                ? '0 6px 0 rgba(0,160,181,0.18), 0 8px 20px rgba(0,160,181,0.2)'
                : '0 4px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
              cursor: 'pointer',
            }}
          >
            <div
              className="overflow-hidden rounded-full"
              style={{
                width: tileSize,
                height: tileSize,
                background: '#fff7ef',
              }}
            >
              <img
                src={customPhoto}
                alt="Mi foto"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
            <span
              className="text-center text-[11px] font-extrabold leading-tight"
              style={{ color: customSelected ? '#008A9D' : '#8A7A6A' }}
            >
              Mi foto
            </span>
            {customSelected && (
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
        )}

        {avatares.map(avatar => {
          const isSelected = avatar.id_avatar === selected && !customSelected;
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

      {uploadError && (
        <p className="mt-2 text-center text-[11px] font-black text-edu-pink">{uploadError}</p>
      )}
    </div>
  );
}
