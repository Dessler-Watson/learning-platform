'use client';

import { useEffect, useState } from 'react';

interface Cuestionario { id_cuestionario: number; nombre: string; descripcion: string; nivel: string; total_categorias: number; total_preguntas: number; juegos: { id_juego: number; nombre_juego: string }[]; }

export default function CuestionariosPage() {
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Cuestionario | null>(null);

  const loadData = () => {
    fetch('/api/cuestionarios').then(r => r.json()).then(setCuestionarios).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { nombre: fd.get('nombre') as string, descripcion: (fd.get('descripcion') as string) || null, nivel: fd.get('nivel') as string };
    if (editing) {
      await fetch(`/api/cuestionarios/${editing.id_cuestionario}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/cuestionarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    setShowModal(false); setEditing(null); loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cuestionario?')) return;
    await fetch(`/api/cuestionarios/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-book"></i> Cuestionarios</h2>
        <p>Gestión de cuestionarios y juegos asociados</p>
      </div>

      <div className="panel-action-bar">
        <div></div>
        <button className="panel-btn panel-btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <i className="fas fa-plus"></i> Nuevo Cuestionario
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Nivel</th><th>Categorías</th><th>Preguntas</th><th>Juegos Asociados</th><th>Acciones</th></tr></thead>
            <tbody>
              {cuestionarios.map(q => (
                <tr key={q.id_cuestionario}>
                  <td>{q.id_cuestionario}</td>
                  <td><strong>{q.nombre}</strong></td>
                  <td><span className="panel-tag media">{q.nivel}</span></td>
                  <td><span className="panel-tag facil">{q.total_categorias}</span></td>
                  <td><span className="panel-tag facil">{q.total_preguntas}</span></td>
                  <td>{q.juegos?.map(j => <span key={j.id_juego} className="panel-tag facil" style={{ margin: '2px' }}>{j.nombre_juego}</span>) || '-'}</td>
                  <td>
                    <button className="panel-btn panel-btn-sm panel-btn-outline" onClick={() => { setEditing(q); setShowModal(true); }}><i className="fas fa-edit"></i></button>
                    <button className="panel-btn panel-btn-sm panel-btn-danger" onClick={() => handleDelete(q.id_cuestionario)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="panel-modal-overlay" onClick={() => { setShowModal(false); setEditing(null); }}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Editar Cuestionario' : 'Nuevo Cuestionario'}</h3>
            <form onSubmit={handleSave}>
              <div className="panel-form-group"><label>Nombre</label><input name="nombre" defaultValue={editing?.nombre || ''} required /></div>
              <div className="panel-form-group"><label>Descripción</label><textarea name="descripcion" defaultValue={editing?.descripcion || ''} rows={2} /></div>
              <div className="panel-form-group">
                <label>Nivel</label>
                <select name="nivel" defaultValue={editing?.nivel || 'intermedio'}>
                  <option value="basico">Básico</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div className="panel-modal-footer">
                <button type="button" className="panel-btn panel-btn-outline" onClick={() => { setShowModal(false); setEditing(null); }}>Cancelar</button>
                <button type="submit" className="panel-btn panel-btn-primary"><i className="fas fa-save"></i> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
