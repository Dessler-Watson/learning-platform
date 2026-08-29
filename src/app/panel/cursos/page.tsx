'use client';

import { useEffect, useState } from 'react';

interface Curso { id_curso: number; nombre: string; docente_nombre: string; total_estudiantes: number; }
interface Estudiante { id_usuario: number; nombre: string; correo: string; estado: string; }

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEstudiantes, setShowEstudiantes] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [inscritos, setInscritos] = useState<Estudiante[]>([]);

  const loadData = () => {
    Promise.all([fetch('/api/cursos').then(r => r.json()), fetch('/api/usuarios?rol=estudiante').then(r => r.json())])
      .then(([c, e]) => { setCursos(c); setEstudiantes(e); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch('/api/cursos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: fd.get('nombre') as string, docente_id: parseInt(fd.get('docente_id') as string) || 1 }) });
    setShowModal(false); loadData();
  };

  const verEstudiantes = async (curso: Curso) => {
    setSelectedCurso(curso); setShowEstudiantes(true);
    const res = await fetch(`/api/cursos/${curso.id_curso}/estudiantes`);
    setInscritos(await res.json());
  };

  const agregarEstudiante = async (usuarioId: number) => {
    if (!selectedCurso) return;
    await fetch(`/api/cursos/${selectedCurso.id_curso}/estudiantes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario_id: usuarioId }) });
    const res = await fetch(`/api/cursos/${selectedCurso.id_curso}/estudiantes`);
    setInscritos(await res.json()); loadData();
  };

  const removerEstudiante = async (usuarioId: number) => {
    if (!selectedCurso) return;
    await fetch(`/api/cursos/${selectedCurso.id_curso}/estudiantes/${usuarioId}`, { method: 'DELETE' });
    const res = await fetch(`/api/cursos/${selectedCurso.id_curso}/estudiantes`);
    setInscritos(await res.json()); loadData();
  };

  const disponibles = estudiantes.filter(e => !inscritos.some(i => i.id_usuario === e.id_usuario));

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-school"></i> Cursos</h2>
        <p>Gestión de cursos y estudiantes</p>
      </div>

      <div className="panel-action-bar">
        <div></div>
        <button className="panel-btn panel-btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus"></i> Nuevo Curso
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Docente</th><th>Estudiantes</th><th>Acciones</th></tr></thead>
            <tbody>
              {cursos.map(c => (
                <tr key={c.id_curso}>
                  <td>{c.id_curso}</td>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.docente_nombre}</td>
                  <td><span className="panel-tag facil">{c.total_estudiantes}</span></td>
                  <td>
                    <button className="panel-btn panel-btn-sm panel-btn-outline" onClick={() => verEstudiantes(c)}>
                      <i className="fas fa-users"></i> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="panel-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <h3>Nuevo Curso</h3>
            <form onSubmit={handleCreate}>
              <div className="panel-form-group"><label>Nombre del Curso</label><input name="nombre" required /></div>
              <div className="panel-form-group"><label>Docente ID</label><input name="docente_id" type="number" defaultValue={1} /></div>
              <div className="panel-modal-footer">
                <button type="button" className="panel-btn panel-btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="panel-btn panel-btn-primary"><i className="fas fa-save"></i> Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEstudiantes && selectedCurso && (
        <div className="panel-modal-overlay" onClick={() => setShowEstudiantes(false)}>
          <div className="panel-modal" onClick={e => e.stopPropagation()}>
            <h3>Estudiantes - {selectedCurso.nombre}</h3>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ marginBottom: '8px' }}>Estudiantes inscritos ({inscritos.length})</h4>
              {inscritos.length ? (
                <div className="panel-table-container">
                  <table className="panel-table">
                    <thead><tr><th>Nombre</th><th>Correo</th><th>Estado</th><th>Acción</th></tr></thead>
                    <tbody>
                      {inscritos.map(e => (
                        <tr key={e.id_usuario}>
                          <td>{e.nombre}</td>
                          <td>{e.correo}</td>
                          <td><span className={`panel-tag ${e.estado}`}>{e.estado}</span></td>
                          <td><button className="panel-btn panel-btn-sm panel-btn-danger" onClick={() => removerEstudiante(e.id_usuario)}><i className="fas fa-user-minus"></i></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ color: 'var(--gray-400)' }}>Sin estudiantes inscritos</p>}
            </div>
            <div>
              <h4 style={{ marginBottom: '8px' }}>Agregar estudiante</h4>
              {disponibles.length ? (
                <div className="panel-flex" style={{ gap: '8px' }}>
                  <select id="selectEstudiante" style={{ flex: 1, padding: '8px 12px', border: '2px solid var(--gray-200)', borderRadius: 'var(--radius-sm)' }}>
                    {disponibles.map(e => <option key={e.id_usuario} value={e.id_usuario}>{e.nombre} ({e.correo})</option>)}
                  </select>
                  <button className="panel-btn panel-btn-success" onClick={() => { const sel = document.getElementById('selectEstudiante') as HTMLSelectElement; if (sel.value) agregarEstudiante(parseInt(sel.value)); }}><i className="fas fa-user-plus"></i></button>
                </div>
              ) : <p style={{ color: 'var(--gray-400)' }}>No hay estudiantes disponibles</p>}
            </div>
            <div className="panel-modal-footer">
              <button className="panel-btn panel-btn-outline" onClick={() => setShowEstudiantes(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
