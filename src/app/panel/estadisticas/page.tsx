'use client';

import { useEffect, useState } from 'react';

export default function EstadisticasPage() {
  const [general, setGeneral] = useState<any>(null);
  const [porJuego, setPorJuego] = useState<any[]>([]);
  const [porEstudiante, setPorEstudiante] = useState<any[]>([]);
  const [top, setTop] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/estadisticas?tipo=general').then(r => r.json()),
      fetch('/api/estadisticas?tipo=por-juego').then(r => r.json()),
      fetch('/api/estadisticas?tipo=por-estudiante').then(r => r.json()),
      fetch('/api/estadisticas?tipo=top-estudiantes').then(r => r.json()),
    ])
      .then(([g, j, e, t]) => { setGeneral(g); setPorJuego(j); setPorEstudiante(e); setTop(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;
  if (!general) return <div className="panel-empty-state"><i className="fas fa-exclamation-triangle" style={{ color: '#F59E0B' }}></i><p>Error al cargar datos</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-chart-line"></i> Estadísticas</h2>
        <p>Rendimiento detallado por juego y estudiante</p>
      </div>

      <div className="panel-stats-grid">
        <div className="panel-stat-card">
          <div className="panel-stat-icon blue"><i className="fas fa-check-circle"></i></div>
          <div className="panel-stat-info"><h4>{general.total_correctas}</h4><p>Respuestas Correctas</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon orange"><i className="fas fa-times-circle"></i></div>
          <div className="panel-stat-info"><h4>{general.total_incorrectas}</h4><p>Respuestas Incorrectas</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon green"><i className="fas fa-star"></i></div>
          <div className="panel-stat-info"><h4>{general.puntaje_promedio}</h4><p>Puntaje Promedio</p></div>
        </div>
        <div className="panel-stat-card">
          <div className="panel-stat-icon purple"><i className="fas fa-trophy"></i></div>
          <div className="panel-stat-info"><h4>{general.total_copas}</h4><p>Total Copas</p></div>
        </div>
      </div>

      <div className="panel-grid-2">
        <div className="panel-card">
          <div className="panel-card-header"><h3>Estadísticas por Juego</h3></div>
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr><th>Juego</th><th>Estud.</th><th>Partidas</th><th>Victorias</th><th>Correctas</th><th>Incorrectas</th><th>Tiempo Prom.</th></tr></thead>
              <tbody>
                {porJuego.map((j, i) => (
                  <tr key={i}>
                    <td><strong>{j.juego}</strong></td>
                    <td>{j.estudiantes}</td>
                    <td>{j.total_partidas}</td>
                    <td>{j.total_victorias}</td>
                    <td><span className="panel-tag facil">{j.total_correctas}</span></td>
                    <td><span className="panel-tag dificil">{j.total_incorrectas}</span></td>
                    <td>{j.tiempo_promedio}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel-card">
          <div className="panel-card-header"><h3>Top Estudiantes</h3></div>
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr><th>#</th><th>Nombre</th><th>Copas</th><th>Victorias</th><th>Mejor Racha</th></tr></thead>
              <tbody>
                {top.map((t, i) => (
                  <tr key={t.id_usuario}>
                    <td><strong>#{i + 1}</strong></td>
                    <td><strong>{t.nombre}</strong></td>
                    <td><span className="panel-tag facil">{t.total_copas}</span></td>
                    <td>{t.total_victorias}</td>
                    <td>{t.mejor_racha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel-card panel-mt-16">
        <div className="panel-card-header"><h3>Rendimiento por Estudiante</h3></div>
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>Nombre</th><th>Partidas</th><th>Victorias</th><th>Correctas</th><th>Incorrectas</th><th>% Acierto</th></tr></thead>
            <tbody>
              {porEstudiante.map((e, i) => (
                <tr key={i}>
                  <td><strong>{e.nombre}</strong></td>
                  <td>{e.total_partidas}</td>
                  <td>{e.total_victorias}</td>
                  <td><span className="panel-tag facil">{e.total_correctas}</span></td>
                  <td><span className="panel-tag dificil">{e.total_incorrectas}</span></td>
                  <td>
                    <div className="panel-flex-center">
                      <span>{e.porcentaje_acierto}%</span>
                      <div className="panel-progress-bar" style={{ width: '80px', marginLeft: '8px' }}>
                        <div className="fill green" style={{ width: `${e.porcentaje_acierto}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
