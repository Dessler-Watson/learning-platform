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
      "optionA": "Opcion A aqui",
      "optionB": "Opcion B aqui",
      "correctAnswer": "A"
    }
  ]
}`;
}

/**
 * Genera preguntas usando Gemini a traves de un proxy server-side.
 */
export async function generateQuestions(
  topic: string,
  description: string,
  amount: number,
  existingQuestions: string[] = []
): Promise<GeneratedQuestion[]> {
  const prompt = buildPrompt(topic, description, amount, existingQuestions);

  const res = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const data: GeminiResponse = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error ?? 'No fue posible generar las preguntas. Verifica la conexion e intentalo nuevamente.'
    );
  }

  const content = data.content;
  if (!content) {
    throw new Error('Gemini devolvio una respuesta vacia.');
  }

  const parsed = parseResponse(content);
  if (parsed.length === 0) {
    throw new Error('Gemini devolvio un formato inesperado. Intenta generar nuevamente.');
  }

  return parsed;
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
      .map((q: Record<string, unknown>) => ({
        question: (q.question as string).trim(),
        optionA: (q.optionA as string).trim(),
        optionB: (q.optionB as string).trim(),
        correctAnswer: q.correctAnswer as 'A' | 'B',
      }));
  } catch {
    return [];
  }
}
