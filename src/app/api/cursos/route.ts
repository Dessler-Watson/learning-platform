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
      if (session.role === 'student') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      const course = await getCourse(id);
      if (!course || (session.role !== 'admin' && course.teacher_id !== session.id)) {
        return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      }
      const questions = await listCourseQuestions(id);
      return NextResponse.json({ curso: course, preguntas: questions });
    }

    const studentOnlyActive = session.role === 'student';
    const courses = await listCourses({
      subject: searchParams.get('subject') ?? undefined,
      search: searchParams.get('q') ?? undefined,
      teacherId:
        session.role !== 'admin' && (session.role !== 'student' || searchParams.get('mine') === '1')
          ? session.id
          : undefined,
    });
    const visible = studentOnlyActive ? courses.filter((c) => c.status === 'active') : courses;
    return NextResponse.json({ cursos: visible });
  } catch (err) {
    console.error('[cursos GET]', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
