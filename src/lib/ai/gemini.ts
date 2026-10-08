/**
 * Cliente server-side minimo de Gemini (modelo unico gemini-3.5-flash).
 * Extraido de src/app/api/ai/generate/route.ts para que el proxy de IA del
 * panel y el generador del Modo Caos compartan UNA sola implementacion
 * (timeout, manejo de 429/503/504, auth, modelo inexistente). Cualquier cambio
 * aqui afecta a ambos consumidores.
 */

export const GEMINI_MODEL = 'gemini-3.5-flash';
export const GEMINI_TIMEOUT_MS = 45_000;

export interface ModelFailure {
  status: number;
  type: string;
  error: string;
  overloaded: boolean;
}

function isOverloaded(status: number, message: string): boolean {
  const m = message.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    m.includes('high demand') ||
    m.includes('resource_exhausted') ||
    m.includes('overloaded') ||
    m.includes('quota')
  );
}

export async function callModel(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ content: string } | ModelFailure> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.ok) {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { content: text };
      console.error(`[AI Generate] ${model}: respuesta sin texto`);
      return {
        status: 502,
        type: 'empty_response',
        error: 'Gemini devolvio una respuesta sin contenido.',
        overloaded: false,
      };
    }

    const errMsg = String(data?.error?.message ?? `Error HTTP ${res.status}`);
    const errCode = Number(data?.error?.code ?? res.status);
    console.error(`[AI Generate] ${model}:`, errCode, errMsg);

    // La API key no sirve: no tiene sentido probar otros modelos.
    if (errCode === 401 || errCode === 403) {
      return {
        status: errCode,
        type: 'auth_error',
        error: 'La clave de API de Gemini no es valida o no tiene permisos. Verifica la configuracion.',
        overloaded: false,
      };
    }

    if (isOverloaded(res.status, errMsg)) {
      return {
        status: 503,
        type: 'overloaded',
        error: 'Gemini esta saturado en este momento.',
        overloaded: true,
      };
    }

    if (errMsg.toLowerCase().includes('no longer available') || errMsg.toLowerCase().includes('not found') || errMsg.toLowerCase().includes('not available')) {
      return {
        status: 404,
        type: 'model_error',
        error: 'Modelo no disponible.',
        overloaded: false,
      };
    }

    if (errCode === 400) {
      return {
        status: 400,
        type: 'bad_request',
        error: 'Solicitud invalida. Por favor, intenta de nuevo.',
        overloaded: false,
      };
    }

    return {
      status: 502,
      type: 'api_error',
      error: 'Ocurrio un error al comunicarse con Gemini. Intenta de nuevo mas tarde.',
      overloaded: false,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[AI Generate] ${model}: timeout ${GEMINI_TIMEOUT_MS / 1000}s`);
      return {
        status: 504,
        type: 'timeout',
        error: 'Gemini tardo demasiado en responder.',
        overloaded: true,
      };
    }
    console.error(`[AI Generate] ${model}: error de conexion`, err);
    return {
      status: 502,
      type: 'connection_error',
      error: 'No se pudo conectar con Gemini. Verifica tu conexion a internet e intentalo de nuevo.',
      overloaded: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
