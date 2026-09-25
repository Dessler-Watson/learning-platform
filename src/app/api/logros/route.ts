import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateAchievements,
  getSessionUser,
  listAchievements,
  listProgress,
} from '@/lib/db';
import type { AchievementProgressRow, AchievementRow } from '@/lib/db';

export const dynamic = 'force-dynamic';

function buildLogros(all: AchievementRow[], progress: AchievementProgressRow[]) {
  const byId = new Map(progress.map((p) => [p.achievement_id, p]));
  const byCode = new Map(progress.map((p) => [p.code, p]));
  return all.map((a) => {
    const p = byId.get(a.id) ?? byCode.get(a.code);
    return {
      id: a.id,
      code: a.code,
      nombre: a.name,
      descripcion: a.description,
      dificultad: a.difficulty,
      icono: a.icon,
      meta: a.goal,
      stat_key: a.stat_key,
      modo: a.mode_code,
      progreso: p?.progress ?? 0,
      completado: p?.completed ?? false,
      desbloqueado_en: p?.unlocked_at ?? null,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const all = await listAchievements();

    // Invitados: catálogo en cero, sin evaluar ni escribir progreso.
    if (session.is_guest) {
      return NextResponse.json({ logros: buildLogros(all, []), nuevos: [] });
    }

    const { nuevos } = await evaluateAchievements({ targetUserId: session.id });
    const progress = await listProgress(session.id);
    return NextResponse.json({ logros: buildLogros(all, progress), nuevos });
  } catch (err) {
    console.error('[logros GET]', err);
    return NextResponse.json({ error: 'Error al obtener logros' }, { status: 500 });
  }
}

/**
 * Sincronización server-side. El cuerpo del request se IGNORA por completo:
 * el progreso se evalúa desde PostgreSQL y solo el servidor decide desbloqueos.
 * Respuesta: { ok, logros, nuevos } — "nuevos" alimenta la notificación de UI.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (session.is_guest) {
      return NextResponse.json({ error: 'Los invitados no acumulan logros' }, { status: 403 });
    }

    await req.json().catch(() => ({}));
    const { nuevos } = await evaluateAchievements({ targetUserId: session.id });
    const [all, progress] = await Promise.all([listAchievements(), listProgress(session.id)]);
    return NextResponse.json({ ok: true, logros: buildLogros(all, progress), nuevos });
  } catch (err) {
    console.error('[logros POST]', err);
    return NextResponse.json({ error: 'Error al sincronizar logros' }, { status: 500 });
  }
}
