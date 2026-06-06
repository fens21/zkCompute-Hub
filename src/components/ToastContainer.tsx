import type { Toast } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'

const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' }

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  const isMobile = useIsMobile()
  return (
    <div role="alert" aria-live="polite" style={{
      position: 'fixed',
      bottom: isMobile ? 12 : 24,
      right: isMobile ? 10 : 24,
      left: isMobile ? 10 : 'auto',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 300,
      maxWidth: isMobile ? 'none' : 360,
      width: '100%', pointerEvents: 'none',
    }}>
      {toasts.slice(-5).map(toast => {
        const bg = toast.type === 'success' ? '#1a3c1a' : toast.type === 'error' ? '#3c1a1a' : '#1a2a3c'
        const borderColor = toast.type === 'success' ? colors.green : toast.type === 'error' ? colors.red : colors.border
        const iconColor = toast.type === 'success' ? colors.green : toast.type === 'error' ? colors.red : '#888'
        return (
          <div key={toast.id} style={{
            background: bg, border: `1px solid ${borderColor}`, padding: '12px 16px', borderRadius: radii.md,
            fontSize: fontSizes.base, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeIn 0.25s ease-out', pointerEvents: 'auto',
          }}>
            <span style={{ fontSize: fontSizes.md, flexShrink: 0, color: iconColor, fontWeight: 700 }}>{ICONS[toast.type]}</span>
            <span style={{ flex: 1, color: '#e0e0e0', lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
