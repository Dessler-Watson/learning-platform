'use client';

import { readUserJson, writeUserJson, removeUserKey } from '@/shared/lib/userStorage';

const BASE = 'eduplay_custom_avatar';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 512;

export function getCustomAvatar(): string | null {
  const v = readUserJson<string | null>(BASE, null);
  return typeof v === 'string' && v.startsWith('data:image') ? v : null;
}

export function setCustomAvatar(dataUrl: string): void {
  writeUserJson(BASE, dataUrl);
}

export function clearCustomAvatar(): void {
  removeUserKey(BASE);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

/** WhatsApp-style: center-crop to square, resize, compress to JPEG data URL. */
export async function processAvatarFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('La imagen no puede superar los 10 MB');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    img,
    (img.width - side) / 2,
    (img.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  return canvas.toDataURL('image/jpeg', 0.82);
}
