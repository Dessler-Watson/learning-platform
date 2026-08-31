'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, AlertTriangle, Users, Flame, Check, X, Minus, Skull, ChevronRight } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { PageHeader } from '../../../components/shared/PageHeader';
import { BackButton } from '../../../components/shared/BackButton';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { audioManager } from '../../../lib/audio';
import { salasService } from '../../../services';
import { Sala, PreguntaDificil } from '../../../types';
import { AnimatedBackground } from '../../../components/shared/AnimatedBackground';

export default function ResultadosPage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params.id as string;
  const [sala, setSala] = useState<Sala | null>(null);
  const [preguntasDificiles, setPreguntasDificiles] = useState<PreguntaDificil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaId) return;
    salasService.obtenerPorId(salaId).then(async (s) => {
      if (!s) { setLoading(false); return; }
      setSala(s);
      const difs = await salasService.obtenerPreguntasDificiles(s.id);
      setPreguntasDificiles(difs);
      setLoading(false);
    });
  }, [salaId]);

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
  const totalParticipantes = sala.participantes.length;
  const completados = sala.participantes.filter((p) => p.estado === 'finalizado').length;
  const eliminados = sala.participantes.filter((p) => p.estado === 'eliminado').length;
  const promedioPuntos = totalParticipantes > 0 ? Math.round(sala.participantes.reduce((a, p) => a + p.puntosNetos, 0) / totalParticipantes) : 0;
  const ranking = [...sala.participantes].sort((a, b) => b.puntosNetos - a.puntosNetos);

  return (
    <div className="relative z-10 space-y-6">
      {esLava && <AnimatedBackground variant="lava" />}
      <PageHeader title={`Resultados — ${sala.nombre}`} description="Resumen de la sesión">
        <BackButton onClick={() => router.push('/panel/salas')} />
      </PageHeader>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Participantes', value: totalParticipantes, icon: Users, color: esLava ? 'text-orange-500 bg-orange-50' : 'text-cyan-500 bg-cyan-50' },
            { label: 'Completados', value: completados, icon: Trophy, color: 'text-emerald-500 bg-emerald-50' },
            { label: 'Eliminados', value: eliminados, icon: AlertTriangle, color: esLava ? 'text-red-500 bg-red-50' : 'text-rose-500 bg-rose-50' },
            { label: 'Promedio', value: promedioPuntos, icon: TrendingUp, color: 'text-amber-500 bg-amber-50' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08 }}>
              <Card variant={i === 0 ? 'cyan' : i === 1 ? 'emerald' : i === 2 ? 'rose' : 'amber'}>
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Ranking */}
        <Card variant="amber">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Ranking
            </h3>
            <div className="space-y-2">
              {ranking.map((p, i) => {
                const eliminadoLava = esLava && p.estado === 'eliminado';
                return (
                <motion.div
                  key={p.estudianteId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  onClick={() => { audioManager.play('select'); router.push(`/panel/salas/${salaId}/resultados/${p.estudianteId}`); }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition-all ${
                    eliminadoLava
                      ? 'bg-red-50/60 border border-red-200/60 shadow-sm'
                      : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    eliminadoLava
                      ? 'bg-red-100 text-red-500'
                      : esLava ? 'bg-orange-100 text-orange-600' : 'bg-cyan-100 text-cyan-600'
                  }`}>
                    {eliminadoLava ? <Skull className="h-4 w-4" /> : p.nombre.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-foreground">{p.nombre}</span>
                  <StatusBadge label={p.estado === 'eliminado' ? 'Eliminado' : 'Completado'} className={p.estado === 'eliminado' ? (esLava ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-rose-50 text-rose-600 border border-rose-200') : 'bg-emerald-50 text-emerald-600 border border-emerald-200'} />
                  <span className={`text-lg font-bold ${eliminadoLava ? 'text-red-400' : esLava ? 'text-orange-500' : 'text-cyan-500'}`}>{p.puntosNetos}</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hard questions */}
        {preguntasDificiles.length > 0 && (
          <Card variant="rose">
            <CardContent className="p-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Preguntas difíciles
              </h3>
              <div className="space-y-2">
                {preguntasDificiles.slice(0, 5).map((pd) => (
                  <div key={pd.preguntaId} className="rounded-2xl bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400">#{pd.posicion}</span>
                      <span className={`text-xs font-bold ${pd.porcentajeCorrectas < 40 ? 'text-rose-500' : 'text-amber-500'}`}>{pd.porcentajeCorrectas}% correctas</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">{pd.enunciado}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
