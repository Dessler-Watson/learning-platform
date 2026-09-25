'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy, CheckCircle, XCircle, Clock, Home, Target, Timer, Skull, Zap, Shield, Hourglass, ArrowLeft,
} from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { avatarUrl } from '@/lib/avatares';
import { audioManager } from '@/shared/lib/audio';
import { fetchMatchResult, getMatchRoomId, type MatchResultDTO } from '@/lib/partida-client';

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function estadoLabel(estado: string): string {
  if (estado === 'finished') return 'Completado';
  if (estado === 'eliminated') return 'Eliminado';
  if (estado === 'playing') return 'En curso';
  return 'Esperando';
}

export function StudentResultsScreen() {
  const searchParams = useSearchParams();
  const salaId = searchParams.get('sala') || getMatchRoomId();

  const [data, setData] = useState<MatchResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaId) {
      setError('No se indicó la sala');
      setLoading(false);
      return;
    }
    let cancelado = false;
    fetchMatchResult(salaId)
      .then((res) => {
        if (!cancelado) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelado) {
          setError(err.message || 'No se pudieron cargar los resultados');
          setLoading(false);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [salaId]);

  if (loading) {
    return (
      <main className="relative min-h-screen px-4 pb-12 pt-6">
        <Background />
        <div className="relative z-10 mx-auto mt-32 flex max-w-lg justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00A0B5] border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative min-h-screen px-4 pb-12 pt-6">
        <Background />
        <div className="relative z-10 mx-auto mt-24 max-w-lg rounded-3xl bg-white/85 p-6 text-center shadow-card">
          <p className="mb-2 text-lg font-black text-surface-800">No hay resultados disponibles</p>
          <p className="mb-6 text-sm font-bold text-surface-500">{error ?? 'Error inesperado'}</p>
          <button
            onClick={() => {
              audioManager.play('click');
              window.location.href = '/inicio';
            }}
            className="btn-game inline-flex items-center gap-2 rounded-xl bg-edu-blue px-6 py-3 text-sm text-white"
          >
            <ArrowLeft size={16} /> Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  const { yo, partida, ranking, respuestas, sala } = data;
  const eliminado = yo.estado === 'eliminated';
  const enCurso = partida.status !== 'finished';

  const stats = [
    { label: 'Puntos', value: String(yo.score), icon: Trophy, color: 'text-amber-500 bg-amber-50' },
    { label: 'Aciertos', value: `${yo.porcentaje}%`, icon: Target, color: 'text-[#00A0B5] bg-[#00A0B5]/10' },
    { label: 'Correctas', value: `${yo.correctas}/${partida.total_preguntas}`, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Fallas', value: String(yo.incorrectas), icon: XCircle, color: 'text-rose-500 bg-rose-50' },
    { label: 'Timeouts', value: String(yo.timeouts), icon: Timer, color: 'text-orange-500 bg-orange-50' },
    { label: 'Sin responder', value: String(yo.sin_responder), icon: Hourglass, color: 'text-purple-500 bg-purple-50' },
  ];

  return (
    <main className="relative min-h-screen px-4 pb-12 pt-6">
      <Background />
      <div className="relative z-10 mx-auto max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              audioManager.play('click');
              window.location.href = '/inicio';
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-surface-500 shadow-card transition hover:bg-white"
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-black text-surface-800">Resultados</h1>
            <p className="text-xs font-bold text-surface-400">{sala.nombre}</p>
          </div>
          <div className="h-10 w-10" />
        </div>

        {/* Estado + duración */}
        <div className="flex items-center justify-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${
              eliminado
                ? 'bg-red-50 text-red-600 border border-red-200'
                : enCurso
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}
          >
            {eliminado ? (
              <span className="flex items-center gap-1"><Skull size={12} /> Eliminado{yo.eliminado_en ? ` en la pregunta ${yo.eliminado_en}` : ''}</span>
            ) : (
              estadoLabel(yo.estado)
            )}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-surface-500 border border-surface-200">
            <Clock size={12} /> {formatTimeMs(partida.duracion_ms)}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-surface-500 border border-surface-200">
            <Trophy size={12} /> #{yo.posicion} de {yo.total_jugadores}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-surface-200 bg-white/85 p-3 text-center shadow-card"
            >
              <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon size={16} />
              </div>
              <p className="text-lg font-black text-surface-800">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-surface-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Ranking */}
        <div className="rounded-3xl border border-surface-200 bg-white/85 p-4 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-surface-700">
            <Trophy size={15} className="text-amber-500" /> Ranking de la partida
          </h3>
          <div className="space-y-2">
            {ranking.map((r, idx) => {
              const esYo = r.user_id === yo.user_id;
              return (
                <motion.div
                  key={r.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
                    esYo ? 'border-emerald-300 bg-emerald-50/70' : 'border-transparent bg-gray-50/70'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      r.posicion === 1
                        ? 'bg-amber-400 text-white'
                        : r.posicion === 2
                          ? 'bg-gray-300 text-white'
                          : r.posicion === 3
                            ? 'bg-orange-300 text-white'
                            : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {r.posicion}
                  </span>
                  <img
                    src={avatarUrl(r.avatar_id ?? 1)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-surface-800">
                      {r.nombre}
                      {esYo && (
                        <span className="ml-1.5 rounded-full bg-edu-green px-1.5 py-0.5 text-[9px] font-black uppercase text-white">TÚ</span>
                      )}
                    </p>
                    <p className="text-[10px] font-bold text-surface-400">{estadoLabel(r.estado)}</p>
                  </div>
                  <span className="text-sm font-black text-surface-800">{r.score}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mis respuestas */}
        <div className="rounded-3xl border border-surface-200 bg-white/85 p-4 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-surface-700">
            <Zap size={15} className="text-[#00A0B5]" /> Tus respuestas
          </h3>
          <div className="space-y-2">
            {respuestas.length === 0 && (
              <p className="text-center text-xs font-bold text-surface-400">Sin respuestas registradas</p>
            )}
            {respuestas.map((a) => (
              <div key={a.posicion} className="rounded-2xl bg-gray-50/80 px-3 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black text-surface-400">#{a.posicion + 1}</span>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-black ${
                      a.is_correct ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {a.is_correct ? <CheckCircle size={12} /> : a.timed_out ? <Timer size={12} /> : <XCircle size={12} />}
                    {a.is_correct ? 'Correcta' : a.timed_out ? 'Tiempo agotado' : 'Incorrecta'}
                    <span className="ml-1 text-surface-400">{a.puntos > 0 ? `+${a.puntos}` : a.puntos}</span>
                  </span>
                </div>
                <p className="mb-0.5 truncate text-xs font-bold text-surface-700">{a.pregunta}</p>
                <p className="truncate text-[11px] font-bold text-surface-500">
                  {a.timed_out ? (
                    <span className="text-orange-500">Sin respuesta</span>
                  ) : (
                    <>Tu respuesta: <span className={a.is_correct ? 'text-emerald-600' : 'text-rose-500'}>{a.elegida ?? '—'}</span></>
                  )}
                  {!a.is_correct && !a.timed_out && a.correcta && (
                    <span className="text-emerald-600"> · Correcta: {a.correcta}</span>
                  )}
                </p>
              </div>
            ))}
            {yo.sin_responder > 0 && (
              <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-500">
                <Shield size={12} /> {yo.sin_responder} pregunta{yo.sin_responder > 1 ? 's' : ''} sin responder
              </p>
            )}
          </div>
        </div>

        {/* Salir */}
        <button
          onClick={() => {
            audioManager.play('click');
            window.location.href = '/inicio';
          }}
          className="btn-game flex w-full items-center justify-center gap-2 rounded-xl bg-edu-blue py-3 text-sm text-white"
          style={{ boxShadow: '0 5px 0 rgba(0, 138, 157, 0.4), 0 6px 18px rgba(0,160,181,0.3)' }}
        >
          <Home size={16} /> Salir al menú
        </button>
      </div>
    </main>
  );
}
