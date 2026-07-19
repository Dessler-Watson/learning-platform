'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import PreguntaForm from '@/components/forms/PreguntaForm';
import { Pregunta, CreatePreguntaDTO } from '@/types';

export default function PreguntasPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([
    {
      id_pregunta: 1,
      categoria_id: 1,
      pregunta: '¿Cuál es la capital de Francia?',
      opcion_a: 'Madrid',
      opcion_b: 'París',
      opcion_c: 'Roma',
      opcion_d: 'Berlín',
      respuesta_correcta: 'b',
      dificultad: 'facil',
      puntos: 10,
    },
    {
      id_pregunta: 2,
      categoria_id: 3,
      pregunta: '¿Cuánto es 2 + 2?',
      opcion_a: '3',
      opcion_b: '4',
      opcion_c: '5',
      opcion_d: '6',
      respuesta_correcta: 'b',
      dificultad: 'facil',
      puntos: 10,
    },
    {
      id_pregunta: 3,
      categoria_id: 5,
      pregunta: '¿En qué año llegó Colón a América?',
      opcion_a: '1492',
      opcion_b: '1500',
      opcion_c: '1450',
      opcion_d: '1520',
      respuesta_correcta: 'a',
      dificultad: 'media',
      puntos: 15,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState<Pregunta | null>(null);
  const [filtroMundo, setFiltroMundo] = useState<string>('todos');
  const [filtroDificultad, setFiltroDificultad] = useState<string>('todas');

  const mundos = [
    { value: 'todos', label: 'Todos los mundos' },
    { value: 'mundo1', label: '🛤️ Mundo 1: El Camino de las Decisiones' },
    { value: 'mundo2', label: '🌋 Mundo 2: La Lava del Conocimiento' },
    { value: 'mundo3', label: '⚔️ Mundo 3: Desafío de Conocimiento' },
  ];

  const dificultades = [
    { value: 'todas', label: 'Todas las dificultades' },
    { value: 'facil', label: '🟢 Fácil' },
    { value: 'media', label: '🟡 Media' },
    { value: 'dificil', label: '🔴 Difícil' },
  ];

  const handleCreate = (data: CreatePreguntaDTO) => {
    const nuevaPregunta: Pregunta = {
      ...data,
      id_pregunta: preguntas.length + 1,
    };
    setPreguntas([...preguntas, nuevaPregunta]);
    setShowForm(false);
  };

  const handleUpdate = (data: CreatePreguntaDTO) => {
    if (editingPregunta) {
      setPreguntas(
        preguntas.map((p) =>
          p.id_pregunta === editingPregunta.id_pregunta ? { ...p, ...data } : p
        )
      );
      setEditingPregunta(null);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      setPreguntas(preguntas.filter((p) => p.id_pregunta !== id));
    }
  };

  const filteredPreguntas = preguntas.filter((p) => {
    const mundoMatch = filtroMundo === 'todos' || 
      (filtroMundo === 'mundo1' && p.categoria_id <= 2) ||
      (filtroMundo === 'mundo2' && p.categoria_id >= 3 && p.categoria_id <= 4) ||
      (filtroMundo === 'mundo3' && p.categoria_id >= 5);
    
    const dificultadMatch = filtroDificultad === 'todas' || p.dificultad === filtroDificultad;
    
    return mundoMatch && dificultadMatch;
  });

  const getMundoInfo = (categoriaId: number) => {
    if (categoriaId <= 2) return { nombre: 'Mundo 1', color: 'bg-blue-100 text-blue-700', icon: '🛤️' };
    if (categoriaId <= 4) return { nombre: 'Mundo 2', color: 'bg-red-100 text-red-700', icon: '🌋' };
    return { nombre: 'Mundo 3', color: 'bg-purple-100 text-purple-700', icon: '⚔️' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Preguntas</h1>
            <p className="text-gray-600 mt-1">Administra el contenido de aprendizaje</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Pregunta
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Preguntas</p>
                <p className="text-3xl font-bold text-gray-900">{preguntas.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fáciles</p>
                <p className="text-3xl font-bold text-gray-900">
                  {preguntas.filter(p => p.dificultad === 'facil').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🟢</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Difíciles</p>
                <p className="text-3xl font-bold text-gray-900">
                  {preguntas.filter(p => p.dificultad === 'dificil').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <Card title="Crear Nueva Pregunta" subtitle="Completa los campos para agregar una nueva pregunta">
            <PreguntaForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </Card>
        )}

        {editingPregunta && (
          <Card title="Editar Pregunta" subtitle="Modifica los campos necesarios">
            <PreguntaForm
              initialData={editingPregunta}
              onSubmit={handleUpdate}
              onCancel={() => setEditingPregunta(null)}
            />
          </Card>
        )}

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Select
              label="Filtrar por Mundo"
              value={filtroMundo}
              onChange={(e) => setFiltroMundo(e.target.value)}
              options={mundos}
            />
            <Select
              label="Filtrar por Dificultad"
              value={filtroDificultad}
              onChange={(e) => setFiltroDificultad(e.target.value)}
              options={dificultades}
            />
          </div>

          <div className="space-y-3">
            {filteredPreguntas.map((pregunta) => {
              const mundoInfo = getMundoInfo(pregunta.categoria_id);
              return (
                <div
                  key={pregunta.id_pregunta}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${mundoInfo.color}`}>
                          {mundoInfo.icon} {mundoInfo.nombre}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          pregunta.dificultad === 'facil' ? 'bg-green-100 text-green-700' :
                          pregunta.dificultad === 'media' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {pregunta.dificultad}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                          {pregunta.puntos} pts
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{pregunta.pregunta}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded-lg text-sm ${
                          pregunta.respuesta_correcta === 'a' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
                        }`}>
                          <span className="font-semibold">A:</span> {pregunta.opcion_a}
                        </div>
                        <div className={`p-2 rounded-lg text-sm ${
                          pregunta.respuesta_correcta === 'b' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
                        }`}>
                          <span className="font-semibold">B:</span> {pregunta.opcion_b}
                        </div>
                        {pregunta.opcion_c && (
                          <div className={`p-2 rounded-lg text-sm ${
                            pregunta.respuesta_correcta === 'c' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
                          }`}>
                            <span className="font-semibold">C:</span> {pregunta.opcion_c}
                          </div>
                        )}
                        {pregunta.opcion_d && (
                          <div className={`p-2 rounded-lg text-sm ${
                            pregunta.respuesta_correcta === 'd' ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
                          }`}>
                            <span className="font-semibold">D:</span> {pregunta.opcion_d}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setEditingPregunta(pregunta)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(pregunta.id_pregunta)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPreguntas.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-gray-500 text-lg font-medium">No se encontraron preguntas</p>
              <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros o crea una nueva pregunta</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
