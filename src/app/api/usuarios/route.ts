import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, getNextId } from '@/lib/data';

interface Usuario { id_usuario: number; avatar_id: number; nombre: string; apellido?: string; correo: string; rol: string; estado: string; fecha_registro: string; fecha_nacimiento?: string; sexo?: string; }
interface Avatar { id_avatar: number; nombre: string; imagen: string; }

function calcularEdad(fechaISO: string): number {
  const nac = new Date(`${fechaISO}T00:00:00`);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const mes = hoy.getMonth() - nac.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

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
    fecha_nacimiento: u.fecha_nacimiento || null,
    sexo: u.sexo || null,
    avatar_nombre: avatares.find(a => a.id_avatar === u.avatar_id)?.nombre || null,
  }));

  if (rol) result = result.filter(u => u.rol === rol);
  if (estado) result = result.filter(u => u.estado === estado);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const apellido = typeof body.apellido === 'string' ? body.apellido.trim() : '';
    const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase() : '';
    const avatarId = Number(body.avatar_id) || 1;
    const fechaNacimiento = typeof body.fecha_nacimiento === 'string' ? body.fecha_nacimiento.trim() : '';
    const sexo = typeof body.sexo === 'string' ? body.sexo.trim().toLowerCase() : '';

    if (!nombre || !apellido || !correo) {
      return NextResponse.json({ error: 'Nombre, apellido y correo son obligatorios' }, { status: 400 });
    }

    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) && !isNaN(new Date(`${fechaNacimiento}T00:00:00`).getTime());
    if (!fechaValida) {
      return NextResponse.json({ error: 'La fecha de nacimiento es obligatoria' }, { status: 400 });
    }
    if (calcularEdad(fechaNacimiento) < 3) {
      return NextResponse.json({ error: 'Debes tener al menos 3 anos para usar la aplicacion' }, { status: 400 });
    }
    if (sexo !== 'masculino' && sexo !== 'femenino') {
      return NextResponse.json({ error: 'El sexo es obligatorio' }, { status: 400 });
    }

    const usuarios = readData<Usuario>('usuarios');
    if (usuarios.some(u => u.correo.toLowerCase() === correo)) {
      return NextResponse.json({ error: 'Ya existe una cuenta con ese correo' }, { status: 409 });
    }

    const avatares = readData<Avatar>('avatares');
    const avatarExiste = avatares.some(a => a.id_avatar === avatarId);

    const nuevo: Usuario = {
      id_usuario: getNextId('usuarios'),
      avatar_id: avatarExiste ? avatarId : 1,
      nombre,
      apellido,
      correo,
      rol: 'estudiante',
      estado: 'activo',
      fecha_registro: new Date().toISOString(),
      fecha_nacimiento: fechaNacimiento,
      sexo,
    };

    usuarios.push(nuevo);
    writeData('usuarios', usuarios);

    const avatar = avatares.find(a => a.id_avatar === nuevo.avatar_id);

    return NextResponse.json(
      {
        success: true,
        usuario: {
          id_usuario: nuevo.id_usuario,
          nombre: nuevo.nombre,
          apellido: nuevo.apellido,
          correo: nuevo.correo,
          avatar: {
            id_avatar: avatar?.id_avatar || nuevo.avatar_id,
            nombre: avatar?.nombre || 'Sacuanjoche',
            imagen: avatar?.imagen || 'avatar1.png',
          },
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 });
  }
}
