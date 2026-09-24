/**
 * Servicio de generacion de preguntas con IA.
 * Llama a una Route Handler local que actua como proxy hacia Gemini.
 */

export interface GeneratedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: 'A' | 'B';
}

interface GeminiResponse {
  content?: string;
  error?: string;
  type?: string;
}

function buildPrompt(topic: string, description: string, amount: number, existingQuestions: string[]): string {
  const existingBlock = existingQuestions.length > 0
    ? `\n\nEvita repetir las siguientes preguntas ya existentes:\n${existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  return `Eres un generador de preguntas educativas. Genera exactamente ${amount} preguntas sobre el siguiente tema.

Tema: ${topic}
Descripcion: ${description}
${existingBlock}

REGLAS ESTRICTAS:
- Genera EXACTAMENTE ${amount} preguntas.
- Cada pregunta debe tener exactamente DOS opciones: A y B.
- Las opciones A y B deben ser DIFERENTES entre si. NUNCA pongas la misma respuesta en ambas opciones.
- Solo una opcion puede ser correcta.
- Indica claramente cual es la respuesta correcta (solo "A" o "B").
- Evita preguntas ambiguas o confusas.
- Evita repetir preguntas.
- Manten un nivel educativo apropiado.
- No inventes informacion que no este relacionada con el tema.
- Responde UNICAMENTE con el JSON solicitado, sin texto adicional.

Formato de respuesta JSON:
{
  "questions": [
    {
      "question": "Pregunta aqui?",
      "optionA": "Opcion A aqui (diferente a B)",
      "optionB": "Opcion B aqui (diferente a A)",
      "correctAnswer": "A"
    }
  ]
}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera preguntas usando Gemini a traves de un proxy server-side.
 * Reintenta automaticamente en caso de rate limit o errores temporales.
 */
const MAX_RETRIES = 5;
const RETRY_DELAYS = [5000, 15000, 30000, 60000, 60000];

let generationLock = false;

export async function generateQuestions(
  topic: string,
  description: string,
  amount: number,
  existingQuestions: string[] = []
): Promise<GeneratedQuestion[]> {
  if (generationLock) {
    throw new Error('Ya hay una generacion en curso. Espera unos segundos antes de intentar de nuevo.');
  }
  generationLock = true;

  const allQuestions: GeneratedQuestion[] = [];
  const usedTexts = new Set<string>();
  let lastError: string | null = null;

  try {
    for (let attempt = 0; attempt < MAX_RETRIES && allQuestions.length < amount; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)];
        console.log(`[AI Generate] Reintento ${attempt + 1}/${MAX_RETRIES}, esperando ${delay / 1000}s...`);
        await sleep(delay);
      }

      const remaining = amount - allQuestions.length;
      const requestAmount = Math.min(remaining + 2, 30);
      const avoided = [
        ...existingQuestions,
        ...Array.from(usedTexts),
      ];
      const prompt = buildPrompt(topic, description, requestAmount, avoided);

      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });

        const data: GeminiResponse = await res.json();

        if (!res.ok) {
          const isRateLimit = res.status === 429 || data.type === 'rate_limit';
          const isServerError = res.status === 503 || res.status === 502;

          if (isRateLimit || isServerError) {
            lastError = data.error ?? 'Error temporal del servicio de IA.';
            console.warn(`[AI Generate] Error temporal (${res.status}), reintentando...`);
            continue;
          }

          throw new Error(
            data.error ?? 'No fue posible generar las preguntas. Verifica la conexion e intentalo nuevamente.'
          );
        }

        const content = data.content;
        if (!content) {
          lastError = 'Gemini devolvio una respuesta vacia.';
          console.warn('[AI Generate] Respuesta vacia, reintentando...');
          continue;
        }

        const parsed = parseResponse(content);
        for (const q of parsed) {
          if (allQuestions.length >= amount) break;
          if (usedTexts.has(q.question)) continue;
          usedTexts.add(q.question);
          allQuestions.push(q);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('conexion')) {
          lastError = err.message;
          console.warn('[AI Generate] Error de conexion, reintentando...');
          continue;
        }
        throw err;
      }
    }

    if (allQuestions.length === 0) {
      throw new Error(
        lastError
          ? `${lastError} Espera un minuto y vuelve a intentar.`
          : 'Gemini devolvio un formato inesperado. Intenta generar nuevamente.'
      );
    }

    return allQuestions.slice(0, amount);
  } finally {
    generationLock = false;
  }
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

function parseResponse(raw: string): GeneratedQuestion[] {
  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    const json = JSON.parse(cleaned);
    const questions = json.questions;
    if (!Array.isArray(questions)) return [];

    return questions
      .filter((q: Record<string, unknown>) =>
        typeof q.question === 'string' &&
        typeof q.optionA === 'string' &&
        typeof q.optionB === 'string' &&
        (q.correctAnswer === 'A' || q.correctAnswer === 'B')
      )
      .filter((q: Record<string, unknown>) => {
        const a = normalizeText(q.optionA as string);
        const b = normalizeText(q.optionB as string);
        return a !== b && a.length > 0 && b.length > 0;
      })
      .map((q: Record<string, unknown>) => {
        const shouldSwap = Math.random() < 0.5;
        if (shouldSwap) {
          return {
            question: (q.question as string).trim(),
            optionA: (q.optionB as string).trim(),
            optionB: (q.optionA as string).trim(),
            correctAnswer: (q.correctAnswer as 'A' | 'B') === 'A' ? 'B' : 'A',
          };
        }
        return {
          question: (q.question as string).trim(),
          optionA: (q.optionA as string).trim(),
          optionB: (q.optionB as string).trim(),
          correctAnswer: q.correctAnswer as 'A' | 'B',
        };
      });
  } catch {
    return [];
  }
}
