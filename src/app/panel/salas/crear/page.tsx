'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Gamepad2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card, CardContent } from '../../ui/card';
import { PageHeader } from '../../components/shared/PageHeader';
import { GameIcon, GAME_ICON_COLORS } from '../../ui/game-icons';
import { BackButton } from '../../components/shared/BackButton';
import { usePanelStore } from '../../store/usePanelStore';
import { audioManager } from '../../lib/audio';
import { salasService, juegosService, cursosService } from '../../services';
import { useClickLock } from '../../hooks/useClickLock';

export default function CrearSalaPage() {
  const router = useRouter();
  const teacherId = usePanelStore((s) => s.docente?.id);
  const clickLock = useClickLock();
  const [nombre, setNombre] = useState('');
  const [juegoId, setJuegoId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [tiempoPorPregunta, setTiempoPorPregunta] = useState(30);
  const [juegos, setJuegos] = useState<{ id: string; nombre: string; emoji: string }[]>([]);
  const [cursos, setCursos] = useState<{ id: string; nombre: string; gameModeId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    Promise.all([
      juegosService.obtenerTodos(teacherId),
      cursosService.obtenerTodos(teacherId),
    ]).then(([j, c]) => {
      setJuegos(j);
      setCursos(c);
      if (j.length > 0) setJuegoId(j[0].id);
      setLoading(false);
    });
  }, [teacherId]);

  const filteredCursos = juegoId ? cursos.filter((c) => c.gameModeId === juegoId) : cursos;

  useEffect(() => {
    if (filteredCursos.length > 0 && !filteredCursos.find((c) => c.id === cursoId)) {
      setCursoId(filteredCursos[0].id);
    }
  }, [filteredCursos, cursoId]);

  const handleCreate = async () => {
    if (!teacherId || !juegoId || !cursoId || creating) return;
    if (!clickLock()) return;
    setCreating(true);
    audioManager.play('submit');
    const sala = await salasService.crear({
      teacherId,
      juegoId,
      cursoId,
      nombre: nombre.trim() || `Sesión de ${cursos.find((c) => c.id === cursoId)?.nombre ?? 'Curso'}`,
      tiempoPorPregunta,
    });
    audioManager.play('success');
    router.push(`/panel/salas/${sala.id}/lobby`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative z-10 space-y-6">
      <PageHeader title="Crear sala" description="Configura una nueva sala de juego">
        <BackButton onClick={() => router.push('/panel/salas')} />
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto max-w-lg">
        <Card variant="cyan">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label>Nombre de la sala</Label>
              <Input
                placeholder="Ej: Evaluación de derechos humanos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Modo de juego</Label>
              <div className="grid grid-cols-2 gap-3">
                {juegos.map((j) => {
                  const esLava = j.id === 'juego-2';
                  const iconColors = GAME_ICON_COLORS[j.id];
                  return (
                    <button
                      key={j.id}
                      onClick={() => { audioManager.play('select'); setJuegoId(j.id); }}
                      className={`rounded-2xl border-2 p-4 text-left transition-all ${
                        juegoId === j.id
                          ? esLava
                            ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-200/40'
                            : 'border-purple-400 bg-purple-50 shadow-md shadow-purple-200/40'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColors?.bg ?? 'bg-gray-50'}`}>
                        <GameIcon juegoId={j.id} className={iconColors?.text ?? 'text-gray-400'} size={22} />
                      </div>
                      <p className="mt-2 text-sm font-bold text-foreground">{j.nombre}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Curso</Label>
              <div className="space-y-2">
                {filteredCursos.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay cursos disponibles para este modo de juego.</p>
                ) : (
                  filteredCursos.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { audioManager.play('select'); setCursoId(c.id); }}
                      className={`w-full rounded-2xl border-2 p-3 text-left transition-all ${cursoId === c.id ? 'border-cyan-400 bg-cyan-50 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm font-semibold text-foreground">{c.nombre}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiempo por pregunta</Label>
              <div className="flex items-center gap-3">
                {[15, 20, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => { audioManager.play('select'); setTiempoPorPregunta(t); }}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${tiempoPorPregunta === t ? 'bg-cyan-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {t}
                  </button>
                ))}
                <span className="text-xs text-gray-400">seg</span>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-bold" onClick={handleCreate} disabled={creating || !juegoId || !cursoId}>
              <Gamepad2 className="mr-2 h-4 w-4" />
              {creating ? 'Creando...' : 'Crear sala'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
