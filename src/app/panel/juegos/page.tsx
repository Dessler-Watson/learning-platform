'use client';

import { useEffect, useState } from 'react';

interface Juego { id_juego: number; nombre: string; descripcion: string; cuestionarios: { id_cuestionario: number; nombre: string }[]; total_salas: number; total_partidas: number; }

export default function JuegosPage() {
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/juegos').then(r => r.json()).then(setJuegos).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-gamepad"></i> Juegos</h2>
        <p>Modos de juego disponibles</p>
      </div>

      <div className="panel-grid-3">
        {juegos.map(j => (
          <div className="panel-card" key={j.id_juego}>
            <div className="panel-card-header">
              <h3><i className="fas fa-gamepad" style={{ color: 'var(--pastel-blue)' }}></i> {j.nombre}</h3>
            </div>
            <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '16px', minHeight: '40px' }}>{j.descripcion}</p>
            <div className="panel-flex-between" style={{ marginBottom: '16px', fontSize: '13px' }}>
              <span>Cuestionarios:</span>
              <span>{j.cuestionarios?.map(c => <span key={c.id_cuestionario} className="panel-tag facil" style={{ margin: '2px' }}>{c.nombre}</span>) || '-'}</span>
            </div>
            <div className="panel-flex-between" style={{ fontSize: '13px' }}>
              <span>Salas: <strong>{j.total_salas}</strong></span>
              <span>Partidas: <strong>{j.total_partidas}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
