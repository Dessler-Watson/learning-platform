'use client';

import { readUserJson, writeUserJson, removeUserKey, getCurrentUser } from '@/shared/lib/userStorage';

const BASE = 'eduplay_custom_avatar';
const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 512;

function isDataImage(v: unknown): v is string {
  return typeof v === 'string' && v.startsWith('data:image');
}

export function getCustomAvatar(): string | null {
  const v = readUserJson<string | null>(BASE, null);
  if (isDataImage(v)) return v;
  // Fallback: foto sincronizada con la cuenta (login / perfil), p.ej. en otro dispositivo.
  const cuenta = getCurrentUser()?.custom_avatar;
  return isDataImage(cuenta) ? cuenta : null;
}

export function setCustomAvatar(dataUrl: string): void {
  writeUserJson(BASE, dataUrl);
}

export function clearCustomAvatar(): void {
  removeUserKey(BASE);
}

/** Marca en eduplay_user que la foto local ya está guardada en la cuenta (o se limpió). */
export function rememberCustomAvatarSync(dataUrl: string | null): void {
  try {
    const raw = localStorage.getItem('eduplay_user');
    if (!raw) return;
    localStorage.setItem('eduplay_user', JSON.stringify({ ...JSON.parse(raw), custom_avatar: dataUrl }));
  } catch { /* ignore */ }
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
