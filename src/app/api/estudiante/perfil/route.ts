import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data';

interface Usuario {
  id_usuario: number;
  avatar_id: number;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: string;
  estado: string;
  fecha_registro: string;
}

interface Avatar {
  id_avatar: number;
  nombre: string;
  imagen: string;
}

interface Resultado {
  id_resultado: number;
  partida_id: number;
  usuario_id: number;
  puntaje: number;
  copas: number;
  posicion: number;
  correctas: number;
  incorrectas: number;
}

const RANGOS = [
  { nombre: 'Bronce', min: 0, max: 999, color: '#B87333', barColor: 'linear-gradient(90deg, #B87333, #CD7F32)', next: 'Plata' },
  { nombre: 'Plata', min: 1000, max: 2499, color: '#94A3B8', barColor: 'linear-gradient(90deg, #94A3B8, #CBD5E1)', next: 'Oro' },
  { nombre: 'Oro', min: 2500, max: 4999, color: '#FDDB33', barColor: 'linear-gradient(90deg, #FDDB33, #FDF293)', next: 'Diamante' },
  { nombre: 'Diamante', min: 5000, max: Infinity, color: '#30BCE6', barColor: 'linear-gradient(90deg, #30BCE6, #4DC8D8)', next: null },
];

function getRango(puntos: number) {
  return RANGOS.find(r => puntos >= r.min && puntos <= r.max) || RANGOS[RANGOS.length - 1];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const usuarioId = Number(searchParams.get('usuario_id'));

  if (!usuarioId) {
    return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });
  }

  const usuarios = readData<Usuario>('usuarios');
  const avatares = readData<Avatar>('avatares');
  const resultados = readData<Resultado>('resultados');

  const usuario = usuarios.find(u => u.id_usuario === usuarioId);

  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const avatar = avatares.find(a => a.id_avatar === usuario.avatar_id);
  const puntos = resultados
    .filter(r => r.usuario_id === usuarioId)
    .reduce((sum, r) => sum + (r.puntaje || 0), 0);

  const rango = getRango(puntos);
  const esMaximo = rango.next === null;
  const puntosRangoActual = Math.max(0, puntos - rango.min);
  const puntosParaSiguiente = esMaximo ? 0 : rango.max + 1 - puntos;
  const progreso = esMaximo
    ? 100
    : Math.min(100, Math.round((puntosRangoActual / (rango.max - rango.min + 1)) * 100));

  return NextResponse.json({
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido || '',
      correo: usuario.correo,
      rol: usuario.rol,
      fecha_registro: usuario.fecha_registro,
      avatar: {
        id_avatar: avatar?.id_avatar || usuario.avatar_id,
        nombre: avatar?.nombre || 'Güegüense',
        imagen: avatar?.imagen || 'gueguense.png',
      },
    },
    puntos,
    rango: {
      nombre: rango.nombre,
      color: rango.color,
      barColor: rango.barColor,
      esMaximo,
      progreso,
      puntosRangoActual,
      puntosParaSiguiente,
      siguiente: rango.next,
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const usuarioId = Number(body.usuario_id);
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : undefined;
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : undefined;
    const avatarId = body.avatar_id !== undefined ? Number(body.avatar_id) : NaN;

    if (!usuarioId) {
      return NextResponse.json({ error: 'usuario_id requerido' }, { status: 400 });
    }

    const usuarios = readData<Usuario>('usuarios');
    const usuario = usuarios.find(u => u.id_usuario === usuarioId);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (nombre) usuario.nombre = nombre;
    if (apellido) usuario.apellido = apellido;

    const avatares = readData<Avatar>('avatares');
    if (!Number.isNaN(avatarId)) {
      const existe = avatares.some(a => a.id_avatar === avatarId);
      if (!existe) {
        return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 400 });
      }
      usuario.avatar_id = avatarId;
    }

    writeData('usuarios', usuarios);

    const avatar = avatares.find(a => a.id_avatar === usuario.avatar_id);

    return NextResponse.json({
      success: true,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido || '',
        correo: usuario.correo,
        avatar: {
          id_avatar: avatar?.id_avatar || usuario.avatar_id,
          nombre: avatar?.nombre || 'Güegüense',
imagen: avatar?.imagen || 'gueguense.png',
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al guardar los cambios' }, { status: 500 });
  }
}
