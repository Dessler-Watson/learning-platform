import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy server-side para mantener la API Key segura.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key de Gemini no configurada en el servidor.', type: 'auth_error' }, { status: 500 });
  }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Falta el prompt.', type: 'bad_request' }, { status: 400 });
  }

  const model = 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `Error HTTP ${res.status}`;
      const errCode = data?.error?.code ?? res.status;

      console.error('[AI Generate] Error de Gemini:', errCode, errMsg);

      if (errCode === 400) {
        return NextResponse.json(
          { error: `Solicitud invalida: ${errMsg}`, type: 'bad_request' },
          { status: 400 }
        );
      }
      if (errCode === 401 || errCode === 403) {
        return NextResponse.json(
          { error: 'La API Key de Gemini no es valida o no tiene permisos. Revisa GEMINI_API_KEY.', type: 'auth_error' },
          { status: errCode }
        );
      }
      if (errCode === 429 || errMsg.toLowerCase().includes('resource_exhausted') || errMsg.toLowerCase().includes('high demand') || errMsg.toLowerCase().includes('try again')) {
        return NextResponse.json(
          { error: 'Se alcanzo el limite de solicitudes de Gemini. Espera un momento e intentalo de nuevo.', type: 'rate_limit' },
          { status: 429 }
        );
      }

      const translatedMsg = errMsg
        .replace(/This model is currently experiencing high demand\. Spikes in demand are usually temporary\. Please try again later\./i, 'El modelo esta experimentando alta demanda. Por favor, intentalo de nuevo mas tarde.')
        .replace(/Please try again later\./i, 'Por favor, intentalo de nuevo mas tarde.')
        .replace(/Try again later\./i, 'Intentalo de nuevo mas tarde.');

      return NextResponse.json(
        { error: `Error de Gemini: ${translatedMsg}`, type: 'api_error' },
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
    console.error('[AI Generate] Error de conexion:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error al conectar con Gemini: ${message}`, type: 'connection_error' },
      { status: 502 }
    );
  }
}
