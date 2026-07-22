'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

export default function EstadisticasPage() {
  const [mundoSeleccionado, setMundoSeleccionado] = useState<string>('todos');

  const mundos = [
    { value: 'todos', label: 'Todos los mundos' },
    { value: 'mundo1', label: '🛤️ Mundo 1: El Camino de las Decisiones' },
    { value: 'mundo2', label: '🌋 Mundo 2: La Lava del Conocimiento' },
    { value: 'mundo3', label: '⚔️ Mundo 3: Desafío de Conocimiento' },
  ];

  const estadisticasGenerales = [
    { label: 'Total de Usuarios', valor: '1,234', cambio: '+12%', positivo: true, icon: '👥', gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Partidas Jugadas', valor: '7,890', cambio: '+23%', positivo: true, icon: '🎮', gradient: 'from-purple-500 to-pink-500' },
    { label: 'Tasa de Completado', valor: '78%', cambio: '+5%', positivo: true, icon: '✅', gradient: 'from-green-500 to-emerald-500' },
    { label: 'Tiempo Promedio', valor: '4.5 min', cambio: '-8%', positivo: false, icon: '⏱️', gradient: 'from-orange-500 to-red-500' },
  ];

  const estadisticasPorMundo = [
    {
      mundo: 'El Camino de las Decisiones',
      numero: 'Mundo 1',
      partidas: 2450,
      usuarios: 890,
      completado: 82,
      tiempoPromedio: 4.2,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      icon: '🛤️'
    },
    {
      mundo: 'La Lava del Conocimiento',
      numero: 'Mundo 2',
      partidas: 3120,
      usuarios: 1050,
      completado: 75,
      tiempoPromedio: 5.1,
      gradient: 'from-red-500 to-orange-500',
      bgGradient: 'from-red-50 to-orange-50',
      icon: '🌋'
    },
    {
      mundo: 'Desafío de Conocimiento',
      numero: 'Mundo 3',
      partidas: 2320,
      usuarios: 780,
      completado: 68,
      tiempoPromedio: 4.8,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      icon: '⚔️'
    },
  ];

  const topPreguntas = [
    { pregunta: '¿Cuál es la capital de Francia?', correctas: 892, incorrectas: 234, tasa: 79, mundo: 'Mundo 1' },
    { pregunta: '¿Cuánto es 2 + 2?', correctas: 1050, incorrectas: 150, tasa: 88, mundo: 'Mundo 2' },
    { pregunta: '¿En qué año llegó Colón a América?', correctas: 567, incorrectas: 433, tasa: 57, mundo: 'Mundo 3' },
    { pregunta: '¿Cuál es el río más largo del mundo?', correctas: 723, incorrectas: 277, tasa: 72, mundo: 'Mundo 1' },
    { pregunta: '¿Quién escribió Don Quijote?', correctas: 845, incorrectas: 155, tasa: 85, mundo: 'Mundo 2' },
  ];

  const filteredStats = mundoSeleccionado === 'todos' 
    ? estadisticasPorMundo 
    : estadisticasPorMundo.filter((_, i) => 
        mundoSeleccionado === `mundo${i + 1}`
      );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-gray-600 mt-1">Análisis detallado del rendimiento de la plataforma</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {estadisticasGenerales.map((stat, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.positivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.cambio}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.valor}</p>
              </div>
            </div>
          ))}
        </div>

        <Card title="Rendimiento por Mundo" subtitle="Métricas detalladas de cada mundo de aprendizaje">
          <div className="mb-6">
            <Select
              label="Filtrar por Mundo"
              value={mundoSeleccionado}
              onChange={(e) => setMundoSeleccionado(e.target.value)}
              options={mundos}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStats.map((stat, index) => (
              <div key={index} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{stat.numero}</p>
                    <h3 className="font-bold text-gray-900">{stat.mundo}</h3>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎮</span>
                      <span className="text-sm text-gray-600">Partidas</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stat.partidas.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span className="text-sm text-gray-600">Usuarios</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stat.usuarios.toLocaleString()}</span>
                  </div>

                  <div className="p-3 bg-white/60 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="text-sm text-gray-600">Completado</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">{stat.completado}%</span>
                    </div>
                    <div className="w-full bg-white/80 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${stat.completado}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⏱️</span>
                      <span className="text-sm text-gray-600">Tiempo Prom.</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stat.tiempoPromedio} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Preguntas" subtitle="Preguntas con mayor actividad y tasa de acierto">
          <div className="space-y-3">
            {topPreguntas.map((pregunta, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        #{index + 1}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                        {pregunta.mundo}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{pregunta.pregunta}</h3>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      pregunta.tasa >= 80 ? 'text-green-600' :
                      pregunta.tasa >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {pregunta.tasa}%
                    </p>
                    <p className="text-xs text-gray-500">tasa de acierto</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Correctas</p>
                      <p className="text-lg font-bold text-green-700">{pregunta.correctas.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">✗</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Incorrectas</p>
                      <p className="text-lg font-bold text-red-700">{pregunta.incorrectas.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        pregunta.tasa >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        pregunta.tasa >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${pregunta.tasa}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
