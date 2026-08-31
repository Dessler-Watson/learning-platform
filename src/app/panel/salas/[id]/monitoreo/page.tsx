'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, Zap, Shield, Flame, Skull, Trophy, Search, X } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { PageHeader } from '../../../components/shared/PageHeader';
import { BackButton } from '../../../components/shared/BackButton';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { usePanelStore } from '../../../store/usePanelStore';
import { audioManager } from '../../../lib/audio';
import { salasService } from '../../../services';
import { Sala, ParticipanteSala } from '../../../types';
import { useClickLock } from '../../../hooks/useClickLock';
import { AnimatedBackground } from '../../../components/shared/AnimatedBackground';

const ESTADO_COLOR: Record<string, string> = {
  esperando: 'bg-amber-50 text-amber-600 border border-amber-200',
  jugando: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
  finalizado: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  eliminado: 'bg-rose-50 text-rose-600 border border-rose-200',
};

export default function MonitoreoPage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params.id as string;
  const clickLock = useClickLock();
  const [sala, setSala] = useState<Sala | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaId) return;
    salasService.obtenerPorId(salaId).then((s) => {
      setSala(s ?? null);
      setLoading(false);
    });
  }, [salaId]);

  const simulateProgress = useCallback(async () => {
    if (!salaId || !sala || sala.estado !== 'en_curso') return;
    const updated = await salasService.simularProgreso(salaId);
    if (updated) {
      setSala({ ...updated });
      if (updated.estado === 'finalizada') {
        audioManager.play('success');
        router.push(`/panel/salas/${salaId}/resultados`);
      }
    }
  }, [salaId, sala, router]);

  useEffect(() => {
    if (!sala || sala.estado !== 'en_curso') return;
    const interval = setInterval(simulateProgress, 2500);
    return () => clearInterval(interval);
  }, [sala, simulateProgress]);

  const handleFinish = async () => {
    if (!salaId || !clickLock()) return;
    audioManager.play('submit');
    const updated = await salasService.finalizar(salaId);
    if (updated) {
      setSala({ ...updated });
      audioManager.play('success');
      router.push(`/panel/salas/${salaId}/resultados`);
    }
  };

  const handleBack = () => {
    audioManager.play('navigate');
    if (sala?.estado === 'finalizada') router.push(`/panel/salas/${salaId}/resultados`);
    else router.push('/panel/salas');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!sala) {
    return (
      <div className="relative z-10 space-y-6">
        <PageHeader title="Sala no encontrada" description="Esta sala no existe" />
      </div>
    );
  }

  const esLava = sala.juegoId === 'juego-2';
  const maxProgreso = Math.max(...sala.participantes.map((p) => p.progreso), 1);
  const progressPct = (progreso: number) => Math.round((progreso / sala.totalPreguntas) * 100);
  const filtered = search.trim()
    ? sala.participantes.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase().trim()))
    : sala.participantes;
  const ranking = sala.estado === 'en_curso'
    ? [...sala.participantes].sort((a, b) => b.puntosNetos - a.puntosNetos)
    : [];

  return (
    <div className="relative z-10 space-y-6">
      {esLava && <AnimatedBackground variant="lava" />}
      <PageHeader title={sala.nombre} description="Monitoreo en vivo">
        <BackButton onClick={handleBack} />
      </PageHeader>

      <div className="mx-auto max-w-4xl space-y-4">
        <Card variant="emerald">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <StatusBadge
                  label={sala.estado === 'en_curso' ? 'En curso' : sala.estado === 'finalizada' ? 'Finalizada' : 'Esperando'}
                  className={sala.estado === 'en_curso' ? (esLava ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-cyan-50 text-cyan-600 border border-cyan-200') : sala.estado === 'finalizada' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}
                />
                <span className="text-sm text-gray-400">{sala.participantes.length} participantes</span>
                {esLava && <span className="text-sm text-gray-400 flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" /> Modo Lava</span>}
              </div>
              {sala.estado === 'en_curso' && (
                <Button variant="destructive" onClick={handleFinish}>
                  <Square className="mr-2 h-4 w-4" /> Finalizar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {ranking.length > 0 && (
          <Card variant="amber">
            <CardContent className="p-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Ranking en vivo
              </h3>
              <div className="space-y-1.5">
                {ranking.map((p, i) => {
                  const eliminadoLava = esLava && p.estado === 'eliminado';
                  return (
                    <div
                      key={p.estudianteId}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                        eliminadoLava ? 'bg-red-50/50' : i === 0 ? (esLava ? 'bg-orange-50' : 'bg-amber-50') : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        eliminadoLava ? 'bg-red-100 text-red-500' : esLava ? 'bg-orange-100 text-orange-600' : 'bg-cyan-100 text-cyan-600'
                      }`}>
                        {eliminadoLava ? <Skull className="h-3.5 w-3.5" /> : p.nombre.charAt(0)}
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground truncate">{p.nombre}</span>
                      {eliminadoLava && <span className="text-xs text-red-400 font-medium">Eliminado</span>}
                      <span className={`text-sm font-bold ${eliminadoLava ? 'text-red-400' : esLava ? 'text-orange-500' : 'text-cyan-500'}`}>
                        {p.puntosNetos}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {sala.estado === 'en_curso' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-gray-300 shadow-sm transition-all focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-100"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {search && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">No se encontró ningún alumno con ese nombre</p>
          )}
          <AnimatePresence>
            {filtered.map((p, i) => {
              const eliminadoLava = esLava && p.estado === 'eliminado';
              return (
              <motion.div
                key={p.estudianteId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`rounded-3xl border p-4 transition-all ${
                  eliminadoLava
                    ? 'border-red-200 bg-red-50/50 shadow-sm'
                    : esLava ? 'border-orange-200 bg-white shadow-sm' : 'border-cyan-200 bg-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${
                      eliminadoLava
                        ? 'bg-gradient-to-br from-red-400 to-red-500'
                        : esLava ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-cyan-400 to-cyan-500'
                    }`}>
                      {eliminadoLava ? <Skull className="h-5 w-5" /> : p.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.nombre}</p>
                      <StatusBadge label={p.estado} className={esLava && p.estado === 'jugando' ? 'bg-orange-50 text-orange-600 border border-orange-200' : ESTADO_COLOR[p.estado]} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${eliminadoLava ? 'text-red-400' : esLava ? 'text-orange-500' : 'text-cyan-500'}`}>{p.puntosNetos}</p>
                    <p className="text-xs text-gray-400">puntos</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Progreso {p.progreso}/{sala.totalPreguntas}</span>
                    <span>{progressPct(p.progreso)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className={`h-full rounded-full ${eliminadoLava ? 'bg-gradient-to-r from-red-300 to-red-400' : esLava ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-cyan-400 to-cyan-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct(p.progreso)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-500"><Zap className="h-3 w-3" /> {p.correctas} correctas</span>
                    <span className="flex items-center gap-1 text-rose-500"><Shield className="h-3 w-3" /> {p.incorrectas} incorrectas</span>
                    {esLava && (
                      <span className="flex items-center gap-1 text-orange-500">
                        <Flame className="h-3 w-3" /> {p.distanciaLava}/5
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
