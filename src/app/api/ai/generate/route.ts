import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/db';
import { callModel, GEMINI_MODEL } from '@/lib/ai/gemini';

/**
 * Proxy server-side para mantener la API Key segura.
 * Modelo unico: exactamente `gemini-3.5-flash` (sin cadena de modelos, para
 * no consumir cuota con llamadas repetidas). Si esta saturado (429/503/504)
 * se devuelve 503 type 'overloaded' y el cliente reintenta.
 * La llamada real vive en src/lib/ai/gemini.ts (compartida con Modo Caos).
 */

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  // Cualquier cuenta registrada (estudiante/docente/admin) genera preguntas
  // para su práctica; los invitados no.
  if (!session || session.is_guest) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de Gemini no configurada en el servidor.', type: 'auth_error' }, { status: 500 });
  }

  let prompt: unknown;
  try {
    ({ prompt } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON invalido.', type: 'bad_request' }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: 'Falta el prompt.', type: 'bad_request' }, { status: 400 });
  }

  const result = await callModel(apiKey, GEMINI_MODEL, String(prompt));
  if ('content' in result) {
    return NextResponse.json({ content: result.content, model: GEMINI_MODEL });
  }
  if (result.overloaded && result.type !== 'timeout') {
    // Reintentable desde el cliente (el intento 2 vuelve a llamar a la ruta).
    return NextResponse.json(
      { error: 'Gemini esta saturado en este momento. Se reintentara automaticamente.', type: 'overloaded' },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: result.error, type: result.type }, { status: result.status });
}
