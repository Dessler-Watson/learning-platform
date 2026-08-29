import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData, getNextId } from '@/lib/data';

interface Cuestionario { id_cuestionario: number; nombre: string; descripcion: string | null; nivel: string; }
interface Categoria { id_categoria: number; cuestionario_id: number; }
interface Pregunta { categoria_id: number; }
interface Juego { id_juego: number; nombre: string; }
interface JuegoCuestionario { juego_id: number; cuestionario_id: number; }

export async function GET() {
  const cuestionarios = readData<Cuestionario>('cuestionarios');
  const categorias = readData<Categoria>('categorias');
  const preguntas = readData<Pregunta>('preguntas');
  const juegos = readData<Juego>('juegos');
  const juegoCuestionario = readData<JuegoCuestionario>('juego_cuestionario');

  const result = cuestionarios.map(q => ({
    ...q,
    total_categorias: categorias.filter(c => c.cuestionario_id === q.id_cuestionario).length,
    total_preguntas: preguntas.filter(p => {
      const cat = categorias.find(c => c.id_categoria === p.categoria_id);
      return cat?.cuestionario_id === q.id_cuestionario;
    }).length,
    juegos: juegoCuestionario
      .filter(jc => jc.cuestionario_id === q.id_cuestionario)
      .map(jc => {
        const j = juegos.find(g => g.id_juego === jc.juego_id);
        return { id_juego: j?.id_juego, nombre_juego: j?.nombre };
      }),
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData<Cuestionario>('cuestionarios');
  const newId = getNextId('cuestionarios');
  const newCue = { id_cuestionario: newId, nombre: body.nombre, descripcion: body.descripcion || null, nivel: body.nivel };
  data.push(newCue);
  writeData('cuestionarios', data);
  return NextResponse.json(newCue, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '0');
  const data = readData<Cuestionario>('cuestionarios');
  const idx = data.findIndex(q => q.id_cuestionario === id);
  if (idx === -1) return NextResponse.json({ error: 'Cuestionario no encontrado' }, { status: 404 });
  data[idx] = { ...data[idx], ...body };
  writeData('cuestionarios', data);
  return NextResponse.json(data[idx]);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = parseInt(url.pathname.split('/').pop() || '0');
  let data = readData<Cuestionario>('cuestionarios');
  const found = data.find(q => q.id_cuestionario === id);
  if (!found) return NextResponse.json({ error: 'Cuestionario no encontrado' }, { status: 404 });
  data = data.filter(q => q.id_cuestionario !== id);
  writeData('cuestionarios', data);
  return NextResponse.json({ mensaje: 'Cuestionario eliminado' });
}
