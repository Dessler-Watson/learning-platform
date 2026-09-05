export const AVATARES = [
  { id_avatar: 1, nombre: 'Güegüense', imagen: 'gueguense.png' },
  { id_avatar: 2, nombre: 'León', imagen: 'leon.png' },
  { id_avatar: 3, nombre: 'Máscara', imagen: 'mascara.png' },
  { id_avatar: 4, nombre: 'Mariposa', imagen: 'mariposa.png' },
  { id_avatar: 5, nombre: 'Nacatamal', imagen: 'nacatamal.png' },
  { id_avatar: 6, nombre: 'Guardabarranco', imagen: 'guardabarranco.png' },
  { id_avatar: 7, nombre: 'Sacuanjoche', imagen: 'sacuanjoche.png' },
  { id_avatar: 8, nombre: 'Madroño', imagen: 'madrono.png' },
  { id_avatar: 9, nombre: 'Ideay', imagen: 'ideay.png' },
] as const;

export function avatarImagen(id: number): string {
  const n = AVATARES.length;
  const idx = ((id - 1) % n + n) % n;
  return AVATARES[idx].imagen;
}

export function avatarUrl(id: number): string {
  return `/images/avatares/${avatarImagen(id)}`;
}