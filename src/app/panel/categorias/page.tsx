'use client';

import { useEffect, useState } from 'react';

interface Categoria { id_categoria: number; nombre: string; descripcion: string; cuestionario_id: number; cuestionario_nombre: string; total_preguntas: number; }
interface Cuestionario { id_cuestionario: number; nombre: string; }

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);

  const loadData = () => {
    Promise.all([fetch('/api/categorias').then(r => r.json()), fetch('/api/cuestionarios').then(r => r.json())])
      .then(([c, q]) => { setCategorias(c); setCuestionarios(q); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = { cuestionario_id: parseInt(fd.get('cuestionario_id') as string), nombre: fd.get('nombre') as string, descripcion: (fd.get('descripcion') as string) || null };
    if (editing) {
      await fetch(`/api/categorias/${editing.id_categoria}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/categorias', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    setShowModal(false); setEditing(null); loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await fetch(`/api/categorias/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-tags"></i> Categorías</h2>
        <p>Gestión de categorías por cuestionario</p>
      </div>

      <div className="panel-action-bar">
        <div></div>
        <button className="panel-btn panel-btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <i className="fas fa-plus"></i> Nueva Categoría
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Cuestionario</th><th>Descripción</th><th>Preguntas</th><th>Acciones</th></tr></thead>
            <tbody>
              {categorias.map(c => (
                <tr key={c.id_categoria}>
                  <td>{c.id_categoria}</td>
                  <td><strong>{c.nombre}</strong></td>
                  <td><span className="panel-tag facil">{c.cuestionario_nombre}</span></td>
                  <td>{c.descripcion || '-'}</td>
                  <td><span className="panel-tag facil">{c.total_preguntas}</span></td>
                  <td>
                    <button className="panel-btn panel-btn-sm panel-btn-outline" onClick={() => { setEditing(c); setShowModal(true); }}><i className="fas fa-edit"></i></button>
                    <button className="panel-btn panel-btn-sm panel-btn-danger" onClick={() => handleDelete(c.id_categoria)}><i className="fas fa-trash"></i></button>
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
            <h3>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <form onSubmit={handleSave}>
              <div className="panel-form-group"><label>Nombre</label><input name="nombre" defaultValue={editing?.nombre || ''} required /></div>
              <div className="panel-form-group">
                <label>Cuestionario</label>
                <select name="cuestionario_id" defaultValue={editing?.cuestionario_id || cuestionarios[0]?.id_cuestionario || ''}>
                  {cuestionarios.map(q => <option key={q.id_cuestionario} value={q.id_cuestionario}>{q.nombre}</option>)}
                </select>
              </div>
              <div className="panel-form-group"><label>Descripción</label><textarea name="descripcion" defaultValue={editing?.descripcion || ''} rows={2} /></div>
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
