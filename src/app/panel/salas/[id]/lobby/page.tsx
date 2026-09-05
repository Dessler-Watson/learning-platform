'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, UserPlus, Play, Users, Flame } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { PageHeader } from '../../../components/shared/PageHeader';
import { BackButton } from '../../../components/shared/BackButton';
import { usePanelStore } from '../../../store/usePanelStore';
import { audioManager } from '../../../lib/audio';
import { salasService } from '../../../services';
import { Sala } from '../../../types';
import { useClickLock } from '../../../hooks/useClickLock';
import { AnimatedBackground } from '../../../components/shared/AnimatedBackground';

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const salaId = params.id as string;
  const teacherId = usePanelStore((s) => s.docente?.id);
  const clickLock = useClickLock();
  const [sala, setSala] = useState<Sala | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salaId) return;
    salasService.obtenerPorId(salaId).then((s) => {
      setSala(s ?? null);
      setLoading(false);
    });
  }, [salaId]);

  const simulateJoin = useCallback(async () => {
    if (!salaId || !sala || sala.estado !== 'esperando') return;
    const result = await salasService.simularIngresoEstudiante(salaId);
    if (result) {
      audioManager.play('create');
      setSala({ ...result.sala });
    }
  }, [salaId, sala]);

  useEffect(() => {
    if (!sala || sala.estado !== 'esperando') return;
    const interval = setInterval(simulateJoin, 3000);
    return () => clearInterval(interval);
  }, [sala, simulateJoin]);

  const handleStart = async () => {
    if (!salaId || !clickLock()) return;
    audioManager.play('submit');
    const updated = await salasService.iniciar(salaId);
    if (updated) {
      setSala({ ...updated });
      audioManager.play('success');
      router.push(`/panel/salas/${salaId}/monitoreo`);
    }
  };

  const handleCopyCode = () => {
    if (!sala) return;
    navigator.clipboard.writeText(sala.codigo);
    audioManager.play('toggle');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A0B5] border-t-transparent" />
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

  return (
    <div className="relative z-10 space-y-6">
      {esLava && <AnimatedBackground variant="lava" />}
      <PageHeader title={sala.nombre} description="Sala de espera">
        <BackButton onClick={() => router.push('/panel/salas')} />
      </PageHeader>

      <div className="mx-auto max-w-lg space-y-4">
        <Card variant="cyan">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-gray-400">Código de la sala</p>
              {esLava && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600">
                  <Flame className="h-3 w-3" /> Modo Lava
                </span>
              )}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className={`text-4xl font-mono font-bold tracking-widest ${esLava ? 'text-[#FFA000]' : 'text-[#00A0B5]'}`}>{sala.codigo}</span>
              <button onClick={handleCopyCode} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 transition-colors">
                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">Comparte este código con tus estudiantes para que se unan</p>
          </CardContent>
        </Card>

        <Card variant="emerald">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${esLava ? 'text-[#FFA000]' : 'text-[#00A0B5]'}`} />
                <span className="text-sm font-bold text-foreground">Participantes</span>
              </div>
              <span className={`text-sm font-bold ${esLava ? 'text-[#FFA000]' : 'text-[#00A0B5]'}`}>{sala.participantes.length}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <AnimatePresence>
                {sala.participantes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Esperando participantes...</p>
                ) : (
                  sala.participantes.map((p, i) => (
                    <motion.div
                      key={p.estudianteId}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${esLava ? 'bg-[#FFA000]/10 text-[#FFA000]' : 'bg-[#00A0B5]/10 text-[#00A0B5]'}`}>
                        {p.nombre.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{p.nombre}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { if (clickLock()) simulateJoin(); }}
            disabled={sala.estado !== 'esperando'}
          >
            <UserPlus className="mr-2 h-4 w-4" /> Simular entrada
          </Button>
          <Button
            className={`flex-1 ${esLava ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
            onClick={handleStart}
            disabled={sala.participantes.length === 0 || sala.estado !== 'esperando'}
          >
            <Play className="mr-2 h-4 w-4" /> Iniciar
          </Button>
        </div>
      </div>
    </div>
  );
}
