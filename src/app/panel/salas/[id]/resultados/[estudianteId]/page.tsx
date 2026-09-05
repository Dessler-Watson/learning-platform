'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Minus, Clock, Target, Zap, Shield, Flame, Skull, Trophy } from 'lucide-react';
import { Button } from '../../../../ui/button';
import { Card, CardContent } from '../../../../ui/card';
import { PageHeader } from '../../../../components/shared/PageHeader';
import { BackButton } from '../../../../components/shared/BackButton';
import { StatusBadge } from '../../../../components/shared/StatusBadge';
import { audioManager } from '../../../../lib/audio';
import { salasService } from '../../../../services';
import { Sala, DetalleEstudianteSala } from '../../../../types';
import { AnimatedBackground } from '../../../../components/shared/AnimatedBackground';

export default function EstudianteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params.id as string;
  const estudianteId = params.estudianteId as string;
  const [sala, setSala] = useState<Sala | null>(null);
  const [detalle, setDetalle] = useState<DetalleEstudianteSala | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaId || !estudianteId) return;
    salasService.obtenerPorId(salaId).then(async (s) => {
      if (!s) { setLoading(false); return; }
      setSala(s);
      const det = await salasService.obtenerDetalleEstudianteSala(s.id, estudianteId);
      setDetalle(det ?? null);
      setLoading(false);
    });
  }, [salaId, estudianteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A0B5] border-t-transparent" />
      </div>
    );
  }

  if (!sala || !detalle) {
    return (
      <div className="relative z-10 space-y-6">
        <PageHeader title="Detalle no encontrado" description="No se encontró la información de este estudiante">
          <BackButton onClick={() => router.push(`/panel/salas/${salaId}/resultados`)} />
        </PageHeader>
      </div>
    );
  }

  const esLava = sala.juegoId === 'juego-2';
  const esEliminado = detalle.estadoFinal === 'eliminado';

  return (
    <div className="relative z-10 space-y-6">
      {esLava && <AnimatedBackground variant="lava" />}
      <PageHeader title={detalle.nombre} description="Detalle del estudiante">
        <BackButton onClick={() => router.push(`/panel/salas/${salaId}/resultados`)} />
      </PageHeader>

      <div className="mx-auto max-w-3xl space-y-6">
        {/* Resumen */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card variant={esEliminado ? 'rose' : 'cyan'}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm ${
                  esEliminado
                    ? 'bg-gradient-to-br from-red-400 to-red-500'
                     : esLava ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-[#00A0B5] to-[#98C54E]'
                }`}>
                  {esEliminado ? <Skull className="h-7 w-7" /> : detalle.nombre.charAt(0)}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{detalle.nombre}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge
                      label={esEliminado ? 'Eliminado' : 'Completado'}
                      className={esEliminado
                        ? (esLava ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-rose-50 text-rose-600 border border-rose-200')
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }
                    />
                    {esEliminado && detalle.preguntaEliminacion && (
                      <span className="text-xs text-gray-400">Eliminado en pregunta #{detalle.preguntaEliminacion}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                   <p className={`text-3xl font-bold ${esEliminado ? 'text-red-400' : esLava ? 'text-orange-500' : 'text-[#00A0B5]'}`}>
                    {detalle.puntosNetos}
                  </p>
                  <p className="text-xs text-gray-400">puntos</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{detalle.correctAnswers}</p>
                  <p className="text-xs text-emerald-500 font-medium">Correctas</p>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-600">{detalle.incorrectAnswers}</p>
                  <p className="text-xs text-rose-500 font-medium">Incorrectas</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-500">{detalle.timedOutAnswers}</p>
                  <p className="text-xs text-gray-400 font-medium">Sin respuesta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Estadísticas detalladas */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card variant="default">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                 <Target className="h-4 w-4 text-[#00A0B5]" /> Rendimiento
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                   <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00A0B5]/10 border border-[#00A0B5]/20">
                     <Target className="h-5 w-5 text-[#00A0B5]" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{detalle.precision}%</p>
                    <p className="text-xs text-gray-400">Precisión</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{detalle.averageResponseTime.toFixed(1)}s</p>
                    <p className="text-xs text-gray-400">Tiempo promedio</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-emerald-600">+{detalle.puntosGanados}</p>
                    <p className="text-xs text-gray-400">Puntos ganados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-100">
                    <Shield className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-rose-600">-{detalle.puntosPerdidos}</p>
                    <p className="text-xs text-gray-400">Puntos perdidos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progreso */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <Card variant="default">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Progreso
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{detalle.preguntasRespondidas} de {detalle.totalQuestions} preguntas</span>
                  <span>{Math.round((detalle.preguntasRespondidas / detalle.totalQuestions) * 100)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                     className={`h-full rounded-full ${esEliminado ? 'bg-gradient-to-r from-red-300 to-red-400' : esLava ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-[#00A0B5] to-[#98C54E]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(detalle.preguntasRespondidas / detalle.totalQuestions) * 100}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detalle de respuestas */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card variant="default">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" /> Respuestas
              </h3>
              <div className="space-y-2">
                {detalle.answers.map((ans, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">{ans.questionText}</span>
                    <StatusBadge
                      label={ans.status === 'correct' ? <Check className="h-3 w-3" /> : ans.status === 'incorrect' ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      className={ans.status === 'correct' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ans.status === 'incorrect' ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}
                    />
                    <span className="shrink-0 text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ans.responseTime}s
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botón volver */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Button
            variant="outline"
            className="w-full border-2 border-[#00A0B5]/30 bg-[#00A0B5]/10 text-[#00A0B5] font-semibold hover:bg-[#00A0B5]/20 hover:border-[#00A0B5]/50"
            onClick={() => router.push(`/panel/salas/${salaId}/resultados`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a resultados
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
