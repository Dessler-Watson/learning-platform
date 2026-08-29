import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, getNextId } from '@/lib/data';

interface Pregunta { id_pregunta: number; categoria_id: number; pregunta: string; opcion_a: string; opcion_b: string; opcion_c: string | null; opcion_d: string | null; respuesta_correcta: string; dificultad: string; explicacion: string | null; puntos: number; }
interface Categoria { id_categoria: number; nombre: string; cuestionario_id: number; }
interface Cuestionario { id_cuestionario: number; nombre: string; }
interface JuegoCuestionario { juego_id: number; cuestionario_id: number; }

export async function GET(req: NextRequest) {
  const preguntas = readData<Pregunta>('preguntas');
  const categorias = readData<Categoria>('categorias');
  const cuestionarios = readData<Cuestionario>('cuestionarios');

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria');
  const dificultad = searchParams.get('dificultad');
  const juego = searchParams.get('juego');

  let result = preguntas.map(p => {
    const cat = categorias.find(c => c.id_categoria === p.categoria_id);
    const cue = cat ? cuestionarios.find(q => q.id_cuestionario === cat.cuestionario_id) : null;
    return { ...p, categoria_nombre: cat?.nombre || '', cuestionario_nombre: cue?.nombre || '' };
  });

  if (categoria) result = result.filter(p => p.categoria_id === parseInt(categoria));
  if (dificultad) result = result.filter(p => p.dificultad === dificultad);
  if (juego) {
    const cueIds = readData<JuegoCuestionario>('juego_cuestionario')
      .filter(jc => jc.juego_id === parseInt(juego))
      .map(jc => jc.cuestionario_id);
    result = result.filter(p => {
      const cat = categorias.find(c => c.id_categoria === p.categoria_id);
      return cat && cueIds.includes(cat.cuestionario_id);
    });
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData<Pregunta>('preguntas');
  const newId = getNextId('preguntas');
  const newPregunta = {
    id_pregunta: newId,
    categoria_id: body.categoria_id,
    pregunta: body.pregunta,
    opcion_a: body.opcion_a,
    opcion_b: body.opcion_b,
    opcion_c: body.opcion_c || null,
    opcion_d: body.opcion_d || null,
    respuesta_correcta: body.respuesta_correcta,
    dificultad: body.dificultad || 'media',
    explicacion: body.explicacion || null,
    puntos: body.puntos || 10,
  };
  data.push(newPregunta);
  writeData('preguntas', data);
  return NextResponse.json(newPregunta, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '0');
  const data = readData<Pregunta>('preguntas');
  const idx = data.findIndex(p => p.id_pregunta === id);
  if (idx === -1) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
  data[idx] = { ...data[idx], ...body };
  writeData('preguntas', data);
  return NextResponse.json(data[idx]);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '0');
  let data = readData<Pregunta>('preguntas');
  const found = data.find(p => p.id_pregunta === id);
  if (!found) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 });
  data = data.filter(p => p.id_pregunta !== id);
  writeData('preguntas', data);
  return NextResponse.json({ mensaje: 'Pregunta eliminada' });
}
