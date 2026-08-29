'use client';

import { useEffect, useState } from 'react';

interface Estudiante { id_usuario: number; nombre: string; correo: string; avatar_nombre: string; estado: string; fecha_registro: string; }

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/usuarios?rol=estudiante').then(r => r.json()).then(setEstudiantes).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel-empty-state"><i className="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>;

  return (
    <div>
      <div className="panel-page-header">
        <h2><i className="fas fa-users"></i> Estudiantes</h2>
        <p>Listado y progreso de estudiantes</p>
      </div>

      <div className="panel-card">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Avatar</th><th>Estado</th><th>Registro</th></tr></thead>
            <tbody>
              {estudiantes.map(e => (
                <tr key={e.id_usuario}>
                  <td>{e.id_usuario}</td>
                  <td><strong>{e.nombre}</strong></td>
                  <td>{e.correo}</td>
                  <td>{e.avatar_nombre || '-'}</td>
                  <td><span className={`panel-tag ${e.estado}`}>{e.estado}</span></td>
                  <td>{new Date(e.fecha_registro).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
