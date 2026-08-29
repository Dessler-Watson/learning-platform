'use client';

import { useEffect, useState } from 'react';

interface Sala { id_sala: number; codigo: string; juego_nombre: string; creador_nombre: string; tipo: string; estado: string; max_jugadores: number; total_partidas: number; juego_id: number; }
interface Juego { id_juego: number; nombre: string; }

export default function SalasPage() {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [juegos, setJuegos] = useState<Juego[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [filterJuego, setFilterJuego] = useState('');

  const loadData = () => {
    Promise.all([fetch('/api/salas').then(r => r.json()), fetch('/api/juegos').then(r => r.json())])
      .then(([s, j]) => { setSalas(s); setJuegos(j); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = salas.filter(s => {
    if (filterEstado && s.estado !== filterEstado) return false;
    if (filterJuego && s.juego_id !== parseInt(filterJuego)) return false;
    return true;
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { juego_id: parseInt(fd.get('juego_id') as string), codigo: fd.get('codigo') as string, tipo: fd.get('tipo') as string, max_jugadores: parseInt(fd.get('max_jugadores') as string) || 8, creador_id: 1 };
    await fetch('/api/salas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setShowModal(false); loadData();
  };

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-door-open"></i> Salas</h2>
        <p>Creación y supervisión de salas</p>
      </div>

      <div className="panel-action-bar">
        <div className="panel-filter-group">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="esperando">Esperando</option>
            <option value="jugando">Jugando</option>
            <option value="finalizada">Finalizada</option>
          </select>
          <select value={filterJuego} onChange={e => setFilterJuego(e.target.value)}>
            <option value="">Todos los juegos</option>
            {juegos.map(j => <option key={j.id_juego} value={j.id_juego}>{j.nombre}</option>)}
          </select>
        </div>
        <button className="panel-btn panel-btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Nueva Sala
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>Código</th><th>Juego</th><th>Creador</th><th>Tipo</th><th>Estado</th><th>Jugadores</th><th>Partidas</th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id_sala}>
                  <td><strong>{s.codigo}</strong></td>
                  <td>{s.juego_nombre}</td>
                  <td>{s.creador_nombre}</td>
                  <td><span className={`panel-tag ${s.tipo}`}>{s.tipo}</span></td>
                  <td><span className={`panel-tag ${s.estado}`}>{s.estado}</span></td>
                  <td>{s.max_jugadores}</td>
                  <td><span className="panel-tag facil">{s.total_partidas}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="panel-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <h3>Nueva Sala</h3>
            <form onSubmit={handleCreate}>
              <div className="panel-form-group">
                <label>Juego</label>
                <select name="juego_id">{juegos.map(j => <option key={j.id_juego} value={j.id_juego}>{j.nombre}</option>)}</select>
              </div>
              <div className="panel-form-group"><label>Código de Sala</label><input name="codigo" placeholder="Ej: SALA-001" required /></div>
              <div className="panel-form-row">
                <div className="panel-form-group">
                  <label>Tipo</label>
                  <select name="tipo"><option value="publica">Pública</option><option value="privada">Privada</option></select>
                </div>
                <div className="panel-form-group"><label>Max. Jugadores</label><input name="max_jugadores" type="number" defaultValue={8} min={1} /></div>
              </div>
              <div className="panel-modal-footer">
                <button type="button" className="panel-btn panel-btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="panel-btn panel-btn-primary"><i className="fas fa-save"></i> Crear Sala</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
