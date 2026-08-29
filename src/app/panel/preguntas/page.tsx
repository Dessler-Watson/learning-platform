'use client';

import { useEffect, useState } from 'react';

interface Pregunta {
  id_pregunta: number; pregunta: string; categoria_nombre: string; opcion_a: string; opcion_b: string;
  opcion_c: string; opcion_d: string; respuesta_correcta: string; dificultad: string; puntos: number; categoria_id: number; explicacion: string;
}
interface Categoria { id_categoria: number; nombre: string; cuestionario_id: number; }

export default function PreguntasPage() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pregunta | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [filterDif, setFilterDif] = useState('');
  const [search, setSearch] = useState('');

  const loadData = () => {
    Promise.all([fetch('/api/preguntas').then(r => r.json()), fetch('/api/categorias').then(r => r.json())])
      .then(([p, c]) => { setPreguntas(p); setCategorias(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = preguntas.filter(p => {
    if (filterCat && p.categoria_id !== parseInt(filterCat)) return false;
    if (filterDif && p.dificultad !== filterDif) return false;
    if (search && !p.pregunta.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      categoria_id: parseInt(fd.get('categoria_id') as string),
      pregunta: fd.get('pregunta') as string,
      opcion_a: fd.get('opcion_a') as string,
      opcion_b: fd.get('opcion_b') as string,
      opcion_c: (fd.get('opcion_c') as string) || null,
      opcion_d: (fd.get('opcion_d') as string) || null,
      respuesta_correcta: fd.get('respuesta_correcta') as string,
      dificultad: fd.get('dificultad') as string,
      puntos: parseInt(fd.get('puntos') as string) || 10,
      explicacion: (fd.get('explicacion') as string) || null,
    };
    if (editing) {
      await fetch(`/api/preguntas/${editing.id_pregunta}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/preguntas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    setShowModal(false); setEditing(null); loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await fetch(`/api/preguntas/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-question-circle"></i> Preguntas</h2>
        <p>Gestión de preguntas del banco</p>
      </div>

      <div className="panel-action-bar">
        <div className="panel-search-box">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Buscar pregunta..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="panel-filter-group">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Todas categorías</option>
            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
          <select value={filterDif} onChange={e => setFilterDif(e.target.value)}>
            <option value="">Toda dificultad</option>
            <option value="facil">Fácil</option>
            <option value="media">Media</option>
            <option value="dificil">Difícil</option>
          </select>
          <button className="panel-btn panel-btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <i className="fas fa-plus"></i> Nueva Pregunta
          </button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead>
              <tr>
                <th>ID</th><th>Pregunta</th><th>Categoría</th><th>Opciones</th><th>Correcta</th><th>Dificultad</th><th>Puntos</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id_pregunta}>
                  <td>{p.id_pregunta}</td>
                  <td><strong>{p.pregunta}</strong></td>
                  <td><span className="panel-tag facil">{p.categoria_nombre}</span></td>
                  <td>{p.opcion_c ? 'A B C D' : 'A B'}</td>
                  <td><span className="panel-tag facil" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-dark)' }}>{p.respuesta_correcta}</span></td>
                  <td><span className={`panel-tag ${p.dificultad}`}>{p.dificultad}</span></td>
                  <td><strong>{p.puntos}</strong></td>
                  <td>
                    <button className="panel-btn panel-btn-sm panel-btn-outline" onClick={() => { setEditing(p); setShowModal(true); }}><i className="fas fa-edit"></i></button>
                    <button className="panel-btn panel-btn-sm panel-btn-danger" onClick={() => handleDelete(p.id_pregunta)}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)' }}>No se encontraron preguntas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="panel-modal-overlay" onClick={() => { setShowModal(false); setEditing(null); }}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
            <form onSubmit={handleSave}>
              <div className="panel-form-group">
                <label>Pregunta</label>
                <textarea name="pregunta" defaultValue={editing?.pregunta || ''} rows={2} required />
              </div>
              <div className="panel-form-row">
                <div className="panel-form-group">
                  <label>Categoría</label>
                  <select name="categoria_id" defaultValue={editing?.categoria_id || categorias[0]?.id_categoria || ''}>
                    {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="panel-form-group">
                  <label>Dificultad</label>
                  <select name="dificultad" defaultValue={editing?.dificultad || 'media'}>
                    <option value="facil">Fácil</option>
                    <option value="media">Media</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>
              <div className="panel-form-row">
                <div className="panel-form-group"><label>Opción A</label><input name="opcion_a" defaultValue={editing?.opcion_a || ''} required /></div>
                <div className="panel-form-group"><label>Opción B</label><input name="opcion_b" defaultValue={editing?.opcion_b || ''} required /></div>
              </div>
              <div className="panel-form-row">
                <div className="panel-form-group"><label>Opción C</label><input name="opcion_c" defaultValue={editing?.opcion_c || ''} /></div>
                <div className="panel-form-group"><label>Opción D</label><input name="opcion_d" defaultValue={editing?.opcion_d || ''} /></div>
              </div>
              <div className="panel-form-row">
                <div className="panel-form-group">
                  <label>Respuesta Correcta</label>
                  <select name="respuesta_correcta" defaultValue={editing?.respuesta_correcta || 'A'}>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
                <div className="panel-form-group"><label>Puntos</label><input name="puntos" type="number" defaultValue={editing?.puntos || 10} /></div>
              </div>
              <div className="panel-form-group">
                <label>Explicación</label>
                <textarea name="explicacion" defaultValue={editing?.explicacion || ''} rows={2} />
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
