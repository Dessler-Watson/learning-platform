'use client';
export function TopBar() {
  return (
    <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}>
      <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>EquiMundo</span>
      <span style={{ color: '#aaa', fontSize: 13 }}>Plataforma Educativa</span>
    </header>
  );
}
