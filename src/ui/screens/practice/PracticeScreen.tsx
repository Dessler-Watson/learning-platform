'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle,
  History, Trash2, Play, Globe, Search, Filter, Lock, LogIn, UserPlus,
  Eye, EyeOff, Users, BookOpen, X
} from 'lucide-react';
import { Background } from '@/ui/components/primitives/Background';
import { ModeLogo, MODE_THEME, modeButtonGradient, modeButtonShadow } from '@/shared/lib/game-modes';
import { audioManager } from '@/shared/lib/audio';
import { generateQuestions, GeneratedQuestion } from '@/app/panel/lib/aiGenerator';
import { usePracticeStore } from '@/stores/practice.store';
import type { Practice, PracticeMode, StoredUser } from '@/shared/types/practice';

type GameMode = 'decisiones' | 'lava' | 'tierras' | 'abismos' | null;
type TabView = 'create' | 'public' | 'history';

const USER_KEY = 'eduplay_user';
const LOADING_MESSAGES = [
  'Analizando el tema...',
  'Creando preguntas...',
  'Verificando respuestas...',
  'Preparando tu practica...',
];

function getUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function formatDateShort(ts: number): string {
  const d = new Date(ts);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

export function PracticeScreen() {
  const [tab, setTab] = useState<TabView>('create');
  const [selectedMode, setSelectedMode] = useState<GameMode>(null);
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(10);
  const [step, setStep] = useState<'config' | 'loading' | 'ready'>('config');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<PracticeMode | 'all'>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalContext, setAuthModalContext] = useState<'history' | 'publish'>('history');
  const [publishTargetId, setPublishTargetId] = useState<string | null>(null);

  const [user, setUser] = useState<StoredUser | null>(null);
  const isRegistered = user !== null && user.modo === 'registrado';

  const store = usePracticeStore();

  useEffect(() => {
    setUser(getUser());
    void usePracticeStore.getState().init();
  }, []);

  const userPractices = useMemo(() => {
    if (!user) return [];
    return store.getUserPractices();
  }, [store.practices, user]);

  const publicPractices = useMemo(() => {
    return store.searchPublicPractices(searchQuery, filterMode);
  }, [store.publicPractices, searchQuery, filterMode]);

  const startLoadingAnimation = () => {
    setMessageIndex(0);
    intervalRef.current = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2200);
  };

  const stopLoadingAnimation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleGenerate = async () => {
    if (!selectedMode) {
      audioManager.play('error');
      setError('Selecciona un modo de juego.');
      return;
    }
    if (!topic.trim()) {
      audioManager.play('error');
      setError('Escribe un tema sobre el que quieres practicar.');
      return;
    }
    if (amount < 5 || amount > 30) {
      audioManager.play('error');
      setError('La cantidad debe estar entre 5 y 30.');
      return;
    }

    audioManager.play('start');
    setError(null);
    setStep('loading');
    startLoadingAnimation();

    try {
      const result = await generateQuestions(topic, '', amount);
      if (result.length === 0) {
        throw new Error('Gemini devolvio un formato inesperado. Intenta generar nuevamente.');
      }
      setQuestions(result);
      const created = await store.addPractice(topic.trim(), topic.trim(), selectedMode!, result);
      if (!created) {
        throw new Error('Inicia sesion para guardar tus practicas.');
      }
      setStep('ready');
      audioManager.play('success');
    } catch (err) {
      audioManager.play('error');
      setError(
        err instanceof Error
          ? err.message
          : 'No pudimos generar tus preguntas. Intentalo nuevamente en unos momentos.'
      );
      setStep('config');
    } finally {
      stopLoadingAnimation();
    }
  };

  const handleStartPractice = async (practice: Practice) => {
    if (!practice.mode) return;
    audioManager.play('start');
    let qs = practice.questions;
    if (!qs || qs.length === 0) {
      qs = await store.loadQuestions(practice.id);
    }
    if (!qs.length) return;
    const data = { mode: practice.mode, questions: qs, topic: practice.topic, practiceId: practice.id };
    sessionStorage.setItem('eduplay_practice', JSON.stringify(data));
    window.location.href = '/practica/jugar';
  };

  const handleStartPracticeFromConfig = async () => {
    if (questions.length === 0 || !selectedMode) return;
    audioManager.play('start');
    const latestPractice = store.getUserPractices()[0];
    if (latestPractice) {
      await handleStartPractice(latestPractice);
    }
  };

  const handleBack = () => {
    audioManager.play('back');
    window.location.href = '/inicio';
  };

  const handleTabChange = (newTab: TabView) => {
    audioManager.play('click');
    if (newTab === 'history' && !isRegistered) {
      setAuthModalContext('history');
      setShowAuthModal(true);
      return;
    }
    setTab(newTab);
    if (newTab === 'create') {
      setStep('config');
      setQuestions([]);
      setTopic('');
      setSelectedMode(null);
    }
  };

  const handlePublish = async (practiceId: string) => {
    if (!isRegistered) {
      setAuthModalContext('publish');
      setShowAuthModal(true);
      return;
    }
    audioManager.play('confirm');
    await store.publishPractice(practiceId);
  };

  const handleUnpublish = async (practiceId: string) => {
    audioManager.play('click');
    await store.unpublishPractice(practiceId);
  };

  const handleDeletePractice = async (practiceId: string) => {
    audioManager.play('delete');
    await store.deletePractice(practiceId);
  };

  return (
    <main className="relative min-h-screen px-5 pb-10 pt-6">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-md"
      >
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFEF5A] text-[#407516] shadow-card"
            style={{ boxShadow: '0 4px 0 rgba(64, 117, 22, 0.2), 0 6px 20px rgba(255, 239, 90, 0.25)' }}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-surface-800">Modo practica</h1>
            <p className="text-xs font-bold text-surface-500">Practica por tu cuenta</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <TabButton
            icon={<Brain size={16} />}
            label="Crear"
            active={tab === 'create'}
            onClick={() => handleTabChange('create')}
          />
          <TabButton
            icon={<Globe size={16} />}
            label="Publicas"
            active={tab === 'public'}
            onClick={() => handleTabChange('public')}
          />
          <TabButton
            icon={isRegistered ? <History size={16} /> : <Lock size={16} />}
            label={isRegistered ? 'Mi historial' : 'Historial'}
            active={tab === 'history'}
            onClick={() => handleTabChange('history')}
            locked={!isRegistered}
          />
        </div>

        <AnimatePresence mode="wait">
          {/* CREATE TAB */}
          {tab === 'create' && step === 'config' && (
            <motion.div
              key="create-config"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div>
                <h3 className="mb-3 text-sm font-black text-surface-700">Selecciona el modo de juego</h3>
                <div className="grid grid-cols-2 gap-3">
                  <ModeCard
                    mode="decisiones"
                    label="Rumbo"
                    selected={selectedMode === 'decisiones'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('decisiones'); setError(null); }}
                  />
                  <ModeCard
                    mode="lava"
                    label="Bajo Presion"
                    selected={selectedMode === 'lava'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('lava'); setError(null); }}
                  />
                  <ModeCard
                    mode="tierras"
                    label="Tierras Hundidas"
                    selected={selectedMode === 'tierras'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('tierras'); setError(null); }}
                  />
                  <ModeCard
                    mode="abismos"
                    label="Entre Abismos"
                    selected={selectedMode === 'abismos'}
                    onClick={() => { audioManager.play('select'); setSelectedMode('abismos'); setError(null); }}
                  />
                </div>
              </div>

              <div className="card-game p-5">
                <h3 className="mb-3 text-sm font-black text-surface-700">Genera tus preguntas</h3>
                <label className="mb-1 block text-xs font-bold text-surface-500">Tema</label>
                <input
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setError(null); }}
                  placeholder="¿Sobre que quieres practicar?"
                  className="input-game w-full rounded-xl px-4 py-3 text-sm font-bold"
                />
              </div>

              <div className="card-game p-5">
                <label className="mb-3 block text-xs font-bold text-surface-500">Cantidad de preguntas</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[5, 10, 15, 20, 25, 30].map((n) => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { audioManager.play('select'); setAmount(n); }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black transition-all duration-200"
                      style={{
                        borderColor: amount === n ? '#00A0B5' : 'rgba(0,0,0,0.08)',
                        background: amount === n ? 'rgba(0, 160, 181, 0.1)' : '#fff',
                        color: amount === n ? '#00A0B5' : '#8A7A6A',
                      }}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-2xl border-2 border-[#EB5D70]/20 bg-[#EB5D70]/5 p-4 text-sm font-bold text-[#EB5D70]"
                >
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={handleGenerate}
                className="w-full rounded-2xl px-6 py-4 text-base font-black text-white shadow-game"
                style={{
                  background: 'linear-gradient(90deg, #00A0B5 0%, #008A9D 100%)',
                  boxShadow: '0 6px 0 rgba(0, 100, 120, 0.35), 0 8px 24px rgba(0, 160, 181, 0.3)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={18} />
                  Generar preguntas
                </span>
              </motion.button>
            </motion.div>
          )}

          {tab === 'create' && step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-game flex flex-col items-center justify-center py-16 gap-6"
            >
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-[#00A0B5]/20 border-t-[#00A0B5]" />
                <Sparkles size={24} className="absolute inset-0 m-auto text-[#FFA000] animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black text-surface-800">{LOADING_MESSAGES[messageIndex]}</p>
                <p className="text-sm font-bold text-surface-500">Generando {amount} preguntas...</p>
              </div>
            </motion.div>
          )}

          {tab === 'create' && step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="card-game p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#98C54E]/15"
                >
                  <CheckCircle2 size={32} className="text-[#98C54E]" />
                </motion.div>
                <h3 className="mb-1 text-xl font-black text-surface-800">¡Preguntas listas!</h3>
                <p className="text-sm font-bold text-surface-500">
                  {questions.length} preguntas generadas sobre &quot;{topic.trim()}&quot;
                </p>
              </div>

              <div className="card-game p-4 flex items-center gap-3" style={{ overflow: 'visible' }}>
                <ModeLogo mode={selectedMode} size={40} shape="square" imgScale={1} />
                <div>
                  <p className="text-xs font-bold text-surface-500">Jugarás en</p>
                  <p className="text-sm font-black text-surface-800">
                    {selectedMode === 'decisiones' ? 'Rumbo' :
                     selectedMode === 'tierras' ? 'Tierras Hundidas' :
                     selectedMode === 'abismos' ? 'Entre Abismos' :
                     'Bajo Presión'}
                  </p>
                </div>
                <button
                  onClick={() => { audioManager.play('click'); setStep('config'); setQuestions([]); }}
                  className="ml-auto text-xs font-bold text-[#00A0B5]"
                >
                  Cambiar
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98, y: 2 }}
                onClick={handleStartPracticeFromConfig}
                className="w-full rounded-2xl px-6 py-4 text-base font-black text-white shadow-game"
                style={{
                  background: modeButtonGradient(selectedMode ?? 'decisiones'),
                  boxShadow: modeButtonShadow(selectedMode ?? 'decisiones'),
                }}
              >
                Iniciar practica
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { audioManager.play('back'); setStep('config'); setQuestions([]); }}
                className="w-full rounded-2xl border-2 border-surface-200 bg-white px-6 py-3 text-sm font-black text-surface-600 shadow-card"
              >
                Volver a configurar
              </motion.button>
            </motion.div>
          )}

          {/* PUBLIC PRACTICES TAB */}
          {tab === 'public' && (
            <motion.div
              key="public"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por titulo, tema, creador o #codigo..."
                  className="input-game w-full rounded-xl pl-10 pr-10 py-3 text-sm font-bold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <FilterChip
                  label="Todas"
                  active={filterMode === 'all'}
                  onClick={() => setFilterMode('all')}
                />
                <FilterChip
                  label="Rumbo"
                  active={filterMode === 'decisiones'}
                  onClick={() => setFilterMode('decisiones')}
                  color={MODE_THEME.decisiones.color}
                />
                <FilterChip
                  label="Bajo Presión"
                  active={filterMode === 'lava'}
                  onClick={() => setFilterMode('lava')}
                  color={MODE_THEME.lava.color}
                />
                <FilterChip
                  label="Tierras"
                  active={filterMode === 'tierras'}
                  onClick={() => setFilterMode('tierras')}
                  color={MODE_THEME.tierras.color}
                />
                <FilterChip
                  label="Abismos"
                  active={filterMode === 'abismos'}
                  onClick={() => setFilterMode('abismos')}
                  color={MODE_THEME.abismos.color}
                />
              </div>

              {/* Results count */}
              <p className="text-xs font-bold text-surface-500">
                {publicPractices.length} practica{publicPractices.length !== 1 ? 's' : ''} publica{publicPractices.length !== 1 ? 's' : ''}
              </p>

              {/* Practice cards */}
              {publicPractices.length === 0 ? (
                <div className="card-game p-8 text-center">
                  <Globe size={32} className="mx-auto mb-3 text-surface-300" />
                  <p className="text-sm font-bold text-surface-500">No se encontraron practicas</p>
                  <p className="text-xs text-surface-400">
                    {searchQuery ? 'Intenta con otro termino' : 'Aun no hay practicas publicas disponibles'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {publicPractices.map((practice) => (
                    <PublicPracticeCard
                      key={practice.id}
                      practice={practice}
                      onPlay={() => handleStartPractice(practice)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && isRegistered && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-surface-700">Mis practicas</h3>
                <span className="text-xs font-bold text-surface-400">
                  {userPractices.length} practica{userPractices.length !== 1 ? 's' : ''}
                </span>
              </div>

              {userPractices.length === 0 ? (
                <div className="card-game p-8 text-center">
                  <History size={32} className="mx-auto mb-3 text-surface-300" />
                  <p className="text-sm font-bold text-surface-500">Aun no tienes practicas guardadas.</p>
                  <p className="text-xs text-surface-400">Crea una practica y se guardara automaticamente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPractices.map((practice) => (
                    <HistoryPracticeCard
                      key={practice.id}
                      practice={practice}
                      onPlay={() => handleStartPractice(practice)}
                      onPublish={() => handlePublish(practice.id)}
                      onUnpublish={() => handleUnpublish(practice.id)}
                      onDelete={() => handleDeletePractice(practice.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            context={authModalContext}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function TabButton({
  icon,
  label,
  active,
  onClick,
  locked,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center transition-all duration-200"
      style={{
        background: active ? 'rgba(0, 160, 181, 0.1)' : '#fff',
        border: active ? '2px solid #00A0B5' : '2px solid transparent',
        boxShadow: active ? '0 4px 0 rgba(0, 160, 181, 0.15)' : '0 4px 0 rgba(0,0,0,0.04)',
        opacity: locked && !active ? 0.6 : 1,
      }}
    >
      <span style={{ color: active ? '#00A0B5' : locked ? '#8A7A6A' : '#8A7A6A' }}>{icon}</span>
      <span
        className="text-[10px] font-black leading-tight"
        style={{ color: active ? '#00A0B5' : '#8A7A6A' }}
      >
        {label}
      </span>
      {locked && (
        <Lock size={10} className="text-surface-400" />
      )}
    </motion.button>
  );
}

function ModeCard({
  mode,
  label,
  selected,
  onClick,
}: {
  mode: 'decisiones' | 'lava' | 'tierras' | 'abismos';
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const theme = MODE_THEME[mode];
  const color = theme.color;
  const bgColor = theme.bg;

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="card-game p-4 text-left transition-all duration-200"
      style={{
        border: selected ? `2px solid ${color}` : '2px solid transparent',
        background: selected ? bgColor : '#fff',
        boxShadow: selected ? `0 4px 0 ${color}30, 0 6px 20px ${color}20` : undefined,
        overflow: 'visible',
      }}
    >
      <ModeLogo mode={mode} size={40} shape="square" className="mb-2" imgScale={1} />
      <p className="text-xs font-black text-surface-800 leading-tight">{label}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-2 flex items-center gap-1 text-[10px] font-black"
          style={{ color }}
        >
          <CheckCircle2 size={12} />
          Seleccionado
        </motion.div>
      )}
    </motion.button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="rounded-full px-4 py-2 text-xs font-black transition-all duration-200"
      style={{
        background: active
          ? color
            ? `${color}20`
            : 'rgba(0, 160, 181, 0.15)'
          : '#f5f0ea',
        color: active
          ? color || '#00A0B5'
          : '#8A7A6A',
        border: active
          ? `2px solid ${color || '#00A0B5'}`
          : '2px solid transparent',
      }}
    >
      {label}
    </motion.button>
  );
}

function PublicPracticeCard({
  practice,
  onPlay,
}: {
  practice: Practice;
  onPlay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-game p-4"
      style={{ overflow: 'visible' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ModeLogo mode={practice.mode} size={22} shape="square" imgScale={1} />
            <span className="text-sm font-black text-surface-800 truncate">{practice.title}</span>
          </div>
          <p className="text-[10px] font-bold text-surface-400 mb-1">
            {practice.description || practice.topic}
          </p>
          <div className="flex items-center gap-3 text-[10px] font-bold text-surface-400">
            <span className="flex items-center gap-1">
              <Users size={10} />
              {practice.creatorName}
            </span>
            <span>{practice.questionCount} preguntas</span>
            <span>{practice.playCount} jugadas</span>
          </div>
          {practice.code && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-black text-surface-500">
              #{practice.code}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlay}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white"
          style={{
            background: modeButtonGradient(practice.mode),
            boxShadow: modeButtonShadow(practice.mode),
          }}
        >
          <Play size={14} />
          Jugar
        </motion.button>
      </div>
    </motion.div>
  );
}

function HistoryPracticeCard({
  practice,
  onPlay,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  practice: Practice;
  onPlay: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-game p-4"
      style={{ overflow: 'visible' }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ModeLogo mode={practice.mode} size={22} shape="square" imgScale={1} />
            <span className="text-xs font-black text-surface-800 truncate">{practice.topic}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-surface-400">
            <span>{practice.questionCount} preguntas</span>
            <span>{formatDate(practice.createdAt)}</span>
            {practice.isPublic && (
              <span className="flex items-center gap-1 text-[#00A0B5]">
                <Globe size={10} />
                Publica
              </span>
            )}
            {!practice.isPublic && (
              <span className="flex items-center gap-1 text-surface-400">
                <Lock size={10} />
                Privada
              </span>
            )}
            {practice.code && (
              <span className="font-black text-surface-500">#{practice.code}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onPlay}
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: MODE_THEME[practice.mode].bg,
              color: MODE_THEME[practice.mode].colorDark,
            }}
            title="Jugar"
          >
            <Play size={14} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowActions(!showActions)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-100 text-surface-500"
            title="Mas opciones"
          >
            <Filter size={14} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 pt-2 border-t border-surface-100">
              {practice.isPublic ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onUnpublish}
                  className="flex items-center gap-1.5 rounded-lg bg-[#FFA000]/10 px-3 py-1.5 text-[10px] font-black text-[#FFA000]"
                >
                  <EyeOff size={12} />
                  Dejar de publicar
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onPublish}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00A0B5]/10 px-3 py-1.5 text-[10px] font-black text-[#00A0B5]"
                >
                  <Globe size={12} />
                  Publicar
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDelete}
                className="flex items-center gap-1.5 rounded-lg bg-[#EB5D70]/10 px-3 py-1.5 text-[10px] font-black text-[#EB5D70]"
              >
                <Trash2 size={12} />
                Eliminar
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AuthModal({
  context,
  onClose,
}: {
  context: 'history' | 'publish';
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative z-10 w-full max-w-sm rounded-[28px] border-2 border-white/70 bg-edu-cream/95 p-7 shadow-game-lg backdrop-blur-xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFEF5A]/20">
            {context === 'history' ? (
              <History size={28} className="text-[#FFA000]" />
            ) : (
              <Globe size={28} className="text-[#00A0B5]" />
            )}
          </div>

          <h2 className="mb-2 text-xl font-black text-surface-800">Necesitas una cuenta</h2>
          <p className="text-sm font-bold text-surface-500 mb-6">
            {context === 'history'
              ? 'Para guardar y consultar tu historial de practicas necesitas crear una cuenta.'
              : 'Para publicar tus practicas y compartirlas con otros jugadores necesitas crear una cuenta.'}
          </p>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97, y: 2 }}
              onClick={() => {
                audioManager.play('navigate');
                window.location.href = '/registro';
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#407516] px-6 py-3.5 text-sm font-black text-white shadow-game"
              style={{ boxShadow: '0 6px 0 rgba(64, 117, 22, 0.4), 0 8px 24px rgba(64,117,22,0.3)' }}
            >
              <UserPlus size={18} />
              Crear cuenta
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                audioManager.play('navigate');
                window.location.href = '/ingresar';
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-surface-200 bg-white px-6 py-3 text-sm font-black text-surface-600 shadow-card"
            >
              <LogIn size={18} />
              Ya tengo cuenta
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { audioManager.play('modalClose'); onClose(); }}
              className="w-full rounded-xl px-6 py-3 text-sm font-black text-surface-400"
            >
              Cerrar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
