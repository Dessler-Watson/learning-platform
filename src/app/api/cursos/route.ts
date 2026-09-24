import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, listCourses, getCourse, listCourseQuestions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const course = await getCourse(id);
      if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      const questions = await listCourseQuestions(id);
      return NextResponse.json({ curso: course, preguntas: questions });
    }

    const courses = await listCourses({
      subject: searchParams.get('subject') ?? undefined,
      search: searchParams.get('q') ?? undefined,
      teacherId: searchParams.get('mine') === '1' && session.role !== 'student' ? session.id : undefined,
    });
    return NextResponse.json({ cursos: courses });
  } catch (err) {
    console.error('[cursos GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
