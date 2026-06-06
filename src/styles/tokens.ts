export const colors = {
  gold: '#ffd700',
  goldLight: '#ffd700',
  bgCard: '#111',
  bgElevated: '#1a1a1a',
  bgInput: '#000',
  border: '#555',
  borderLight: '#3a3a3a',
  textPrimary: '#e0edf5',
  textSecondary: '#a8cce8',
  textMuted: '#7a9aba',
  textDim: '#8ab0d0',
  green: '#4ade80',
  red: '#ff6b6b',
  orange: '#f97316',
  blue: '#2775ca',
} as const

export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  full: 999,
} as const

export const fontSizes = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  heading: 22,
} as const

export const card = {
  background: colors.bgCard,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: radii.xl,
  padding: 24,
}

export const input = {
  background: colors.bgInput,
  border: `1px solid ${colors.border}`,
  padding: '9px 14px',
  color: colors.textPrimary,
  borderRadius: radii.sm,
  boxSizing: 'border-box',
}

export const modalOverlay = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
}

export const modalContent = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  padding: 32,
  borderRadius: radii.lg,
  maxWidth: 520,
  width: '90%' as const,
}

export const buttonPrimary = {
  background: colors.gold,
  color: '#000',
  border: 'none',
  padding: '9px 14px',
  fontWeight: 700,
  borderRadius: radii.sm,
  cursor: 'pointer',
}

export const buttonGhost = {
  background: 'transparent',
  border: `1px solid ${colors.textDim}`,
  padding: '9px 14px',
  color: colors.textSecondary,
  borderRadius: radii.sm,
  cursor: 'pointer',
}

export const uppercaseLabel = {
  fontSize: fontSizes.xs,
  opacity: 0.5,
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
}
