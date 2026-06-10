export const colors = {
  gold: '#F7CE3E',
  goldLight: '#C2D099',
  goldDark: '#5B7E3C',
  goldBg: '#EEFABD',
  accent: '#F7CE3E',
  accentLight: '#EEFABD',
  bgPage: '#0A1612',
  bgCard: '#1A2930',
  bgElevated: '#1A2930',
  bgInput: '#1A2930',
  border: 'rgba(197,193,192,0.12)',
  borderLight: 'rgba(197,193,192,0.06)',
  textPrimary: '#C5C1C0',
  textSecondary: '#C2D099',
  textMuted: '#C2D099',
  textDim: '#A8B0B8',
  green: '#22C55E',
  red: '#DC2626',
  orange: '#D97706',
  blue: '#2563EB',
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
  background: colors.bgElevated,
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
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 300,
}

export const modalContent = {
  background: colors.bgElevated,
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
  border: `1px solid ${colors.border}`,
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
