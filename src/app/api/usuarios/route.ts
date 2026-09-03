import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/data';

interface Usuario { id_usuario: number; avatar_id: number; nombre: string; apellido?: string; correo: string; rol: string; estado: string; fecha_registro: string; }
interface Avatar { id_avatar: number; nombre: string; }

export async function GET(req: NextRequest) {
  const usuarios = readData<Usuario>('usuarios');
  const avatares = readData<Avatar>('avatares');

  const { searchParams } = new URL(req.url);
  const rol = searchParams.get('rol');
  const estado = searchParams.get('estado');

  let result = usuarios.map(u => ({
    id_usuario: u.id_usuario,
    avatar_id: u.avatar_id,
    nombre: u.nombre,
    apellido: u.apellido || '',
    correo: u.correo,
    rol: u.rol,
    estado: u.estado,
    fecha_registro: u.fecha_registro,
    avatar_nombre: avatares.find(a => a.id_avatar === u.avatar_id)?.nombre || null,
  }));

  if (rol) result = result.filter(u => u.rol === rol);
  if (estado) result = result.filter(u => u.estado === estado);

  return NextResponse.json(result);
}
