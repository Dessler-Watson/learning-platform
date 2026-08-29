'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  estudiantes_activos: number;
  total_estudiantes: number;
  total_docentes: number;
  salas_activas: number;
  total_partidas: number;
  total_preguntas: number;
  total_cursos: number;
  rendimiento_general: { total_correctas: number; total_incorrectas: number; porcentaje_acierto: number };
  temas_mas_errores: { categoria: string; total_errores: number }[];
  participacion_cursos: { nombre: string; estudiantes: number }[];
  partidas_por_juego: { juego: string; partidas: number }[];
}

export default function PanelPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="panel-empty-state">
      <i className="fas fa-spinner fa-spin"></i>
      <p>Cargando...</p>
    </div>
  );
  if (!data) return (
    <div className="panel-empty-state">
      <i className="fas fa-exclamation-triangle" style={{ color: '#F59E0B' }}></i>
      <p>Error al cargar dashboard</p>
    </div>
  );

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-chart-bar"></i> Dashboard</h2>
        <p>Resumen general de la plataforma</p>
      </div>

      <div className="panel-stats-grid">
        <div className="panel-stat-card">
          <div className="panel-stat-icon blue"><i className="fas fa-user-graduate"></i></div>
          <div className="panel-stat-info"><h4>{data.estudiantes_activos}</h4><p>Estudiantes Activos</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon green"><i className="fas fa-users"></i></div>
          <div className="panel-stat-info"><h4>{data.total_estudiantes}</h4><p>Total Estudiantes</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon purple"><i className="fas fa-chalkboard-teacher"></i></div>
          <div className="panel-stat-info"><h4>{data.total_docentes}</h4><p>Docentes</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon orange"><i className="fas fa-door-open"></i></div>
          <div className="panel-stat-info"><h4>{data.salas_activas}</h4><p>Salas en Juego</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon teal"><i className="fas fa-trophy"></i></div>
          <div className="panel-stat-info"><h4>{data.total_partidas}</h4><p>Partidas Jugadas</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon blue"><i className="fas fa-question-circle"></i></div>
          <div className="panel-stat-info"><h4>{data.total_preguntas}</h4><p>Preguntas</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon green"><i className="fas fa-school"></i></div>
          <div className="panel-stat-info"><h4>{data.total_cursos}</h4><p>Cursos</p></div>
        </div>
      </div>

      <div className="panel-grid-2">
        <div className="panel-card">
          <div className="panel-card-header"><h3>Temas con más errores</h3></div>
          {data.temas_mas_errores.length ? (
            <div className="panel-table-container">
              <table className="panel-table">
                <thead><tr><th>Categoría</th><th>Errores</th></tr></thead>
                <tbody>
                  {data.temas_mas_errores.map((t, i) => (
                    <tr key={i}><td>{t.categoria}</td><td><span className="panel-tag facil">{t.total_errores}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty-state"><i className="fas fa-check-circle"></i><p>Sin datos de errores</p></div>
          )}
        </div>
        <div className="panel-card">
          <div className="panel-card-header"><h3>Rendimiento General</h3></div>
          <div style={{ padding: '16px 0' }}>
            <div className="panel-flex-between panel-mb-16">
              <span>Correctas</span><span><strong>{data.rendimiento_general.total_correctas}</strong></span>
            </div>
            <div className="panel-progress-bar panel-mb-16">
              <div className="fill green" style={{ width: `${data.rendimiento_general.porcentaje_acierto}%` }}></div>
            </div>
            <div className="panel-flex-between panel-mb-16">
              <span>Incorrectas</span><span><strong>{data.rendimiento_general.total_incorrectas}</strong></span>
            </div>
            <div className="panel-progress-bar">
              <div className="fill orange" style={{ width: `${100 - data.rendimiento_general.porcentaje_acierto}%` }}></div>
            </div>
            <div className="panel-flex-center panel-mt-16" style={{ justifyContent: 'center' }}>
              <span className="panel-tag facil" style={{ fontSize: '16px', padding: '6px 16px' }}>
                {data.rendimiento_general.porcentaje_acierto}% Acierto
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-grid-2 panel-mt-16">
        <div className="panel-card">
          <div className="panel-card-header"><h3>Participación por Curso</h3></div>
          {data.participacion_cursos.length ? (
            <div className="panel-table-container">
              <table className="panel-table">
                <thead><tr><th>Curso</th><th>Estudiantes</th></tr></thead>
                <tbody>
                  {data.participacion_cursos.map((c, i) => (
                    <tr key={i}><td>{c.nombre}</td><td><span className="panel-tag facil">{c.estudiantes}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty-state"><i className="fas fa-users"></i><p>Sin cursos registrados</p></div>
          )}
        </div>
        <div className="panel-card">
          <div className="panel-card-header"><h3>Partidas por Juego</h3></div>
          {data.partidas_por_juego.length ? (
            <div className="panel-table-container">
              <table className="panel-table">
                <thead><tr><th>Juego</th><th>Partidas</th></tr></thead>
                <tbody>
                  {data.partidas_por_juego.map((p, i) => (
                    <tr key={i}>
                      <td><i className="fas fa-gamepad" style={{ color: 'var(--pastel-blue)', marginRight: '8px' }}></i>{p.juego}</td>
                      <td><span className="panel-tag facil">{p.partidas}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty-state"><i className="fas fa-gamepad"></i><p>Sin partidas registradas</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
