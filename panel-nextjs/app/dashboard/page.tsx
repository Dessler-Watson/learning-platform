'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { 
      label: 'Total Usuarios', 
      value: '1,234', 
      icon: '👥', 
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-200',
      change: '+12%',
      positive: true
    },
    { 
      label: 'Total Preguntas', 
      value: '456', 
      icon: '❓', 
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-200',
      change: '+8%',
      positive: true
    },
    { 
      label: 'Total Partidas', 
      value: '7,890', 
      icon: '🎮', 
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-200',
      change: '+23%',
      positive: true
    },
    { 
      label: 'Tasa de Éxito', 
      value: '78%', 
      icon: '🏆', 
      gradient: 'from-orange-500 to-red-500',
      shadow: 'shadow-orange-200',
      change: '+5%',
      positive: true
    },
  ];

  const mundos = [
    { 
      nombre: 'El Camino de las Decisiones', 
      mundo: 'Mundo 1',
      preguntas: 150, 
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      icon: '🛤️'
    },
    { 
      nombre: 'La Lava del Conocimiento', 
      mundo: 'Mundo 2',
      preguntas: 180, 
      gradient: 'from-red-500 to-orange-500',
      bgGradient: 'from-red-50 to-orange-50',
      icon: '🌋'
    },
    { 
      nombre: 'Desafío de Conocimiento', 
      mundo: 'Mundo 3',
      preguntas: 126, 
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      icon: '⚔️'
    },
  ];

  const actividades = [
    { accion: 'Nueva pregunta agregada', detalle: 'Mundo 2 - Matemáticas', tiempo: 'Hace 2 horas', icon: '➕', color: 'bg-green-100 text-green-600' },
    { accion: 'Usuario registrado', detalle: 'juan.perez@example.com', tiempo: 'Hace 3 horas', icon: '👤', color: 'bg-blue-100 text-blue-600' },
    { accion: 'Pregunta editada', detalle: 'Mundo 1 - Historia', tiempo: 'Hace 5 horas', icon: '✏️', color: 'bg-yellow-100 text-yellow-600' },
    { accion: 'Estadísticas actualizadas', detalle: 'Reporte semanal generado', tiempo: 'Hace 1 día', icon: '📊', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user?.nombre?.split(' ')[0]}</span>
            </h1>
            <p className="text-gray-600 mt-1">Aquí tienes un resumen de la plataforma</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm text-gray-600">Hoy:</span>
            <span className="text-sm font-semibold text-gray-900">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group">
              <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    stat.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <Card title="Mundos de Aprendizaje" subtitle="Distribución de contenido por mundo">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mundos.map((mundo, index) => (
              <div key={index} className={`bg-gradient-to-br ${mundo.bgGradient} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${mundo.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl">{mundo.icon}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">{mundo.mundo}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{mundo.nombre}</h3>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{mundo.preguntas}</p>
                    <p className="text-sm text-gray-600">preguntas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">
                      {((mundo.preguntas / 456) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">del total</p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/50 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r ${mundo.gradient} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${(mundo.preguntas / 456) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Actividad Reciente" subtitle="Últimas acciones en la plataforma">
            <div className="space-y-4">
              {actividades.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{item.accion}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detalle}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{item.tiempo}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Accesos Rápidos" subtitle="Funciones más utilizadas">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">➕</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Nueva Pregunta</p>
                <p className="text-xs text-gray-500 mt-1">Crear contenido</p>
              </button>

              <button className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Ver Estadísticas</p>
                <p className="text-xs text-gray-500 mt-1">Análisis completo</p>
              </button>

              <button className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Usuarios</p>
                <p className="text-xs text-gray-500 mt-1">Gestionar cuentas</p>
              </button>

              <button className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚙️</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">Configuración</p>
                <p className="text-xs text-gray-500 mt-1">Ajustes del sistema</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
