'use client';
export function TopBar() {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,248,231,0.8)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <img src="/images/logo.png" alt="Logo" style={{ height: 28, width: 'auto' }} draggable={false} />
      <span style={{ color: '#8A7A6A', fontSize: 13, fontWeight: 600 }}>Plataforma Educativa</span>
    </header>
  );
}
