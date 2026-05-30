import type { Toast } from '../types'

const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' }

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div role="alert" aria-live="polite" style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 300, maxWidth: 360, width: '100%', pointerEvents: 'none' }}>
      {toasts.slice(-5).map(toast => {
        const bg = toast.type === 'success' ? '#1a3c1a' : toast.type === 'error' ? '#3c1a1a' : '#1a2a3c'
        const borderColor = toast.type === 'success' ? '#4ade80' : toast.type === 'error' ? '#ff6b6b' : '#444'
        const iconColor = toast.type === 'success' ? '#4ade80' : toast.type === 'error' ? '#ff6b6b' : '#888'
        return (
          <div key={toast.id} style={{
            background: bg, border: `1px solid ${borderColor}`, padding: '12px 16px', borderRadius: 8,
            fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeIn 0.25s ease-out', pointerEvents: 'auto',
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, color: iconColor, fontWeight: 700 }}>{ICONS[toast.type]}</span>
            <span style={{ flex: 1, color: '#e0e0e0', lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        )
      })}
    </div>
  )
}
