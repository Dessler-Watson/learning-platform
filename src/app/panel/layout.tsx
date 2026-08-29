'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './panel.css';

const navItems = [
  { href: '/panel', label: 'Dashboard', icon: 'fa-chart-bar' },
  { href: '/panel/preguntas', label: 'Preguntas', icon: 'fa-question-circle' },
  { href: '/panel/categorias', label: 'Categorías', icon: 'fa-tags' },
  { href: '/panel/cuestionarios', label: 'Cuestionarios', icon: 'fa-book' },
  { href: '/panel/juegos', label: 'Juegos', icon: 'fa-gamepad' },
  { href: '/panel/salas', label: 'Salas', icon: 'fa-door-open' },
  { href: '/panel/cursos', label: 'Cursos', icon: 'fa-school' },
  { href: '/panel/estudiantes', label: 'Estudiantes', icon: 'fa-users' },
  { href: '/panel/estadisticas', label: 'Estadísticas', icon: 'fa-chart-line' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="panel-layout">
      {sidebarOpen && (
        <div className="panel-sidebar-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`panel-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="panel-sidebar-header">
          <h1><i className="fas fa-graduation-cap"></i> <span>Panel Docente</span></h1>
          <p>Plataforma de Aprendizaje</p>
          <button className="panel-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="panel-sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`panel-nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="panel-sidebar-footer">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <i className="fas fa-arrow-left"></i> Volver a EduPlay
          </Link>
        </div>
      </aside>

      <div className="panel-mobile-header">
        <button className="panel-hamburger-btn" onClick={() => setSidebarOpen(true)}>
          <i className="fas fa-bars"></i>
        </button>
        <span className="panel-mobile-title"><i className="fas fa-graduation-cap"></i> Panel Docente</span>
      </div>

      <main className="panel-main">
        {children}
      </main>
    </div>
  );
}
