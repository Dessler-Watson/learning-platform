import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/db';

/**
 * Proxy server-side para mantener la API Key segura.
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

  const model = 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Sin timeout el cliente se quedaba cargando indefinidamente cuando Gemini tardaba.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt as string }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `Error HTTP ${res.status}`;
      const errCode = data?.error?.code ?? res.status;

      console.error('[AI Generate] Error de Gemini:', errCode, errMsg);

      if (errCode === 400) {
        return NextResponse.json(
          { error: 'Solicitud invalida. Por favor, intenta de nuevo.', type: 'bad_request' },
          { status: 400 }
        );
      }
      if (errCode === 401 || errCode === 403) {
        return NextResponse.json(
          { error: 'La clave de API de Gemini no es valida o no tiene permisos. Verifica la configuracion.', type: 'auth_error' },
          { status: errCode }
        );
      }
      if (errCode === 429 || errMsg.toLowerCase().includes('resource_exhausted') || errMsg.toLowerCase().includes('high demand')) {
        return NextResponse.json(
          { error: 'Se alcanzo el limite de solicitudes de Gemini. Espera un momento e intentalo de nuevo.', type: 'rate_limit' },
          { status: 429 }
        );
      }
      if (errMsg.toLowerCase().includes('no longer available') || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not available')) {
        return NextResponse.json(
          { error: 'El modelo de IA seleccionado ya no esta disponible. Contacta al administrador para actualizar la configuracion.', type: 'model_error' },
          { status: errCode }
        );
      }

      return NextResponse.json(
        { error: 'Ocurrio un error al comunicarse con Gemini. Intenta de nuevo mas tarde.', type: 'api_error' },
        { status: errCode }
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('[AI Generate] Respuesta sin texto:', JSON.stringify(data).substring(0, 500));
      return NextResponse.json(
        { error: 'Gemini devolvio una respuesta sin contenido.', type: 'empty_response' },
        { status: 502 }
      );
    }

    return NextResponse.json({ content: text });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error('[AI Generate] Timeout: Gemini no respondio en 60s');
      return NextResponse.json(
        { error: 'Gemini tardo demasiado en responder. Intenta nuevamente.', type: 'timeout' },
        { status: 504 }
      );
    }
    console.error('[AI Generate] Error de conexion:', err);
    return NextResponse.json(
      { error: 'No se pudo conectar con Gemini. Verifica tu conexion a internet e intentalo de nuevo.', type: 'connection_error' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
