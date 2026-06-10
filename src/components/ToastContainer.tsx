import type { Toast } from '../types'
import { useIsMobile } from '../hooks/useIsMobile'
import { colors, radii, fontSizes } from '../styles/tokens'

const EXPLORER = 'https://liteforge.explorer.caldera.xyz/tx'
const ICONS: Record<string, string> = { success: '✓', error: '✕', info: 'ℹ' }

function openTx(txHash: string) {
  window.open(`${EXPLORER}/${txHash}`, '_blank', 'noopener')
}

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
          <div key={toast.id} onClick={() => toast.txHash && openTx(toast.txHash)}
            role={toast.txHash ? 'button' : undefined}
            tabIndex={toast.txHash ? 0 : undefined}
            onKeyDown={e => { if (toast.txHash && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openTx(toast.txHash) } }}
            title={toast.txHash ? 'View on explorer' : undefined}
            style={{
              background: bg, border: `1px solid ${borderColor}`, padding: '12px 16px', borderRadius: radii.md,
              fontSize: fontSizes.base, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', gap: 10,
              animation: 'fadeIn 0.25s ease-out', pointerEvents: 'auto',
              cursor: toast.txHash ? 'pointer' : 'default',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (toast.txHash) (e.currentTarget as HTMLElement).style.borderColor = colors.gold }}
            onMouseLeave={e => { if (toast.txHash) (e.currentTarget as HTMLElement).style.borderColor = borderColor }}>
            <span style={{ fontSize: fontSizes.md, flexShrink: 0, color: iconColor, fontWeight: 700 }}>{ICONS[toast.type]}</span>
            <span style={{ flex: 1, color: '#e0e0e0', lineHeight: 1.4 }}>{toast.message}</span>
            {toast.txHash && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )
}
