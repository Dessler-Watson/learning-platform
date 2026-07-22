export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  '3xl': '3rem',  // 48px
  '4xl': '4rem',  // 64px
} as const;

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  md: '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  lg: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)',
  xl: '0 12px 36px rgba(0,0,0,0.16), 0 6px 12px rgba(0,0,0,0.1)',
  glow: (color: string) => `0 0 20px ${color}40, 0 0 40px ${color}20`,
} as const;

export const elevations = {
  flat: 0,
  raised: 2,
  overlay: 10,
  sticky: 20,
  modal: 30,
  toast: 40,
  tooltip: 50,
} as const;
