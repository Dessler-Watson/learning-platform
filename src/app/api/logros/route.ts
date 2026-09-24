import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, listAchievements, listProgress, upsertProgress } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const [all, progress] = await Promise.all([listAchievements(), listProgress(session.id)]);
    const map = new Map(progress.map((p) => [p.achievement_id, p]));
    const byCode = new Map(progress.map((p) => [p.code, p]));

    return NextResponse.json({
      logros: all.map((a) => {
        const p = map.get(a.id) ?? byCode.get(a.code);
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
      }),
    });
  } catch (err) {
    console.error('[logros GET]', err);
    return NextResponse.json({ error: 'Error al obtener logros' }, { status: 500 });
  }
}

/**
 * Upsert progress for current user.
 * Accepts single { code|achievement_id, progress, completed } or batch { items: [...] }.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const items: Array<{ achievement_id?: string; code?: string; id?: string; progress?: number; completed?: boolean }> =
      Array.isArray(body.items) ? body.items : [body];

    if (items.length === 0 || items.length > 200) {
      return NextResponse.json({ error: 'items vacío o demasiado grande' }, { status: 400 });
    }

    const all = await listAchievements();
    const byCode = new Map(all.map((a) => [a.code, a.id]));
    const byId = new Map(all.map((a) => [a.id, a.id]));

    let saved = 0;
    for (const item of items) {
      const key = String(item.code ?? item.achievement_id ?? item.id ?? '');
      const achievementId = byCode.get(key) ?? byId.get(key);
      const progress = Number(item.progress ?? 0);
      const completed = Boolean(item.completed);
      if (!achievementId || !Number.isFinite(progress)) continue;
      await upsertProgress(session.id, achievementId, Math.max(0, progress), completed);
      saved += 1;
    }

    if (saved === 0) {
      return NextResponse.json({ error: 'achievement code/id inválido' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, saved });
  } catch (err) {
    console.error('[logros POST]', err);
    return NextResponse.json({ error: 'Error al guardar logro' }, { status: 500 });
  }
}
