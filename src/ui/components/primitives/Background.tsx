export function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #7C4DFF22, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #FF6B9D22, transparent 70%)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '40%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, #4BC94B22, transparent 70%)' }} />
    </div>
  );
}
