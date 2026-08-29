import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, getNextId } from '@/lib/data';

interface Curso { id_curso: number; docente_id: number; nombre: string; }
interface Usuario { id_usuario: number; nombre: string; }
interface CursoEstudiante { id: number; curso_id: number; usuario_id: number; }

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');

  if (parts.includes('estudiantes')) {
    const cursoId = parseInt(parts[parts.length - 2]);
    const cursoEstudiante = readData<CursoEstudiante>('curso_estudiante');
    const usuarios = readData<Usuario>('usuarios');
    const inscritos = cursoEstudiante
      .filter(ce => ce.curso_id === cursoId)
      .map(ce => usuarios.find(u => u.id_usuario === ce.usuario_id))
      .filter(Boolean);
    return NextResponse.json(inscritos);
  }

  const cursos = readData<Curso>('cursos');
  const usuarios = readData<Usuario>('usuarios');
  const cursoEstudiante = readData<CursoEstudiante>('curso_estudiante');

  const result = cursos.map(c => ({
    ...c,
    docente_nombre: usuarios.find(u => u.id_usuario === c.docente_id)?.nombre || '',
    total_estudiantes: cursoEstudiante.filter(ce => ce.curso_id === c.id_curso).length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const body = await req.json();

  if (url.pathname.includes('/estudiantes')) {
    const parts = url.pathname.split('/');
    const cursoId = parseInt(parts[parts.length - 2]);
    const data = readData<CursoEstudiante>('curso_estudiante');
    data.push({ id: getNextId('curso_estudiante'), curso_id: cursoId, usuario_id: body.usuario_id });
    writeData('curso_estudiante', data);
    return NextResponse.json(data[data.length - 1], { status: 201 });
  }

  const cursos = readData<Curso>('cursos');
  const newId = getNextId('cursos');
  const newCurso = { id_curso: newId, docente_id: body.docente_id, nombre: body.nombre };
  cursos.push(newCurso);
  writeData('cursos', cursos);
  return NextResponse.json(newCurso, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const cursoId = parseInt(parts[parts.length - 2]);
  const usuarioId = parseInt(parts[parts.length - 1]);
  let data = readData<CursoEstudiante>('curso_estudiante');
  data = data.filter(ce => !(ce.curso_id === cursoId && ce.usuario_id === usuarioId));
  writeData('curso_estudiante', data);
  return NextResponse.json({ mensaje: 'Estudiante removido del curso' });
}
